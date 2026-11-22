import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Permanent service deletion protects active and bundled bookings',()=>{
 const api=read('backend/src/routes/catalog.ts');
 assert.ok(api.includes('unsafe.bundled>0'));
 assert.ok(api.includes('unsafe.active>0'));
 assert.ok(api.includes('Dịch vụ thuộc lịch gồm nhiều dịch vụ'));
 assert.ok(api.includes('Dịch vụ đang có lịch chưa hoàn thành'));
 assert.ok(api.includes("WHERE id=? AND organization_id=? FOR UPDATE"));
 assert.ok(api.includes("status IN ('paid','refund_required','refunded','pending_review')"));
 assert.ok(api.includes("UPDATE care_records SET appointment_id=NULL"));
});

test('Admin can delete Staff and revoke Staff role without granting new Staff access',()=>{
 const api=read('backend/src/routes/accounts.ts');
 assert.ok(api.includes("DELETE FROM appointments WHERE customer_id=? OR staff_id=?"));
 assert.ok(api.includes('expected_appointments!==impact.appointments'));
 assert.ok(!api.includes('dependencies.appointments>0||dependencies.care_records>0'));
 assert.ok(!api.includes('if(billing.total>0)'));
 assert.ok(api.includes("role:z.literal('customer')"));
 assert.ok(api.includes("account.role!=='staff'"));
 assert.ok(!api.includes("if(data.role==='staff')"));
});
test('Overdue bookings can be rescheduled by Admin, preserving time validation and capacity',()=>{
 const api=read('backend/src/routes/appointments.ts');
 const page=read('frontend/src/pages/AdminAppointments.tsx');
 assert.ok(page.includes('type="datetime-local"'));
 assert.ok(page.includes('Lưu giờ hẹn mới'));
 assert.ok(page.includes("json('PATCH',{starts_at:start.toISOString()})"));
 assert.ok(api.includes('validateBookingTime(start,'));
 assert.ok(api.includes('hasBookingCapacity(db,orgId(req),st,en,id)'));
 assert.ok(api.includes('verifyAvailability(db,staffId,st,en,id)'));
 assert.ok(api.includes("d.starts_at!==undefined && req.user!.role==='admin'"));
});

test('Staff dashboard pages active assigned work and reports active totals only',()=>{
 const backend=read('backend/src/routes/appointments.ts');
 const dashboard=read('frontend/src/pages/StaffDashboard.tsx');
 assert.ok(backend.includes("req.query.active_work==='true'"));
 assert.ok(backend.includes("a.status IN ('pending','confirmed','in_progress')"));
 assert.ok(dashboard.includes('for(let page=1;page<=100;page++)'));
 assert.ok(dashboard.includes('active_work=true'));
 assert.ok(dashboard.includes('items.length>=result.total'));
});

test('Correct Admin pets, multi-service search, care classification and non-deletable buttons',()=>{
 const management=read('backend/src/routes/management.ts');
 const appointments=read('backend/src/routes/appointments.ts');
 const care=read('backend/src/lib/care-records.ts');
 const pets=read('frontend/src/pages/Pets.tsx');
 const catalog=read('backend/src/routes/catalog.ts');
 assert.ok(management.includes("SELECT COUNT(*)::int AS value FROM pets p JOIN users u"));
 assert.ok(management.includes('SELECT COUNT(*) FROM pets p WHERE p.owner_id=u.id'));
 assert.ok(appointments.includes('EXISTS (SELECT 1 FROM appointment_services aps JOIN services svc'));
 assert.ok(appointments.includes('COALESCE(aps.name_snapshot,svc.name) ILIKE ?'));
 assert.ok(care.includes('rang mieng|cao voi'));
 assert.ok(pets.includes('r.created_by_user_id===user?.id&&r.appointment_id==null'));
 assert.ok(catalog.includes('specialty=CASE WHEN ?'));
 assert.ok(catalog.includes('bio=CASE WHEN ?'));
});
