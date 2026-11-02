import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('migrations preserve existing bookings and create an indexed Staff queue',()=>{
 const prior=read('database/007_staff_assignment.sql');
 const queue=read('database/008_staff_self_service_queue.sql');
 const migrator=read('backend/src/migrate.ts');
 for(const name of ['needs_admin_attention','appointment_staff_declines','PRIMARY KEY (appointment_id,staff_id)'])
  assert.ok(prior.includes(name),name);
 assert.match(queue,/WHERE staff_id IS NULL AND status='pending'/);
 assert.match(migrator,/008_staff_self_service_queue\.sql/);
 assert.doesNotMatch(queue,/TRUNCATE|DELETE FROM appointments/i);
});

test('Staff can claim unassigned bookings or a booking targeted to them',()=>{
 const api=read('backend/src/routes/assignment.ts');
 for(const marker of ["router.post('/:id/accept',requireRole('staff')","router.post('/:id/decline',requireRole('staff')","appt.staff_id!==null&&appt.staff_id!==staffId","await transaction(async db=>","await lockStaff(db,[staffId])","status='confirmed'","staff_id=?"])
  assert.ok(api.includes(marker),marker);
 assert.match(api,/AND a?\.?staff_id=\?/);
 assert.match(api,/staff_id=\? AND id<>\?/);
 assert.match(api,/appointment_staff_declines WHERE appointment_id=\?/);
});

test('Staff returns a booking to the pool rather than canceling it',()=>{
 const api=read('backend/src/routes/assignment.ts');
 assert.match(api,/pg_advisory_xact_lock/);
 assert.match(api,/INSERT INTO appointment_staff_declines/);
 assert.match(api,/NOT EXISTS\(SELECT 1 FROM appointment_staff_declines/);
 assert.match(api,/staff_id=NULL,status='pending'/);
 assert.match(api,/needs_admin_attention=\?/);
 assert.doesNotMatch(api,/status='cancelled'/);
});

test('booking reserves Staff capacity without automatic assignment',()=>{
 const api=read('backend/src/routes/appointments.ts');
 const logic=read('backend/src/lib/scheduling.ts');
 assert.match(api,/SELECT pg_advisory_xact_lock/);
 assert.match(api,/hasBookingCapacity\(db,orgId\(req\),st,en\)/);
 assert.match(api,/hasStaffCapacity\(bookings,staff\?\.total/);
 assert.match(api,/preferredStaff=d.staff_id\?\?null/);
 assert.match(api,/INSERT INTO appointment_services/);
 assert.match(api,/if\(req.query.pool==='true'\)/);
 assert.match(api,/appointment_staff_declines d/);
 assert.match(logic,/events.sort/);
});

test('UI provides open queue and Admin exception handling',()=>{
 const page=read('frontend/src/pages/AdminAppointments.tsx');
 const staff=read('frontend/src/pages/StaffDashboard.tsx');
 const admin=read('frontend/src/pages/AdminDashboard.tsx');
 assert.match(page,/Lịch chưa có người nhận/);
 assert.match(page,/decision.mutate\('accept'\)/);
 assert.match(page,/decision.mutate\('decline'\)/);
 assert.match(staff,/staff-pool/);
 assert.match(admin,/admin-assignment-exceptions/);
});

test('Admin account column uses requested label without misrepresenting account status',()=>{
 const account=read('frontend/src/pages/Accounts.tsx');
 assert.match(account,/Đã khóa<\/span>/);
 assert.doesNotMatch(account,/Đã băm<\/span>/);
 assert.match(account,/account.is_active\?'Hoạt động':'Bị khóa'/);
 assert.match(account,/Đây không phải trạng thái khóa tài khoản/);
});
