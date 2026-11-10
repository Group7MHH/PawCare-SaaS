-- 013_awaiting_bank_payment.sql
-- Distinguish an uncollected cash payment from a bank transfer awaiting the customer.
-- Additive, preserves paid/reconciliation/refund history.
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check
 CHECK(status IN ('unpaid','awaiting_payment','pending_review','paid','refund_required','refunded','void'));
-- Legacy bank transfers that were unpaid now enter the new waiting state.
-- Cancelled payments (void) and already reported transfers (pending_review) are untouched.
UPDATE payments SET status='awaiting_payment'
 WHERE method='bank_transfer' AND status='unpaid';
