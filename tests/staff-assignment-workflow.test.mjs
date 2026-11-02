import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('migration preserves bookings and stores decline history',()=>{
 const sql=read('database/007_staff_assignment.sql');
 const migrate=read('backend/src/migrate.ts');
 for(const name of ['needs_admin_attention','assignment_note','appointment_staff_declines','PRIMARY KEY (appointment_id,staff_id)','ON DELETE CASCADE'])assert.ok(sql.includes(name),name);
 assert.match(migrate,/007_staff_assignment\.sql/);
 assert.doesNotMatch(sql,/TRUNCATE|DELETE FROM appointments/i);
});
test('only assigned Staff can accept or decline in a transaction',()=>{
 const api=read('backend/src/routes/assignment.ts');
 for(const marker of ["router.post('/:id/accept',requireRole('staff')","router.post('/:id/decline',requireRole('staff')","appt.staff_id!==staffId","appt.status!=='pending'","await transaction(async db=>","await lockStaff(db,"])assert.ok(api.includes(marker),marker);
 assert.match(api,/UPDATE appointments SET status='confirmed'/);
 assert.match(api,/INSERT INTO appointment_staff_declines/);
});
test('declining reassigns safely and flags unassignable bookings for admin',()=>{
 const api=read('backend/src/routes/assignment.ts');
 assert.match(api,/pg_advisory_xact_lock/);
 assert.match(api,/NOT EXISTS\(SELECT 1 FROM appointment_staff_declines/);
 assert.match(api,/NOT EXISTS\(SELECT 1 FROM appointments a/);
 assert.match(api,/needs_admin_attention=\?/);
 assert.match(api,/!alternate/);
 assert.match(api,/status='pending'/);
 assert.doesNotMatch(api,/status='cancelled'/);
});
test('original booking keeps bundle, role guards and anti-conflict locking',()=>{
 const api=read('backend/src/routes/appointments.ts');
 const entry=read('backend/src/index.ts');
 for(const marker of ['service_ids:z.array','INSERT INTO appointment_services','await lockStaff(db,[assigned])','await verifyAvailability(db,assigned,st,en)','validateBookingTime(start,totalDuration)'])assert.ok(api.includes(marker),marker);
 assert.ok(entry.indexOf("app.use('/api/appointments',assignment)")<entry.indexOf("app.use('/api/appointments',appointments)"));
 assert.match(api,/a\.needs_admin_attention=TRUE/);
 assert.match(api,/ORDER BY \(SELECT COUNT\(\*\)/);
});
test('Staff acceptance and refusal shown in existing operation UI',()=>{
 const page=read('frontend/src/pages/AdminAppointments.tsx');
 const dashboard=read('frontend/src/pages/AdminDashboard.tsx');
 assert.match(page,/decision\.mutate\('accept'\)/);
 assert.match(page,/decision\.mutate\('decline'\)/);
 assert.match(page,/Cần điều phối/);
 assert.match(page,/useState\(user\?\.role==='admin'\)/);
 assert.match(dashboard,/admin-assignment-exceptions/);
});
test('Admin password column text changed while real lock status remains distinct',()=>{
 const account=read('frontend/src/pages/Accounts.tsx');
 assert.match(account,/Đã khóa<\/span>/);
 assert.doesNotMatch(account,/Đã băm<\/span>/);
 assert.match(account,/account\.is_active\?'Hoạt động':'Bị khóa'/);
 assert.match(account,/không có nghĩa tài khoản bị khóa/);
});
