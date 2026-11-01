import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../frontend/src/styles.css',import.meta.url),'utf8');
const section=css.slice(css.indexOf('/* QINPET-inspired service presentation'));
test('service pages use existing PawCare light palette',()=>{
 assert.ok(section.includes('background:transparent;color:var(--text)'));
 assert.ok(section.includes('background:#ffffff;border:1px solid var(--line)'));
 assert.ok(section.includes('background:var(--teal);border:1px solid var(--teal)'));
 assert.ok(section.includes('background:#f7faf9;border:1px solid var(--line)'));
 assert.ok(!section.includes('background:#202627'));
 assert.ok(!section.includes('background:#181d1e'));
 assert.ok(!section.includes('background:#121717'));
});
test('category and booking card layouts stay intact',()=>{
 for(const cls of ['.pc-service-card-grid','.pc-service-tabbar','.pc-service-plan','.pc-booking-service-picker','.pc-service-select','.pc-service-footer'])
  assert.ok(section.includes(cls),cls);
 assert.ok(section.includes('prefers-reduced-motion:reduce'));
});
