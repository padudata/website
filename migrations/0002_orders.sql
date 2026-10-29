-- Kreditin checkout orders. Until payment is integrated, an order records
-- intent only: status stays 'menunggu_aktivasi' and nothing is charged.
CREATE TABLE orders (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  code           TEXT NOT NULL UNIQUE,
  product        TEXT NOT NULL,
  plan           TEXT NOT NULL,
  billing        TEXT NOT NULL,
  amount         INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'menunggu_aktivasi',
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  whatsapp       TEXT NOT NULL,
  company        TEXT,
  role           TEXT NOT NULL,
  npwp_count     TEXT NOT NULL,
  invoice_volume TEXT NOT NULL,
  source         TEXT,
  utm_source     TEXT,
  utm_medium     TEXT,
  utm_campaign   TEXT,
  referrer       TEXT,
  country        TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX orders_email ON orders (email);
