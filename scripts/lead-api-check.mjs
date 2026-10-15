import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "@neondatabase/serverless";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
process.loadEnvFile(join(root, ".env.local"));

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL не задан");
  process.exit(1);
}

const DEDUP_WINDOW_MS = 10 * 60 * 1000;
const SCHEMA = "lead_api_test";

const TEST_SCHEMA_DDL = `
CREATE SCHEMA IF NOT EXISTS lead_api_test;

CREATE TABLE IF NOT EXISTS lead_api_test.leads (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  phone_normalized TEXT NOT NULL,
  interest TEXT NOT NULL CHECK (interest IN ('subscription', 'order', 'question')),
  comment TEXT,
  product_name TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  landing_url TEXT
);

CREATE TABLE IF NOT EXISTS lead_api_test.lead_dedup (
  phone_normalized TEXT PRIMARY KEY,
  last_accepted_at TIMESTAMPTZ NOT NULL
);
`;

function qIdent(table) {
  return `"${SCHEMA}"."${table}"`;
}

function normalizeBelarusPhone(raw) {
  const trimmed = raw.trim();
  if (!trimmed || /[^\d+\s()\-]/.test(trimmed)) {
    return null;
  }
  let compact = trimmed.replace(/[\s\-()]/g, "");
  if (compact.startsWith("375")) {
    compact = `+${compact}`;
  } else if (!compact.startsWith("+375")) {
    return null;
  }
  if (!/^\+375\d{9}$/.test(compact)) {
    return null;
  }
  return compact;
}

async function createLeadInTransaction(client, lead) {
  const leads = qIdent("leads");
  const dedup = qIdent("lead_dedup");
  const lockKey = `lead_dedup:${lead.phoneNormalized}`;

  await client.query("BEGIN");
  try {
    await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [lockKey]);

    const existing = await client.query(
      `SELECT last_accepted_at FROM ${dedup} WHERE phone_normalized = $1 FOR UPDATE`,
      [lead.phoneNormalized],
    );

    if (existing.rowCount > 0) {
      const last = new Date(existing.rows[0].last_accepted_at);
      if (Date.now() - last.getTime() < DEDUP_WINDOW_MS) {
        await client.query("ROLLBACK");
        return { status: "duplicate" };
      }
    }

    await client.query(
      `INSERT INTO ${leads} (
        name, phone_normalized, interest, comment, product_name,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content, landing_url
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        lead.name,
        lead.phoneNormalized,
        lead.interest,
        lead.comment,
        lead.productName,
        lead.utmSource,
        lead.utmMedium,
        lead.utmCampaign,
        lead.utmTerm,
        lead.utmContent,
        lead.landingUrl,
      ],
    );

    await client.query(
      `INSERT INTO ${dedup} (phone_normalized, last_accepted_at)
       VALUES ($1, now())
       ON CONFLICT (phone_normalized)
       DO UPDATE SET last_accepted_at = EXCLUDED.last_accepted_at`,
      [lead.phoneNormalized],
    );

    await client.query("COMMIT");
    return { status: "created" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function countLeads(client, phoneNormalized) {
  const leads = qIdent("leads");
  if (phoneNormalized) {
    const result = await client.query(
      `SELECT count(*)::int AS count FROM ${leads} WHERE phone_normalized = $1`,
      [phoneNormalized],
    );
    return result.rows[0].count;
  }
  const result = await client.query(`SELECT count(*)::int AS count FROM ${leads}`);
  return result.rows[0].count;
}

const pool = new Pool({ connectionString: databaseUrl });
const client = await pool.connect();
const failures = [];

function assert(name, condition, detail = "") {
  if (!condition) {
    failures.push(detail ? `${name}: ${detail}` : name);
    console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    console.log(`OK ${name}`);
  }
}

function sampleLead(overrides = {}) {
  const suffix = Math.floor(Math.random() * 1_000_000_000)
    .toString()
    .padStart(9, "0");
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

try {
  await client.query(TEST_SCHEMA_DDL);
  await client.query(
    "TRUNCATE lead_api_test.lead_dedup, lead_api_test.leads RESTART IDENTITY",
  );

  const beforeBad = await countLeads(client);
  assert("invalid phone normalization fails", normalizeBelarusPhone("abc") === null);
  const afterBad = await countLeads(client);
  assert("invalid input not stored", beforeBad === afterBad);

  const n1 = normalizeBelarusPhone("+375 (29) 111-22-33");
  const n2 = normalizeBelarusPhone("+375291112233");
  assert("phone formatting equivalent", n1 === n2 && n1 === "+375291112233");

  const leadA = sampleLead();
  const created = await createLeadInTransaction(client, leadA);
  assert("valid lead saved", created.status === "created");
  assert(
    "one row after first lead",
    (await countLeads(client, leadA.phoneNormalized)) === 1,
  );

  const dup = await createLeadInTransaction(client, leadA);
  assert("sequential duplicate blocked", dup.status === "duplicate");
  assert(
    "still one row after duplicate",
    (await countLeads(client, leadA.phoneNormalized)) === 1,
  );

  const parallelPhone = sampleLead().phoneNormalized;
  const parallelLead = sampleLead({ phoneNormalized: parallelPhone });
  const parallelCount = 18;
  const parallelResults = await Promise.all(
    Array.from({ length: parallelCount }, async () => {
      const parallelClient = await pool.connect();
      try {
        return await createLeadInTransaction(parallelClient, parallelLead);
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
    (await countLeads(client, parallelPhone)) === 1,
  );

  const leadB = sampleLead();
  const other = await createLeadInTransaction(client, leadB);
  assert("other phone accepted", other.status === "created");

  const expiredPhone = sampleLead().phoneNormalized;
  const expiredLead = sampleLead({ phoneNormalized: expiredPhone });
  await createLeadInTransaction(client, expiredLead);
  await client.query(
    `UPDATE lead_api_test.lead_dedup SET last_accepted_at = now() - interval '11 minutes'
     WHERE phone_normalized = $1`,
    [expiredPhone],
  );
  const afterExpiry = await createLeadInTransaction(client, expiredLead);
  assert("expired window allows new lead", afterExpiry.status === "created");
  assert(
    "two rows after expiry",
    (await countLeads(client, expiredPhone)) === 2,
  );

  const activePhone = sampleLead().phoneNormalized;
  const activeLead = sampleLead({ phoneNormalized: activePhone });
  await createLeadInTransaction(client, activeLead);
  await client.query(
    `UPDATE lead_api_test.lead_dedup SET last_accepted_at = now() - interval '2 minutes'
     WHERE phone_normalized = $1`,
    [activePhone],
  );
  const blocked = await createLeadInTransaction(client, activeLead);
  assert("active window blocks", blocked.status === "duplicate");

  const utmPhone = sampleLead().phoneNormalized;
  const utmLead = sampleLead({
    phoneNormalized: utmPhone,
    utmSource: "src-x",
    utmMedium: "med-y",
    utmCampaign: "camp-z",
    landingUrl: "https://example.test/landing?utm_source=src-x",
  });
  await createLeadInTransaction(client, utmLead);
  const utmRow = await client.query(
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

if (failures.length) {
  console.error(`\n${failures.length} проверок не прошло`);
  process.exit(1);
}

console.log("\nВсе проверки lead-api прошли");
