import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('staff sends care results only on completed appointments',()=>{
 const view=read('frontend/src/pages/AdminAppointments.tsx');
 assert.ok(view.includes("user?.role==='staff'&&edit.status==='completed'?{care_result:edit.care_result.trim()}"));
 assert.ok(view.includes("user?.role==='staff'&&edit.status==='completed'&&<Field"));
 assert.ok(view.includes('required minLength={2}'));
});
test('backend requires valid care result when completing and permits other state transitions without one',()=>{
 const route=read('backend/src/routes/appointments.ts');
 assert.ok(route.includes("care_result:z.string().trim().max(3000).optional()"));
 assert.ok(!route.includes("care_result:z.string().trim().min(2).max(3000).optional()"));
 assert.ok(route.includes("d.status==='completed'&&req.user!.role==='staff'"));
 assert.ok(route.includes(".length<2"));
 assert.ok(route.includes("d.care_result?.trim()||current.care_result||null"));
 assert.ok(route.includes("d.status==='completed' && current.status!=='completed'"));
});
