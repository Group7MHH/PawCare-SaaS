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
 assert.match(api,/COALESCE\(completed_at,updated_at\)/);
 assert.match(api,/Cache-Control','no-store'/);
 assert.match(page,/recent_completed:recentCompleted/);
 assert.match(page,/Các lịch vừa hoàn thành/);
 assert.match(page,/refetchInterval:15000/);
});
test('Admin filters are mutually exclusive and customer views refetch',()=>{
 const list=read('frontend/src/pages/AdminAppointments.tsx');
 const customer=read('frontend/src/pages/MyAppointments.tsx');
 assert.match(list,/setStatus\(s.v\);setAttentionOnly\(false\)/);
 assert.match(list,/setStatus\('all'\);setAttentionOnly\(false\)/);
 assert.match(list,/qc.invalidateQueries\(\{queryKey:\['dashboard'\]\}\)/);
 assert.match(customer,/refetchInterval:15000/);
});
