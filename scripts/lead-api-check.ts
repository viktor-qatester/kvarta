import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "@neondatabase/serverless";
import { POST } from "../app/api/lead/route";
import {
  countLeads,
  createLeadInTransaction,
  TEST_SCHEMA_DDL,
} from "../lib/lead-service";
import {
  normalizeBelarusPhone,
  validateLeadInput,
} from "../lib/lead-validation";
import type { ValidatedLead } from "../lib/lead-types";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(join(root, ".env.local"));

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL не задан");
  process.exit(1);
}

const TEST_SCHEMA = "lead_api_test" as const;
const failures: string[] = [];

function assert(name: string, condition: boolean, detail = "") {
  if (!condition) {
    failures.push(detail ? `${name}: ${detail}` : name);
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    console.log(`OK ${name}`);
  }
}

function sampleLead(overrides: Partial<ValidatedLead> = {}): ValidatedLead {
  const suffix = Math.floor(Math.random() * 10_000_000)
    .toString()
    .padStart(7, "0");
  const phoneNormalized = `+37529${suffix}`;
  return {
    name: "Тест",
    phoneNormalized,
    interest: "question",
    comment: null,
    productName: null,
    utmSource: "check",
    utmMedium: "script",
    utmCampaign: "lead-api",
    utmTerm: null,
    utmContent: null,
    landingUrl: "http://localhost:3000/?utm_source=check",
    ...overrides,
  };
}

function validApiBody(overrides: Record<string, unknown> = {}) {
  const lead = sampleLead();
  return {
    name: lead.name,
    phone: lead.phoneNormalized,
    interest: lead.interest,
    comment: lead.comment,
    productName: lead.productName,
    utmSource: lead.utmSource,
    utmMedium: lead.utmMedium,
    utmCampaign: lead.utmCampaign,
    utmTerm: lead.utmTerm,
    utmContent: lead.utmContent,
    landingUrl: lead.landingUrl,
    ...overrides,
  };
}

const pool = new Pool({ connectionString: databaseUrl });
const client = await pool.connect();

