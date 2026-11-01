import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(file)=>readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('all screen titles use the same accessible hero pattern',()=>{
 const ui=read('frontend/src/components/UI.tsx');
 const hero=read('frontend/src/components/PageHero.tsx');
 assert.match(ui,/return <PageHero eyebrow=\{eyebrow\}/);
 assert.match(hero,/<header className=\{\x60pc-shared-hero/);
 assert.match(hero,/aria-hidden="true"/);
 assert.match(hero,/action&&/);
 assert.match(hero,/description&&/);
});
test('services does not render an extra framed box',()=>{
 const page=read('frontend/src/pages/CustomerServices.tsx');
 assert.match(page,/<PageHero eyebrow="DỊCH VỤ PAWCARE"/);
 assert.doesNotMatch(page,/pc-service-hero-aside/);
 assert.match(page,/api<\{items:Service\[\]\}>\('\/services'\)/);
 assert.match(page,/<ServiceCards services=\{services\.data\?\.items\|\|\[\]\}/);
});
test('customer overview has one main hero instead of stacked banners',()=>{
 const page=read('frontend/src/pages/Overview.tsx');
 assert.match(page,/<PageTitle eyebrow="TỔNG QUAN CÁ NHÂN"/);
 assert.doesNotMatch(page,/welcome-banner pc-editorial-banner/);
 assert.match(page,/api<Stats>\('\/dashboard'\)/);
});
test('hero styles support small screens and reduced motion',()=>{
 const css=read('frontend/src/styles.css');
 for(const cls of ['.pc-shared-hero','.pc-shared-hero--sage','.pc-shared-hero--sky','.pc-shared-hero--sand','.pc-shared-hero-actions','.pc-hero-orbit']){
  assert.ok(css.includes(cls),'Missing '+cls);
 }
 assert.match(css,/@media\(max-width:700px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test('multi-service checkout, role checks and data not changed',()=>{
 const booking=read('frontend/src/pages/Booking.tsx');
 const routes=read('frontend/src/main.tsx');
 for(const x of ['service_ids:serviceIds','totalPrice=selected.reduce','/appointments/availability'])assert.ok(booking.includes(x),x);
 assert.match(routes,/AdminOnly/);
 assert.match(routes,/StaffOnly/);
});
