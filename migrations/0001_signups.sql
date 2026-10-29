-- Early-access signups, one row per product + email.
CREATE TABLE signups (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  product        TEXT NOT NULL,
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  whatsapp       TEXT NOT NULL,
  role           TEXT NOT NULL,
  npwp_count     TEXT NOT NULL,
  invoice_volume TEXT NOT NULL,
  plan           TEXT NOT NULL,
  billing        TEXT NOT NULL,
  source         TEXT,
  utm_source     TEXT,
  utm_medium     TEXT,
  utm_campaign   TEXT,
  referrer       TEXT,
  country        TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (product, email)
);
