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

test('booking service count follows the active catalogue; duration and unique IDs remain validated',()=>{
 const api=read('backend/src/routes/appointments.ts');
 const booking=read('frontend/src/pages/Booking.tsx');
 const cards=read('frontend/src/components/ServiceCards.tsx');
 assert.ok(api.includes('service_ids:z.array(z.number().int().positive()).min(1).optional()'));
 assert.ok(api.includes('service_ids:z.string().max(2048).regex(/^\\d+(,\\d+)*$/).optional()'));
 assert.doesNotMatch(api,/ids\.length\s*>\s*8/);
 assert.match(api,/is_active=TRUE AND id=ANY/);
 assert.match(api,/result\.length!==ids\.length/);
 assert.doesNotMatch(booking,/slice\(0,8\)/);
 assert.doesNotMatch(booking,/ids\.length>=8/);
 assert.ok(booking.includes('availableServiceCount=services.data?.items.length??0'));
 assert.ok(booking.includes('Đã chọn {selected.length} / {availableServiceCount} dịch vụ'));
 assert.doesNotMatch(cards,/selectedIds\.length>=8/);
 assert.ok(cards.includes('totalDuration+service.duration_minutes>600'));
 assert.ok(api.includes('new Set(ids).size!==ids.length'));
 assert.ok(api.includes('if(ordered.reduce((sum,item)=>sum+item.duration_minutes,0)>600)'));
});
