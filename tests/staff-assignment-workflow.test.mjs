import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('historical Staff queue migration remains available for existing database history',()=>{
 const prior=read('database/007_staff_assignment.sql');
 const queue=read('database/008_staff_self_service_queue.sql');
 const migrator=read('backend/src/migrate.ts');
 for(const name of ['needs_admin_attention','appointment_staff_declines','PRIMARY KEY (appointment_id,staff_id)'])
  assert.ok(prior.includes(name),name);
 assert.match(queue,/WHERE staff_id IS NULL AND status='pending'/);
 assert.match(migrator,/008_staff_self_service_queue\.sql/);
 assert.doesNotMatch(queue,/TRUNCATE|DELETE FROM appointments/i);
});

test('only Admin-assigned pending appointments can be accepted by Staff',()=>{
 const route=read('backend/src/routes/assignment.ts');
 assert.ok(route.includes("router.post('/:id/accept',requireRole('staff')"));
 assert.ok(route.includes("if(appt.staff_id!==staffId)throw new HttpError(403"));
 assert.ok(route.includes("if(appt.status!=='pending')"));
 assert.ok(route.includes("await lockStaff(db,[staffId])"));
 assert.ok(route.includes("status='confirmed'"));
 assert.ok(route.includes("appointment_staff_declines WHERE appointment_id=?"));
});

test('Staff decline sends appointment back to Admin for reassignment',()=>{
 const route=read('backend/src/routes/assignment.ts');
 assert.ok(route.includes("router.post('/:id/decline',requireRole('staff')"));
 assert.ok(route.includes("INSERT INTO appointment_staff_declines"));
 assert.ok(route.includes("staff_id=NULL,status='pending'"));
 assert.ok(route.includes("needs_admin_attention=TRUE"));
 assert.ok(route.includes("Admin cần phân công lại"));
 assert.ok(!route.includes("Đã trả lịch về hàng đợi"));
});

test('Customers cannot choose a Staff member and Staff cannot fetch open queue',()=>{
 const api=read('backend/src/routes/appointments.ts');
 const booking=read('frontend/src/pages/Booking.tsx');
 const logic=read('backend/src/lib/scheduling.ts');
 assert.ok(api.includes("if(d.staff_id!==undefined&&req.user!.role!=='admin')"));
 assert.ok(api.includes("const preferredStaff=req.user!.role==='admin'?(d.staff_id??null):null"));
 assert.ok(api.includes("!preferredStaff?'Chờ Admin phân công nhân viên':null"));
 assert.ok(api.includes("if(req.user!.role==='staff'){clauses.push('a.staff_id=?')"));
 assert.ok(!api.includes("if(req.query.pool==='true')"));
 assert.ok(api.includes("hasBookingCapacity(db,orgId(req),st,en)"));
 assert.ok(logic.includes('events.sort'));
 assert.ok(!booking.includes('staffId'));
 assert.ok(!booking.includes('5. Chọn nhân viên'));
 assert.ok(booking.includes('Chờ Admin phân công'));
});

test('Admin assigns, Staff accepts or declines without a public open queue',()=>{
 const page=read('frontend/src/pages/AdminAppointments.tsx');
 const staff=read('frontend/src/pages/StaffDashboard.tsx');
 const admin=read('frontend/src/pages/AdminDashboard.tsx');
 assert.ok(page.includes('Admin phân công nhân viên phụ trách'));
 assert.ok(page.includes("decision.mutate('accept')"));
 assert.ok(page.includes("decision.mutate('decline')"));
 assert.ok(!page.includes('Lịch chưa có người nhận'));
 assert.ok(!staff.includes('/appointments?pool=true'));
 assert.ok(!staff.includes("queryKey:['staff-pool']"));
 assert.ok(staff.includes('Lịch Admin đã giao'));
 assert.ok(admin.includes('admin-assignment-exceptions'));
});
test('Admin account column uses requested label without misrepresenting account status',()=>{
 const account=read('frontend/src/pages/Accounts.tsx');
 assert.match(account,/Đã khóa<\/span>/);
 assert.doesNotMatch(account,/Đã băm<\/span>/);
 assert.match(account,/account.is_active\?'Hoạt động':'Bị khóa'/);
 assert.match(account,/Đây không phải trạng thái khóa tài khoản/);
});
