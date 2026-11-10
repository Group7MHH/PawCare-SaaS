-- 010_payment_bank_settings.sql
-- Admin-maintained bank recipient details. A row overrides Render env defaults,
-- including explicit disabled mode.
CREATE TABLE IF NOT EXISTS payment_bank_settings (
 organization_id INTEGER PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
 bank_name VARCHAR(80) NOT NULL,
 bank_account VARCHAR(32) NOT NULL,
 bank_owner VARCHAR(100) NOT NULL,
 enabled BOOLEAN NOT NULL DEFAULT TRUE,
 updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Historical payments do not receive guessed bank details. New transfers capture
-- the payee at booking/method-selection time so Admin edits do not silently reroute money.
ALTER TABLE payments ADD COLUMN IF NOT EXISTS bank_name_snapshot VARCHAR(80);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS bank_account_snapshot VARCHAR(32);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS bank_owner_snapshot VARCHAR(100);
