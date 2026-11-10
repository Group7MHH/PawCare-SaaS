import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('customer catalogue uses live services and booking route',()=>{
 const ui=read('frontend/src/pages/CustomerServices.tsx'),cards=read('frontend/src/components/ServiceCards.tsx'),routes=read('frontend/src/main.tsx');
 assert.ok(ui.includes("api<{items:Service[]}>('/services')"));
 assert.ok(ui.includes('<ServiceCards services={services.data?.items||[]}/>'));
 for(const route of ['/services','/book'])assert.ok(routes.includes('path="'+route+'"'));
 for(const value of ['/book?service_ids=','money(service.price)','service.duration_minutes'])assert.ok(cards.includes(value));
});
test('multi-service booking uses selectable cards and unchanged API contract',()=>{
 const booking=read('frontend/src/pages/Booking.tsx');
 for(const value of ['service_ids:serviceIds','totalPrice=selected.reduce','duration=selected.reduce','<ServiceCards','useSearchParams','/appointments/availability',"session.user.role!=='customer'"])assert.ok(booking.includes(value));
});
test('Admin service management still uses protected route and confirmation dialogs',()=>{
 const admin=read('frontend/src/pages/Catalog.tsx'),routes=read('frontend/src/main.tsx');
 assert.ok(admin.includes('ServiceDeleteDialog'));
 assert.ok(admin.includes('ServiceEditor'));
 assert.ok(routes.includes('path="/admin/catalog"'));
 assert.ok(routes.includes('<AdminOnly><Catalog/></AdminOnly>'));
});
test('service selection exposes keyboard focus and responsive layout',()=>{
 const css=read('frontend/src/styles.css'),cards=read('frontend/src/components/ServiceCards.tsx');
 assert.ok(css.includes(':focus-visible'));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));
 assert.ok(cards.includes('pc-service-card-grid'));
});
