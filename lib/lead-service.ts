import type { PoolClient } from "@neondatabase/serverless";
import { assertLeadSchema, type LeadSchema, type ValidatedLead } from "@/lib/lead-types";

const DEDUP_WINDOW_MS = 10 * 60 * 1000;

function qIdent(schema: LeadSchema, table: string): string {
  assertLeadSchema(schema);
  return `"${schema}"."${table}"`;
}

export type CreateLeadResult =
  | { status: "created"; leadId: number }
  | { status: "duplicate" };

export async function createLeadInTransaction(
  client: PoolClient,
  lead: ValidatedLead,
  schema: LeadSchema = "public",
): Promise<CreateLeadResult> {
  const leads = qIdent(schema, "leads");
  const dedup = qIdent(schema, "lead_dedup");
  const lockKey = `lead_dedup:${lead.phoneNormalized}`;

  await client.query("BEGIN");
  try {
    await client.query(`SELECT pg_advisory_xact_lock(hashtext($1))`, [lockKey]);

    const existing = await client.query<{ last_accepted_at: Date }>(
      `SELECT last_accepted_at FROM ${dedup} WHERE phone_normalized = $1 FOR UPDATE`,
      [lead.phoneNormalized],
    );

    if (existing.rowCount && existing.rowCount > 0) {
      const last = new Date(existing.rows[0].last_accepted_at);
      if (Date.now() - last.getTime() < DEDUP_WINDOW_MS) {
        await client.query("ROLLBACK");
        return { status: "duplicate" };
      }
    }

    const inserted = await client.query<{ id: string }>(
      `INSERT INTO ${leads} (
        name, phone_normalized, interest, comment, product_name,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content, landing_url
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING id`,
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
    return { status: "created", leadId: Number(inserted.rows[0].id) };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export async function countLeads(
  client: PoolClient,
  schema: LeadSchema,
  phoneNormalized?: string,
): Promise<number> {
  const leads = qIdent(schema, "leads");
  if (phoneNormalized) {
    const result = await client.query<{ count: string }>(
      `SELECT count(*)::text AS count FROM ${leads} WHERE phone_normalized = $1`,
      [phoneNormalized],
    );
    return Number(result.rows[0].count);
  }
  const result = await client.query<{ count: string }>(
    `SELECT count(*)::text AS count FROM ${leads}`,
  );
  return Number(result.rows[0].count);
}

export const TEST_SCHEMA_DDL = `
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
