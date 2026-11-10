import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('rescheduling shares the capacity lock and excludes the edited booking',()=>{
 const booking=read('backend/src/routes/appointments.ts');
 assert.ok(booking.includes('hasBookingCapacity(db,orgId(req),st,en,id)'));
 assert.ok(booking.includes('if(d.starts_at!==undefined)await db.query'));
 assert.ok(booking.includes("pg_advisory_xact_lock($1,$2)"));
 assert.ok(booking.includes("exceptId?'AND id<>?':''"));
 assert.ok(booking.includes('if(!staffId&&fresh.status===\'confirmed\''));
});
test('staff cannot delete records by another author or automatic appointment records',()=>{
 const pets=read('backend/src/routes/pets.ts');
 assert.ok(pets.includes('if(record.appointment_id!==null)'));
 assert.ok(pets.includes('record.created_by_user_id!==req.user!.id'));
 assert.ok(pets.includes('appointment_id IS NULL AND created_by_user_id=?'));
});
test('Admin bank changes require password reauthentication and customer cannot see private reconciliation notes',()=>{
 const payments=read('backend/src/routes/payments.ts');
 const frontend=read('frontend/src/pages/AdminBankSettings.tsx');
 assert.ok(payments.includes("bcrypt.compare(data.admin_password,adminAccount.password_hash)"));
 assert.ok(frontend.includes('admin_password:adminPassword'));
 assert.ok(frontend.includes('type="password"'));
 assert.ok(payments.includes("req.user!.role==='admin'?p:{...p,admin_note:null"));
 assert.ok(read('frontend/src/components/PaymentPanel.tsx').includes('admin&&p.admin_note'));
});
test('bank confirmation demo keeps actor and audit without requiring reference or note',()=>{
 const payments=read('backend/src/routes/payments.ts');
 const panel=read('frontend/src/components/PaymentPanel.tsx');
 assert.ok(payments.includes("requireRole('admin')"));
 assert.ok(payments.includes('demo_confirmation:demoBankConfirmation'));
 assert.ok(payments.includes('reviewed_by=?'));
 assert.ok(!payments.includes('verification_reference'));
 assert.ok(!panel.includes('verificationReference'));
 assert.ok(panel.includes('Xác nhận chuyển khoản (Demo)'));
});
test('dashboard distinguishes cash collected from completed services; next booking is queried globally',()=>{
 const backend=read('backend/src/routes/management.ts');
 const admin=read('frontend/src/pages/AdminDashboard.tsx');
 const overview=read('frontend/src/pages/Overview.tsx');
 assert.ok(backend.includes("SUM(p.amount) FILTER(WHERE p.status='paid')"));
 assert.ok(backend.includes('collected:finance.collected'));
 assert.ok(admin.includes('stats.collected'));
 assert.ok(admin.includes('stats.refund_required'));
 assert.ok(backend.includes('ORDER BY CASE WHEN a.status=\'in_progress\' THEN 0 ELSE 1 END,a.starts_at ASC LIMIT 1'));
 assert.ok(overview.includes('dashboard?.next||null'));
});
test('service name snapshot is written at booking, preserved historically and shown on all appointments',()=>{
 const migration=read('database/012_service_name_snapshot.sql');
 const bookings=read('backend/src/routes/appointments.ts');
 const dashboard=read('backend/src/routes/management.ts');
 assert.ok(migration.includes('ADD COLUMN IF NOT EXISTS name_snapshot'));
 assert.ok(read('backend/src/migrate.ts').includes('012_service_name_snapshot.sql'));
 assert.ok(bookings.includes('service.duration_minutes,service.name'));
 assert.ok(bookings.includes('COALESCE(aps.name_snapshot,ms.name)'));
 assert.ok(dashboard.includes('COALESCE(aps.name_snapshot,svc.name)'));
});
test('overdue bookings are visibly flagged for Admin, without silently cancelling orders',()=>{
 const appointments=read('backend/src/routes/appointments.ts');
 const screen=read('frontend/src/pages/AdminAppointments.tsx');
 assert.ok(appointments.includes('is_overdue:overdue'));
 assert.ok(appointments.includes("a.status='confirmed' AND a.starts_at < now()"));
 assert.ok(screen.includes('a.is_overdue'));
 assert.ok(screen.includes('selected.is_overdue'));
 assert.ok(!appointments.includes('autoCancelOverdue'));
});