try {
  await client.query(TEST_SCHEMA_DDL);
  await client.query(
    "TRUNCATE lead_api_test.lead_dedup, lead_api_test.leads RESTART IDENTITY",
  );

  const invalid = validateLeadInput({ name: "  ", phone: "abc", interest: "order" });
  assert("validateLeadInput rejects bad data", invalid.ok === false);
  assert(
    "validateLeadInput reports phone error",
    invalid.ok === false && Boolean(invalid.fieldErrors.phone),
  );

  const n1 = normalizeBelarusPhone("+375 (29) 111-22-33");
  const n2 = normalizeBelarusPhone("+375291112233");
  assert("phone formatting equivalent", n1 === n2 && n1 === "+375291112233");

  const sample = sampleLead();
  assert(
    "sampleLead passes validateLeadInput",
    validateLeadInput({
      name: sample.name,
      phone: sample.phoneNormalized,
      interest: sample.interest,
    }).ok === true,
  );

  const publicBefore = await countLeads(client, "public");
  const badPhoneResponse = await POST(
    new Request("http://localhost/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Тест",
        phone: "+375abc",
        interest: "question",
      }),
    }),
  );
  assert("POST invalid phone returns 400", badPhoneResponse.status === 400);
  const publicAfter = await countLeads(client, "public");
  assert(
    "POST invalid phone does not insert into public.leads",
    publicBefore === publicAfter,
    `before=${publicBefore} after=${publicAfter}`,
  );

  const leadA = sampleLead();
  const created = await createLeadInTransaction(client, leadA, TEST_SCHEMA);
  assert("valid lead saved", created.status === "created");
  assert(
    "one row after first lead",
    (await countLeads(client, TEST_SCHEMA, leadA.phoneNormalized)) === 1,
  );

  const dup = await createLeadInTransaction(client, leadA, TEST_SCHEMA);
  assert("sequential duplicate blocked", dup.status === "duplicate");
  assert(
    "still one row after duplicate",
    (await countLeads(client, TEST_SCHEMA, leadA.phoneNormalized)) === 1,
  );

  const parallelPhone = sampleLead().phoneNormalized;
  const parallelLead = sampleLead({ phoneNormalized: parallelPhone });
  const parallelCount = 18;
  const parallelResults = await Promise.all(
    Array.from({ length: parallelCount }, async () => {
      const parallelClient = await pool.connect();
      try {
        return await createLeadInTransaction(parallelClient, parallelLead, TEST_SCHEMA);
      } finally {
        parallelClient.release();
      }
    }),
  );
  const createdParallel = parallelResults.filter((r) => r.status === "created").length;
  const dupParallel = parallelResults.filter((r) => r.status === "duplicate").length;
  assert("parallel exactly one created", createdParallel === 1, `got ${createdParallel}`);
  assert("parallel rest duplicate", dupParallel === parallelCount - 1, `got ${dupParallel}`);
  assert(
    "parallel one row in db",
    (await countLeads(client, TEST_SCHEMA, parallelPhone)) === 1,
  );

  const leadB = sampleLead();
  const other = await createLeadInTransaction(client, leadB, TEST_SCHEMA);
  assert("other phone accepted", other.status === "created");

  const expiredPhone = sampleLead().phoneNormalized;
  const expiredLead = sampleLead({ phoneNormalized: expiredPhone });
  await createLeadInTransaction(client, expiredLead, TEST_SCHEMA);
  await client.query(
    `UPDATE lead_api_test.lead_dedup SET last_accepted_at = now() - interval '11 minutes'
     WHERE phone_normalized = $1`,
    [expiredPhone],
  );
  const afterExpiry = await createLeadInTransaction(client, expiredLead, TEST_SCHEMA);
  assert("expired window allows new lead", afterExpiry.status === "created");
  assert(
    "two rows after expiry",
    (await countLeads(client, TEST_SCHEMA, expiredPhone)) === 2,
  );

  const activePhone = sampleLead().phoneNormalized;
  const activeLead = sampleLead({ phoneNormalized: activePhone });
  await createLeadInTransaction(client, activeLead, TEST_SCHEMA);
  await client.query(
    `UPDATE lead_api_test.lead_dedup SET last_accepted_at = now() - interval '2 minutes'
     WHERE phone_normalized = $1`,
    [activePhone],
  );
  const blocked = await createLeadInTransaction(client, activeLead, TEST_SCHEMA);
  assert("active window blocks", blocked.status === "duplicate");

  const utmPhone = sampleLead().phoneNormalized;
  const utmLead = sampleLead({
    phoneNormalized: utmPhone,
    utmSource: "src-x",
    utmMedium: "med-y",
    utmCampaign: "camp-z",
    landingUrl: "https://example.test/landing?utm_source=src-x",
  });
  await createLeadInTransaction(client, utmLead, TEST_SCHEMA);
  const utmRow = await client.query<{
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    landing_url: string;
  }>(
    `SELECT utm_source, utm_medium, utm_campaign, landing_url
     FROM lead_api_test.leads WHERE phone_normalized = $1 ORDER BY id DESC LIMIT 1`,
    [utmPhone],
  );
  const row = utmRow.rows[0];
  assert(
    "utm and landing stored",
    row?.utm_source === "src-x" &&
      row?.utm_medium === "med-y" &&
      row?.utm_campaign === "camp-z" &&
      row?.landing_url === "https://example.test/landing?utm_source=src-x",
  );
} finally {
  await client.query(
    "TRUNCATE lead_api_test.lead_dedup, lead_api_test.leads RESTART IDENTITY",
  );
  client.release();
  await pool.end();
}

const savedDatabaseUrl = process.env.DATABASE_URL;
process.env.DATABASE_URL = "postgresql://invalid:invalid@127.0.0.1:9/none";
try {
  const failResponse = await POST(
    new Request("http://localhost/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validApiBody()),
    }),
  );
  assert("POST returns 500 when database unavailable", failResponse.status === 500);
  const payload = (await failResponse.json()) as { error?: string };
  assert("POST server error is controlled JSON", payload.error === "server");
} finally {
  process.env.DATABASE_URL = savedDatabaseUrl;
}

if (failures.length) {
  console.error(`\n${failures.length} проверок не прошло`);
  process.exit(1);
}

console.log("\nВсе проверки lead-api прошли");
