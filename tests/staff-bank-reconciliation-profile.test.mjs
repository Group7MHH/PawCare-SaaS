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
test('Admin-only reconciliation retains locking, audit, and historical bank migration',()=>{
 const reconcile=read('backend/src/routes/payments.ts').split("router.post('/:id/reconcile'")[1];
 assert.ok(reconcile.includes("requireRole('admin')"));
 assert.ok(!reconcile.includes("requireRole('admin','staff')"));
 assert.ok(!reconcile.includes('staffReviewer'));
 assert.ok(reconcile.includes('FOR UPDATE OF p,a'));
 assert.ok(reconcile.includes('reviewed_by=?'));
 assert.ok(reconcile.includes('role_audit_logs'));
 const db=read('database/011_staff_payment_reconciliation.sql');
 assert.ok(db.includes('UNIQUE INDEX'));
 assert.ok(db.includes('(organization_id,bank_transaction_reference)'));
 assert.ok(read('backend/src/migrate.ts').includes('011_staff_payment_reconciliation.sql'));
});
test('Staff sees payment status without financial actions; Admin retains refunds',()=>{
 const appointments=read('frontend/src/pages/AdminAppointments.tsx');
 const payment=read('frontend/src/components/PaymentPanel.tsx');
 assert.ok(appointments.includes("selected.staff_id===user.id&&selected.status!=='pending'"));
 assert.ok(appointments.includes('appointmentId={selected.id} staff'));
 assert.ok(payment.includes('Bạn chỉ được xem trạng thái thanh toán của lịch đã nhận'));
 assert.ok(!payment.includes('pc-staff-reconcile'));
 assert.ok(!payment.includes('staffCanConfirm'));

 assert.ok(!payment.includes('verification_reference:verificationReference.trim()'));
 assert.ok(payment.includes('Xác nhận chuyển khoản (Demo)'));
 assert.ok(payment.includes('trạng thái thanh toán chỉ được xác nhận trong PawCare'));
 assert.ok(payment.includes('{admin&&<div className="pc-payment-reconcile">'));
 assert.ok(payment.includes("confirm_refund"));
 assert.ok(!read('frontend/src/pages/CustomerPayments.tsx').includes('confirm_paid'));
});
