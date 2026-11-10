import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const css=read('frontend/src/styles.css'),pageStyles=read('frontend/src/pages.css'),cards=read('frontend/src/components/ServiceCards.tsx');

test('service pages retain new accessible light journal palette',()=>{
 for(const pair of ['--surface:#FFFFFF','--navy:#17263B','--blue:#2B6F8F','--line:var(--rule-2)'])assert.ok(css.includes(pair),pair);
 assert.ok(!css.includes('background:#202627'));
});
test('category tabs and booking card structures remain supported',()=>{
 for(const cls of ['pc-service-tabbar','pc-service-card-grid','pc-service-plan','pc-service-select'])assert.ok(cards.includes(cls),cls);
 assert.ok(cards.includes('role="group"'));
 assert.ok(cards.includes('aria-pressed'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(pageStyles.length>1000);
});
