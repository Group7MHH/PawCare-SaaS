import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Admin bank editor is embedded in Admin profile only, no sidebar link',()=>{
 const profile=read('frontend/src/pages/Profile.tsx');
 const sidebar=read('frontend/src/components/Layout.tsx');
 const settings=read('frontend/src/pages/AdminBankSettings.tsx');
 assert.ok(profile.includes("{user?.role==='admin'&&<AdminBankSettings embedded/>}"));
 assert.ok(settings.includes('embedded=false'));
 assert.ok(settings.includes('pc-profile-bank-title'));
 assert.ok(!sidebar.includes("to:'/admin/payment-settings'"));
 assert.ok(read('frontend/src/main.tsx').includes('<Navigate to="/profile" replace/>'));
});
test('only staff assigned to confirmed or in-progress bookings can confirm actual bank transfers',()=>{
 const backend=read('backend/src/routes/payments.ts');
 const start=backend.indexOf("router.post('/:id/reconcile'");
 const reconcile=backend.slice(start);
 assert.ok(reconcile.includes("requireRole('admin','staff')"));
 assert.ok(reconcile.includes("p.staff_id!==req.user!.id"));
 assert.ok(reconcile.includes("if(action!=='confirm_paid')"));
 assert.ok(reconcile.includes("p.method!=='bank_transfer'||p.status!=='pending_review'"));
 assert.ok(reconcile.includes("['confirmed','in_progress','completed']"));
 assert.ok(reconcile.includes("verification_reference.length<6"));
 assert.ok(reconcile.includes("note.length<10"));
 assert.ok(reconcile.includes('FOR UPDATE OF p,a'));
 assert.ok(reconcile.includes('bank_transaction_reference=CASE'));
 assert.ok(reconcile.includes("payment.staff_confirm_paid"));
 const db=read('database/011_staff_payment_reconciliation.sql');
 assert.ok(db.includes('UNIQUE INDEX'));
 assert.ok(db.includes('(organization_id,bank_transaction_reference)'));
 assert.ok(read('backend/src/migrate.ts').includes('011_staff_payment_reconciliation.sql'));
});
test('Staff sees reconcile form only for their accepted appointments, Admin retains refunds',()=>{
 const appointments=read('frontend/src/pages/AdminAppointments.tsx');
 const payment=read('frontend/src/components/PaymentPanel.tsx');
 assert.ok(appointments.includes("selected.staff_id===user.id&&selected.status!=='pending'"));
 assert.ok(appointments.includes('appointmentId={selected.id} staff'));
 assert.ok(payment.includes('verification_reference:verificationReference.trim()'));
 assert.ok(payment.includes('Đã kiểm tra sao kê'));
 assert.ok(payment.includes('Xác nhận đã nhận chuyển khoản'));
 assert.ok(payment.includes('{admin&&<div className="pc-payment-reconcile">'));
 assert.ok(payment.includes("confirm_refund"));
 assert.ok(!read('frontend/src/pages/CustomerPayments.tsx').includes('confirm_paid'));
});
