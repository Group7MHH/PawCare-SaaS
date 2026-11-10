import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Admin manages receiving bank through a protected interface, not Render variables',()=>{
 const app=read('frontend/src/main.tsx');
 const nav=read('frontend/src/components/Layout.tsx');
 const route=read('backend/src/routes/payments.ts');
 const page=read('frontend/src/pages/AdminBankSettings.tsx');
 assert.ok(app.includes('<Route path="/admin/payment-settings" element={<AdminOnly><Navigate to="/profile" replace/></AdminOnly>}/>'));
 assert.ok(read('frontend/src/pages/Profile.tsx').includes("{user?.role==='admin'&&<AdminBankSettings embedded/>}"));
 assert.ok(!nav.includes("to:'/admin/payment-settings'"));
 assert.ok(route.includes("router.put('/admin-bank',requireRole('admin')"));
 assert.ok(route.includes("router.get('/admin-bank',requireRole('admin')"));
 assert.ok(route.includes("payment_bank_settings"));
 assert.ok(route.includes("payment_bank.update"));
 for(const value of ['name','account','owner','enabled']) assert.ok(page.includes(value));
});
test('bank settings migration snapshots transfer recipient and preserves older booked instructions',()=>{
 const migration=read('database/010_payment_bank_settings.sql');
 const migrator=read('backend/src/migrate.ts');
 const booking=read('backend/src/routes/appointments.ts');
 const payments=read('backend/src/routes/payments.ts');
 assert.ok(migrator.includes('010_payment_bank_settings.sql'));
 for(const field of ['bank_name_snapshot','bank_account_snapshot','bank_owner_snapshot']) {
  assert.ok(migration.includes(field),field);
  assert.ok(booking.includes(field),field);
  assert.ok(payments.includes(field),field);
 }
 assert.ok(booking.includes('getActiveBank'));
 assert.ok(payments.includes("recipient?.name??null"));
 assert.ok(read('backend/src/lib/payment-bank.ts').includes("source:'database'"));
});
test('Staff only views assigned payment status; Admin handles all confirmations and refunds',()=>{
 const backend=read('backend/src/routes/appointments.ts');
 const screen=read('frontend/src/pages/AdminAppointments.tsx');
 const dashboard=read('frontend/src/pages/StaffDashboard.tsx');
 assert.ok(backend.includes('LEFT JOIN payments pay ON pay.appointment_id=a.id'));
 assert.ok(backend.includes('pay.status AS payment_status'));
 assert.ok(backend.includes("if(req.user!.role==='staff')"));
 assert.ok(backend.includes("clauses.push('a.staff_id=?')"));
 assert.ok(screen.includes('pc-staff-pay-readonly'));
 assert.ok(screen.includes('appointmentId={selected.id} staff'));
 assert.ok(screen.includes('Đã thanh toán'));
 assert.ok(dashboard.includes('pc-staff-pay-tag'));
 assert.ok(!dashboard.includes('/reconcile'));
 const payment=read('backend/src/routes/payments.ts');
 assert.ok(payment.includes("router.post('/:id/reconcile',requireRole('admin')"));
 assert.ok(!payment.includes("requireRole('admin','staff')"));
 assert.ok(!payment.includes("payment.staff_confirm_paid"));
 assert.ok(payment.includes("demo_confirmation:demoBankConfirmation"));
});
test('customer payment detail no longer uses a dark overlay or body scroll lock',()=>{
 const page=read('frontend/src/pages/CustomerPayments.tsx');
 const style=read('frontend/src/payment-admin-polish.css');
 assert.ok(page.includes('pc-wallet-inline-detail'));
 assert.ok(page.includes('detailRef.current?.scrollIntoView'));
 assert.ok(!page.includes('pc-wallet-detail-backdrop'));
 assert.ok(!page.includes("document.body.style.overflow='hidden'"));
 assert.ok(style.includes('.pc-wallet-inline-detail'));
 assert.ok(style.includes('prefers-reduced-motion:reduce'));
});
