import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('PawCare redesign retains protected role-based routes',()=>{
 const main=read('frontend/src/main.tsx');
 for(const route of ['/overview','/pets','/book','/services','/my-appointments','/admin/dashboard','/admin/appointments','/admin/catalog','/admin/customers','/admin/team','/admin/accounts','/staff/dashboard','/staff/appointments'])
  assert.ok(main.includes(`path="${route}"`),route);
 assert.match(main,/function AdminOnly\(/);assert.match(main,/function StaffOnly\(/);
 assert.match(main,/AdminOnly><Accounts/);
});
test('responsive navigation still limits Admin account access',()=>{
 const layout=read('frontend/src/components/Layout.tsx');
 assert.match(layout,/user\.role==='staff'/);
 assert.match(layout,/user\.role==='admin'/);
 assert.match(layout,/user\.role!=='customer'/);
 assert.match(layout,/adminOnlyLinks/);
 assert.match(layout,/\/admin\/accounts/);
 assert.match(layout,/NavLink/);
 assert.match(layout,/logout\(\)\.catch/);
 assert.match(layout,/aria-label=\{`Đăng xuất tài khoản/);
});
test('sidebar, tables and modals have responsive and reduced-motion CSS',()=>{
 const css=read('frontend/src/styles.css');
 for(const selector of ['.sb{','.sb-nav{','.sb-foot{','.sb-user{','.sb.sidebar-open{','.modal{','.pc-shared-hero{'])
  assert.ok(css.includes(selector),selector);
 assert.match(css,/height:100vh/);
 assert.match(css,/\.sb-nav\{[^}]*overflow-y:auto/);
 assert.match(css,/@media\(max-width:900px\)/);
 assert.match(css,/@media\(max-width:640px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test('design system and second layer of page styles are loaded',()=>{
 const css=read('frontend/src/styles.css'),main=read('frontend/src/main.tsx');
 assert.match(css,/@import '\.\/legacy\.css'/);
 for(const color of ['--navy:#17263B','--blue:#2B6F8F','--green:#3E7C57'])assert.ok(css.includes(color));
 assert.ok(main.includes("import './pages.css'"));
 assert.ok(existsSync(new URL('../frontend/src/pages.css',import.meta.url)));
});
test('booking remains backed by live API and supports multi-service limits',()=>{
 const booking=read('frontend/src/pages/Booking.tsx');
 for(const snippet of ['service_ids:serviceIds','totalPrice=selected.reduce','duration=selected.reduce','/appointments/availability','<ServiceCards','session.user.role'])
  assert.ok(booking.includes(snippet),snippet);
 assert.ok(booking.includes('duration<=600'));
 assert.match(booking,/aria-pressed/);
});
test('services use actual API prices and navigate to booking',()=>{
 const ui=read('frontend/src/pages/CustomerServices.tsx'),cards=read('frontend/src/components/ServiceCards.tsx');
 assert.ok(ui.includes("api<{items:Service[]}>('/services')"));
 assert.match(ui,/<PageHero eyebrow="DỊCH VỤ PAWCARE"/);
 assert.match(ui,/<ServiceCards services=\{services\.data\?\.items\|\|\[\]\}/);
 for(const snippet of ['/book?service_ids=','money(service.price)','service.duration_minutes','selectedIds.length>=maxSelected'])
  assert.ok(cards.includes(snippet),snippet);
});
test('Customer dashboard and pets show live information, not fabricated medical reminders',()=>{
 const overview=read('frontend/src/pages/Overview.tsx'),pets=read('frontend/src/pages/Pets.tsx');
 assert.match(overview,/api<\{items:Pet\[\]\}>\('\/pets'\)/);
 assert.match(overview,/api<Stats>\('\/dashboard'\)/);
 assert.match(overview,/className="nb-customer-cover/);
 assert.match(overview,/nb-ticket/);
 assert.doesNotMatch(overview,/mũi tiêm cần nhắc lại|ngày tiêm giả/);
 assert.match(pets,/filteredRecords=records\.filter/);
});
test('Staff queue and Admin exception handling remain connected',()=>{
 const staff=read('frontend/src/pages/StaffDashboard.tsx'),admin=read('frontend/src/pages/AdminAppointments.tsx');
 assert.ok(staff.includes('/appointments?pool=true'));
 assert.ok(staff.includes('/staff/appointments'));
 assert.ok(admin.includes("'accept'|'decline'"));
 assert.ok(admin.includes('needs_attention='));
 assert.ok(admin.includes('care_result'));
});
