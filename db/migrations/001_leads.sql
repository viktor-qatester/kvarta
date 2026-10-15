-- Заявки с лендинга «Кварта». Применять один раз: npm run db:migrate

CREATE TABLE IF NOT EXISTS leads (
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

CREATE TABLE IF NOT EXISTS lead_dedup (
  phone_normalized TEXT PRIMARY KEY,
  last_accepted_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS leads_phone_created_at_idx
  ON leads (phone_normalized, created_at DESC);

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
