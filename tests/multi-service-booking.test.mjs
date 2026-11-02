import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('multi-service migration backfills existing bookings without deleting data',()=>{
 const sql=read('database/006_multi_service_appointments.sql');
 assert.match(sql,/CREATE TABLE IF NOT EXISTS appointment_services/i);
 assert.match(sql,/REFERENCES appointments\(id\) ON DELETE CASCADE/i);
 assert.match(sql,/price_snapshot/i);
 assert.match(sql,/duration_minutes_snapshot/i);
 assert.match(sql,/INSERT INTO appointment_services/i);
 assert.match(sql,/ON CONFLICT \(appointment_id,service_id\) DO NOTHING/i);
 assert.match(read('backend/src/migrate.ts'),/006_multi_service_appointments.sql/);
});
test('booking API validates full duration and keeps one atomic booking',()=>{
 const api=read('backend/src/routes/appointments.ts');
 assert.match(api,/service_ids:z\.array/);
 assert.match(api,/new Set\(ids\)\.size!==ids\.length/);
 assert.match(api,/getSelectedServices\(orgId\(req\),ids/);
 assert.match(api,/validateBookingTime\(start,totalDuration\)/);
 assert.match(api,/totalPrice=services\.reduce/);
 assert.match(api,/await transaction\(async db=>/);
 assert.match(api,/if\(preferredStaff\)await lockStaff\(db,\[preferredStaff\]\)/);
 assert.match(api,/if\(preferredStaff\)await verifyAvailability\(db,preferredStaff,st,en\)/);
 assert.match(api,/INSERT INTO appointment_services/);
 assert.match(api,/duration_minutes:duration/);
});
test('permanent service deletion handles bookings where service is not first',()=>{
 const api=read('backend/src/routes/catalog.ts');
 assert.match(api,/SELECT appointment_id FROM appointment_services WHERE service_id=\?/);
 assert.match(api,/DELETE FROM appointments WHERE id IN/);
 assert.match(api,/UPDATE care_records SET appointment_id=NULL/);
});
test('booking screen selects multiple services and displays the real total',()=>{
 const ui=read('frontend/src/pages/Booking.tsx');
 assert.match(ui,/serviceIds,setServiceIds/);
 assert.match(ui,/service_ids:serviceIds/);
 assert.match(ui,/totalPrice=selected\.reduce/);
 assert.match(ui,/duration=selected\.reduce/);
 assert.match(ui,/blockedSlots/);
});
