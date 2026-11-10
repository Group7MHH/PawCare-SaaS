import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('page heading delegates to same accessible hero component',()=>{
 const ui=read('frontend/src/components/UI.tsx'),hero=read('frontend/src/components/PageHero.tsx');
 assert.match(ui,/return <PageHero eyebrow=\{eyebrow\}/);
 assert.match(hero,/<header className=\{`pc-shared-hero/);
 assert.match(hero,/aria-hidden="true"/);
 assert.match(hero,/action&&/);
 assert.match(hero,/description&&/);
});
test('service hero uses shared banner without duplicate framed box',()=>{
 const page=read('frontend/src/pages/CustomerServices.tsx');
 assert.match(page,/<PageHero eyebrow="DỊCH VỤ PAWCARE"/);
 assert.doesNotMatch(page,/pc-service-hero-aside/);
 assert.match(page,/api<\{items:Service\[\]\}>\('\/services'\)/);
 assert.match(page,/<ServiceCards services=\{services\.data\?\.items\|\|\[\]\}/);
});
test('customer overview reuses shared page title',()=>{
 const page=read('frontend/src/pages/Overview.tsx');
 assert.match(page,/<PageTitle eyebrow="TỔNG QUAN CÁ NHÂN"/);
 assert.match(page,/api<Stats>\('\/dashboard'\)/);
});
test('shared hero respects small screens and reduced motion',()=>{
 const css=read('frontend/src/styles.css');
 for(const cls of ['.pc-shared-hero','.pc-shared-hero--sage','.pc-shared-hero--sky','.pc-shared-hero--sand','.pc-shared-hero-actions','.pc-hero-orbit'])assert.ok(css.includes(cls),cls);
 assert.match(css,/@media\(max-width:640px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test('role and multi-service workflows remain intact',()=>{
 const booking=read('frontend/src/pages/Booking.tsx'),routes=read('frontend/src/main.tsx');
 for(const x of ['service_ids:serviceIds','totalPrice=selected.reduce','/appointments/availability'])assert.ok(booking.includes(x));
 assert.match(routes,/AdminOnly/);assert.match(routes,/StaffOnly/);
});
