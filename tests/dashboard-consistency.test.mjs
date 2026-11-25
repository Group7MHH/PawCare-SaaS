import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Admin dashboard exposes completed counts and refreshed activity',()=>{
 const api=read('backend/src/routes/management.ts');
 const page=read('frontend/src/pages/AdminDashboard.tsx');
 assert.match(api,/COUNT\(\*\) FILTER \(WHERE status='completed'\)/);
 assert.match(api,/recent_completed:recentCompleted/);
 assert.match(api,/ORDER BY a.updated_at DESC,a.id DESC LIMIT 7/);
 assert.match(api,/COALESCE\(a\.completed_at,a\.updated_at\)/);
 assert.match(api,/Cache-Control','no-store'/);
 assert.match(page,/recent_completed:recentCompleted/);
 assert.match(page,/Các lịch vừa hoàn thành/);
 assert.match(page,/refetchInterval:15000/);
});
test('Admin filters are mutually exclusive and customer views refetch',()=>{
 const list=read('frontend/src/pages/AdminAppointments.tsx');
 const customer=read('frontend/src/pages/MyAppointments.tsx');
 assert.match(list,/setStatus\(s.v\);setOverdueOnly\(false\)/);
 assert.match(list,/setStatus\('all'\);setOverdueOnly\(false\)/);
 assert.match(list,/qc.invalidateQueries\(\{queryKey:\['dashboard'\]\}\)/);
 assert.match(customer,/refetchInterval:15000/);
});

test('Admin dashboard pet count supplies zero SQL bind values; Staff uses its own scope',()=>{
 const api=read('backend/src/routes/management.ts');
 assert.ok(api.includes("WHERE u.role='customer'`,staff?[org,id]:[]),"));
 assert.ok(api.includes("'SELECT COUNT(DISTINCT pet_id) AS value FROM appointments WHERE organization_id=? AND staff_id=?'"));
});
