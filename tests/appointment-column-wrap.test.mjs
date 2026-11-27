import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Staff and Admin appointment columns wrap long service bundles',()=>{
 const css=read('frontend/src/appointment-workflow.css');
 const page=read('frontend/src/pages/AdminAppointments.tsx');
 assert.ok(page.includes('<colgroup>'));
 assert.ok(page.includes('data-label="Dịch vụ"'));
 assert.ok(css.includes('table-layout:fixed;min-width:0'));
 assert.ok(css.includes('overflow-wrap:anywhere'));
 assert.ok(css.includes('content:attr(data-label)'));
 assert.ok(css.includes('.pc-aw-panel .pc-aw-state{min-width:0'));
});
