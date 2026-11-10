import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Notebook sidebar preserves role navigation and accessible logout',()=>{
 const layout=read('frontend/src/components/Layout.tsx');
 for(const item of ['customerLinks','staffLinks','adminLinks','adminOnlyLinks','user.role===\'admin\'','user.role===\'staff\'','NavLink','logout().catch'])assert.ok(layout.includes(item),item);
 for(const item of ['aria-expanded','aria-controls','aria-label="Mở menu"','Escape','nb-collapse-toggle','nb-spine','nb-edge-tab','aria-label="Thanh điều hướng PawCare"'])assert.ok(layout.includes(item),item);
 assert.match(layout,/localStorage\.setItem/);
});
test('Customer dashboard renders real pets and appointments rather than fabricated medical advice',()=>{
 const page=read('frontend/src/pages/Overview.tsx');
 assert.ok(page.includes("api<{items:Pet[]}>('/pets')"));
 assert.ok(page.includes("api<Stats>('/dashboard')"));
 for(const token of ['nb-customer-cover','nb-pet-polaroid','nb-ticket','nb-timeline','/my-appointments','/book','/pets'])assert.ok(page.includes(token),token);
 assert.match(page,/Không phải nhắc lịch y tế cá nhân/);
 assert.doesNotMatch(page,/mũi tiêm cần nhắc lại|ngày tiêm giả|khách hàng mẫu/);
});
test('Staff dashboard accepts from the real appointment API and invalidates caches',()=>{
 const page=read('frontend/src/pages/StaffDashboard.tsx');
 assert.ok(page.includes('/appointments?pool=true&limit=5'));
 assert.ok(page.includes('/appointments?limit=50'));
 assert.ok(page.includes('`/appointments/${id}/accept`'));
 assert.ok(page.includes("json('POST',{})"));
 assert.ok(page.includes("queryKey:['staff-pool']"));
 assert.ok(page.includes("queryKey:['staff-work']"));
 assert.ok(page.includes('disabled={accept.isPending}'));
 assert.ok(page.includes('nb-staff-schedule'));
});
test('Admin operations uses actual dashboard, status, series, and exception data',()=>{
 const page=read('frontend/src/pages/AdminDashboard.tsx');
 for(const token of ["api<Stats>('/dashboard')",'/appointments?needs_attention=true','stats.revenue','stats.appointments','stats.customers','stats.pets','series?.find','recentCompleted','statuses?.filter'])assert.ok(page.includes(token),token);
 assert.ok(page.includes('nb-revenue-graph'));
 assert.ok(page.includes('nb-admin-appointment'));
 assert.doesNotMatch(page,/doanh thu giả|chỉ số mẫu/);
});
test('Notebook theme supports mobile, motion-reduction, keyboard, and collapsible states',()=>{
 const css=read('frontend/src/notebook.css'),entry=read('frontend/src/main.tsx');
 assert.ok(entry.includes("import './notebook.css'"));
 for(const token of ['.nb-collapsed .nb-sidebar','.nb-sidebar.sidebar-open','.nb-nav-link.active','@media(max-width:900px)','@media(max-width:640px)','prefers-reduced-motion:reduce',':focus-visible','.nb-ticket','.nb-staff-task','.nb-admin-stat'])assert.ok(css.includes(token),token);
});
