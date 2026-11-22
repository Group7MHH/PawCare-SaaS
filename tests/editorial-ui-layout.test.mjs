import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('all PawCare routes and role boundaries remain available',()=>{
 const routes=read('frontend/src/main.tsx');
 for(const route of ['/overview','/pets','/book','/services','/my-appointments','/admin/dashboard','/admin/appointments','/admin/catalog','/admin/customers','/admin/team','/staff/dashboard','/staff/appointments'])assert.ok(routes.includes('path="'+route+'"'),route);
 assert.match(routes,/AdminOnly/);assert.match(routes,/StaffOnly/);
});
test('customer overview keeps functional navigation, not repeated data previews',()=>{
 const page=read('frontend/src/pages/Overview.tsx');
 assert.match(page,/className="nb-customer-cover/);
 assert.match(page,/className="pc-home-shortcuts/);
 for(const route of ['/pets','/book','/my-appointments','/payments','/services'])assert.ok(page.includes(route),route);
 for(const label of ['Gia đình nhỏ của bạn','Lịch sắp tới','Những trang vừa viết'])assert.ok(!page.includes(label),label);
 assert.doesNotMatch(page,/mũi tiêm cần nhắc lại|ưu đãi thành viên 10%|ngày tiêm giả/);
});
test('appointment detail reads actual appointment records',()=>{
 const page=read('frontend/src/pages/MyAppointments.tsx');
 for(const term of ['setSelectedId(a.id)','selected.price_snapshot','selected.starts_at','cancel.mutate(selected.id)'])assert.ok(page.includes(term),term);
});
test('pet records are filtered rather than generated as mock medical events',()=>{
 const page=read('frontend/src/pages/Pets.tsx');
 for(const term of ['filteredRecords=records.filter',"recordTab==='all'||r.record_type===recordTab",'filteredRecords.map','/pets/${id}/records'])assert.ok(page.includes(term),term);
});
test('service bundle workflow keeps API payload',()=>{
 const booking=read('frontend/src/pages/Booking.tsx');
 for(const value of ['service_ids:serviceIds','totalPrice=selected.reduce','duration=selected.reduce','appointments/availability'])assert.ok(booking.includes(value));
});
test('new journal styling includes responsive layout and reduced-motion handling',()=>{
 const css=read('frontend/src/styles.css'),pages=read('frontend/src/pages.css');
 for(const cls of ['.pc-shared-hero','.sb-nav','.pc-shared-hero-actions'])assert.ok(css.includes(cls),cls);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(max-width:640px\)/);
 assert.ok(pages.length>1000);
});
