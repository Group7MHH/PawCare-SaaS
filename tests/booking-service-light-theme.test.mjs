import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../frontend/src/styles.css',import.meta.url),'utf8');
const booking=readFileSync(new URL('../frontend/src/pages/Booking.tsx',import.meta.url),'utf8');
const finalRules=css.slice(css.indexOf('/* Booking step 1: explicitly use the existing PawCare light UI.'));

test('booked service cards use explicit light theme overrides',()=>{
 assert.ok(finalRules.includes('.pc-booking-service-picker .pc-service-plan{'));
 assert.ok(finalRules.includes('background:#ffffff !important;'));
 assert.ok(finalRules.includes('background:#f7f9f8 !important;'));
 assert.ok(finalRules.includes('.pc-booking-service-picker .pc-service-tabbar button.active{'));
 assert.ok(finalRules.includes('.pc-booking-service-picker .pc-service-plan.selected{'));
 assert.ok(finalRules.includes('color:#203c38 !important;'));
});
test('booking workflow remains unchanged',()=>{
 assert.ok(booking.includes('service_ids:serviceIds'));
 assert.ok(booking.includes('totalPrice=selected.reduce'));
 assert.ok(booking.includes('duration=selected.reduce'));
 assert.ok(booking.includes('<ServiceCards'));
 assert.ok(booking.includes('/appointments/availability'));
});
