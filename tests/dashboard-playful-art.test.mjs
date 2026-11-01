import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(file)=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
test('Dashboard maintains existing sections',()=>{
const dashboard=read('frontend/src/pages/AdminDashboard.tsx');
for(const section of ['metrics-grid four','dashboard-grid','donut-section','bottom-grid','Truy cập nhanh','Lịch hẹn gần đây','Doanh thu theo tháng']) assert.ok(dashboard.includes(section));
assert.ok(dashboard.includes("api<Stats>('/dashboard')"));
assert.ok(dashboard.includes("api<{items:Service[]}>('/services')"));
});
test('Decorations and reduced motion are present',()=>{
const css=read('frontend/src/styles.css');
const dashboard=read('frontend/src/pages/AdminDashboard.tsx');
assert.ok(css.includes('prefers-reduced-motion:reduce'));
assert.ok(css.includes('paw-gentle-float'));
assert.ok(dashboard.includes('PetDoodles'));
});
test('Multi-service contract unchanged',()=>{
const booking=read('frontend/src/pages/Booking.tsx');
for(const term of ['service_ids:serviceIds','totalPrice=selected.reduce','duration=selected.reduce'])assert.ok(booking.includes(term));
});
