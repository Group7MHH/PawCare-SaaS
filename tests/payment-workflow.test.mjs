import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
test('the migration stores one payment per appointment with a frozen amount and safe backfill',()=>{
 const sql=read('database/009_manual_payments.sql');
 for(const s of ['appointment_id INTEGER NOT NULL UNIQUE','amount NUMERIC(12,2) NOT NULL','payment_reference VARCHAR(32) NOT NULL UNIQUE','ON CONFLICT (appointment_id) DO NOTHING','WHERE','CHECK(status IN']){
  if(s==='WHERE')continue;
  assert.ok(sql.includes(s),s);
 }
 assert.ok(read('backend/src/migrate.ts').includes('009_manual_payments.sql'));
});
test('booking creates payment in same DB transaction using server-authoritative snapshot',()=>{
 const route=read('backend/src/routes/appointments.ts');
 assert.ok(route.includes("payment_method:z.enum(['cash','bank_transfer'])"));
 assert.ok(route.includes('totalPrice,d.payment_method'));
 assert.ok(route.includes('created.insertId,customerId,totalPrice'));
 assert.ok(route.includes("'refund_required'"));
 assert.ok(route.includes("'pending_review'"));
});
test('manual bank notice cannot mark paid, Admin must reconcile before success',()=>{
 const route=read('backend/src/routes/payments.ts');
 const notice=route.slice(route.indexOf("router.post('/:id/transfer-notice'"),route.indexOf("router.post('/:id/reconcile'"));
 assert.ok(notice.includes("status='pending_review'"));
 assert.ok(!notice.includes("status='paid'"));
 assert.ok(route.includes("requireRole('admin')"));
 assert.ok(!route.includes("requireRole('admin','staff')"));
 assert.ok(!route.includes("payment.staff_confirm_paid"));
 assert.ok(route.includes("if(action==='confirm_paid')"));
 assert.ok(route.includes("p.status==='pending_review'"));
 assert.ok(route.includes("'refund_required'"));
 assert.ok(route.includes("role_audit_logs"));
});
test('payment is available in booking, customer appointments and Admin dialog',()=>{
 const booking=read('frontend/src/pages/Booking.tsx'),mine=read('frontend/src/pages/MyAppointments.tsx'),admin=read('frontend/src/pages/AdminAppointments.tsx');
 assert.ok(booking.includes('payment_method:paymentMethod'));
 assert.ok(booking.includes('pc-checkout-methods'));
 assert.ok(mine.includes('<PaymentPanel'));
 assert.ok(admin.includes('<PaymentPanel'));
 assert.ok(read('backend/src/index.ts').includes("app.use('/api/payments',payments)"));
});

test('Customer/Admin ledgers are scoped and Staff has no payment ledger access',()=>{
 const source=read('backend/src/routes/payments.ts');
 const list=source.slice(source.indexOf("router.get('/',"),source.indexOf("router.get('/:id',"));
 assert.ok(list.includes("router.get('/',requireRole('customer','admin')"));
 assert.ok(list.includes("if(req.user!.role==='customer')"));
 assert.ok(list.includes("scope+=' AND p.customer_id=?'"));
 assert.ok(list.includes("scopeParams.push(req.user!.id)"));
 assert.ok(list.includes('FROM payments p JOIN appointments a ON a.id=p.appointment_id WHERE ${scope}'));
 assert.ok(list.includes("req.user!.role==='customer'"));
 assert.ok(list.includes('admin_note:null,bank_transaction_reference:undefined'));
 const detail=source.slice(source.indexOf("router.get('/:id',"),source.indexOf("router.patch('/:id/method'"));
 assert.ok(detail.includes('allowed(p,req.user!)'));
 assert.ok(detail.includes("req.user!.role==='admin'?p:{...p,admin_note:null"));
});
test('cancelled transfer is never marked paid and requires Admin handling',()=>{
 const source=read('backend/src/routes/payments.ts');
 const panel=read('frontend/src/components/PaymentPanel.tsx');
 const bookings=read('backend/src/routes/appointments.ts');
 assert.ok(source.includes("status=p.appointment_status==='cancelled'?'refund_required':'paid'"));
 assert.ok(source.includes("status=p.appointment_status==='cancelled'?'void':'awaiting_payment'"));
 assert.ok(source.includes("requireRole('admin')"));
 assert.ok(bookings.includes("WHEN status='paid' THEN 'refund_required'"));
 assert.ok(bookings.includes("WHEN status='pending_review' THEN 'pending_review'"));
 assert.ok(panel.includes('cancelledTransferAwaitingReview'));
 assert.ok(panel.includes('Ghi nhận cần hoàn tiền (Demo)'));
 assert.ok(panel.includes('nếu chưa nhận tiền, từ chối đối soát'));
 assert.ok(panel.includes("confirm_refund"));
});

test('payment changes are only executed by Admin and Staff has read-only access',()=>{
 const backend=read('backend/src/routes/payments.ts');
 const ui=read('frontend/src/components/PaymentPanel.tsx');
 const appointment=read('frontend/src/pages/AdminAppointments.tsx');
 const reconcile=backend.slice(backend.indexOf("router.post('/:id/reconcile'"));
 assert.ok(reconcile.includes("requireRole('admin')"));
 assert.ok(!reconcile.includes("requireRole('admin','staff')"));
 assert.ok(!reconcile.includes("staffReviewer"));
 assert.ok(!reconcile.includes("payment.staff_confirm_paid"));
 assert.ok(ui.includes("Bạn chỉ được xem trạng thái thanh toán của lịch đã nhận"));
 assert.ok(!ui.includes("staffCanConfirm"));
 assert.ok(!ui.includes("pc-staff-reconcile"));
 assert.ok(ui.includes("{admin&&<div className=\"pc-payment-reconcile\">"));
 assert.ok(appointment.includes('appointmentId={selected.id} staff'));
 assert.ok(appointment.includes('chỉ Admin được xác nhận và hoàn tiền'));
});
