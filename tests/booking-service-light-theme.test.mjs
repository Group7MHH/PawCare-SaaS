import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const styles=read('frontend/src/styles.css');
const booking=read('frontend/src/pages/Booking.tsx');
const cards=read('frontend/src/components/ServiceCards.tsx');

test('booking service selection uses current PawCare design system',()=>{
 assert.ok(styles.includes('--surface:#FFFFFF'));
 assert.ok(styles.includes("@import './legacy.css'"));
 assert.ok(styles.includes('--navy:#17263B'));
 assert.ok(cards.includes('pc-service-plan'));
 assert.ok(cards.includes('pc-service-select'));
});
test('booking workflow remains multi-service with live availability',()=>{
 for(const value of ['service_ids:serviceIds','totalPrice=selected.reduce','duration=selected.reduce','<ServiceCards','/appointments/availability'])assert.ok(booking.includes(value));
 assert.ok(booking.includes('duration<=600'));
 assert.ok(cards.includes('selectedIds.length>=maxSelected'));
});
