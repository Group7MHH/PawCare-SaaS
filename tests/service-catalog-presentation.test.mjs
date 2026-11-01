import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('customer service catalogue uses real active API and preserves booking route',()=>{
 const ui=read('frontend/src/pages/CustomerServices.tsx');
 const cards=read('frontend/src/components/ServiceCards.tsx');
 const routes=read('frontend/src/main.tsx');
 assert.ok(ui.includes("api<{items:Service[]}>('/services')"));
 assert.ok(ui.includes('<ServiceCards services={services.data?.items||[]}/>'));
 assert.ok(routes.includes('path="/services"'));
 assert.ok(routes.includes('path="/book"'));
 assert.ok(cards.includes('/book?service_ids='));
 assert.ok(cards.includes('money(service.price)'));
 assert.ok(cards.includes('service.duration_minutes'));
});
test('multi-service booking uses new selectable cards with unchanged API payload',()=>{
 const booking=read('frontend/src/pages/Booking.tsx');
 assert.ok(booking.includes('service_ids:serviceIds'));
 assert.ok(booking.includes('totalPrice=selected.reduce'));
 assert.ok(booking.includes('duration=selected.reduce'));
 assert.ok(booking.includes('<ServiceCards'));
 assert.ok(booking.includes('useSearchParams'));
 assert.ok(booking.includes('/appointments/availability'));
 assert.ok(booking.includes("session.user.role!=='customer'"));
});
test('admin service management remains separate from customer showcase',()=>{
 const admin=read('frontend/src/pages/Catalog.tsx');
 const routes=read('frontend/src/main.tsx');
 assert.ok(admin.includes('ServiceDeleteDialog'));
 assert.ok(admin.includes('ServiceEditor'));
 assert.ok(routes.includes('path="/admin/catalog"'));
 assert.ok(routes.includes('<AdminOnly><Catalog/></AdminOnly>'));
});
test('service styles responsive and accessible',()=>{
 const css=read('frontend/src/styles.css');
 assert.ok(css.includes('.pc-service-card-grid'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(css.includes('.pc-service-select:focus-visible'));
});
