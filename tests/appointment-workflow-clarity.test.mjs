import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Admin appointment list presents five real workflow steps',()=>{
 const page=read('frontend/src/pages/AdminAppointments.tsx');
 assert.match(page,/function WorkflowGuide\(/);
 assert.match(page,/function AppointmentProgress\(/);
 assert.match(page,/function progressIndex\(/);
 assert.ok(page.includes("a.status==='pending')return a.staff_id?1:0"));
 for(const step of ['Chờ phân công','Chờ tiếp nhận','Đã xác nhận','Đang thực hiện','Hoàn thành'])assert.ok(page.includes(step),step);
 assert.ok(page.includes('<WorkflowGuide/>'));
});

test('Overdue, cancellation, and payments do not replace workflow phase',()=>{
 const page=read('frontend/src/pages/AdminAppointments.tsx');
 assert.ok(page.includes("a.status==='cancelled')return -1"));
 assert.ok(page.includes('a.is_overdue'));
 assert.ok(page.includes('pc-aw-overdue'));
 assert.ok(page.includes('paymentLabels[a.payment_status'));
 assert.ok(page.includes('<PaymentPanel key={selected.id} appointmentId={selected.id} admin/>'));
 assert.ok(page.includes('is_overdue?'));
});

test('Original filters, editing and data source are retained',()=>{
 const page=read('frontend/src/pages/AdminAppointments.tsx');
 assert.ok(page.includes('status=${status}'));
 assert.ok(page.includes('sort=${sort}'));
 assert.ok(page.includes("setStatus(s.v);setOverdueOnly(false)"));
 assert.ok(page.includes("setStatus('all');setOverdueOnly(false)"));
 assert.ok(page.includes('save.mutate()'));
 assert.ok(page.includes("decision.mutate('accept')"));
 assert.ok(page.includes("decision.mutate('decline')"));
 assert.ok(page.includes('reschedule.mutate()'));
});

test('New workflow design is responsive and installed',()=>{
 const css=read('frontend/src/appointment-workflow.css');
 const main=read('frontend/src/main.tsx');
 assert.ok(main.includes("import './appointment-workflow.css'"));
 assert.ok(css.includes('.pc-aw-steps'));
 assert.ok(css.includes('.pc-aw-state'));
 assert.ok(css.includes('.pc-aw-filter-row'));
 assert.ok(css.includes('@media(max-width:720px)'));
});
