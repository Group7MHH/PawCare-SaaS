import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('all PawCare routes and role boundaries remain available',()=>{
 const routes=read('frontend/src/main.tsx');
 for(const route of ['/overview','/pets','/book','/services','/my-appointments','/admin/dashboard','/admin/appointments','/admin/catalog','/admin/customers','/admin/team','/staff/dashboard','/staff/appointments'])assert.ok(routes.includes('path="'+route+'"'),route);
 assert.match(routes,/AdminOnly/);
 assert.match(routes,/StaffOnly/);
});
test('customer overview uses actual pets and dashboard endpoints, not mock reminders',()=>{
 const page=read('frontend/src/pages/Overview.tsx');
 assert.match(page,/api<\{items:Pet\[\]\}>\('\/pets'\)/);
 assert.match(page,/api<Stats>\('\/dashboard'\)/);
 assert.match(page,/<PageTitle eyebrow="TỔNG QUAN CÁ NHÂN"/);
 assert.doesNotMatch(page,/welcome-banner pc-editorial-banner/);
 assert.doesNotMatch(page,/mũi tiêm cần nhắc lại|ưu đãi thành viên 10%|ngày tiêm giả/);
});
test('customer appointment detail is populated by existing records',()=>{
 const page=read('frontend/src/pages/MyAppointments.tsx');
 assert.match(page,/pc-appointment-detail-rail/);
 assert.match(page,/setSelectedId\(a.id\)/);
 assert.match(page,/selected\.price_snapshot/);
 assert.match(page,/selected\.starts_at/);
 assert.match(page,/cancel\.mutate\(selected.id\)/);
});
test('pet detail tabs filter real care records without synthetic health claims',()=>{
 const page=read('frontend/src/pages/Pets.tsx');
 assert.match(page,/filteredRecords=records\.filter/);
 assert.match(page,/recordTab==='vaccination'/);
 assert.match(page,/filteredRecords\.map/);
 assert.match(page,/\/pets\/\$\{id\}\/records/);
});
test('service bundle booking and original API payload preserved',()=>{
 const page=read('frontend/src/pages/Booking.tsx');
 assert.match(page,/service_ids:serviceIds/);
 assert.match(page,/totalPrice=selected\.reduce/);
 assert.match(page,/duration=selected\.reduce/);
 assert.match(page,/appointments\/availability/);
});
test('consistent white sage UI with responsive and reduced-motion handling',()=>{
 const css=read('frontend/src/styles.css');
 for(const klass of ['.pc-editorial-banner','.pc-pet-section-tabs','.pc-appointments-layout','.pc-detail-status','.pc-banner-mark'])assert.ok(css.includes(klass),klass);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(max-width:700px\)/);
});
