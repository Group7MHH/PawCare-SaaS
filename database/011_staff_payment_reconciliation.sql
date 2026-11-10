-- 011_staff_payment_reconciliation.sql
-- Prevent a bank transaction reference from being used to settle multiple bookings.
-- Existing historical payments remain unchanged (NULL reference).
ALTER TABLE payments ADD COLUMN IF NOT EXISTS bank_transaction_reference VARCHAR(80);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_bank_transaction_reference
 ON payments(organization_id,bank_transaction_reference)
 WHERE bank_transaction_reference IS NOT NULL;
