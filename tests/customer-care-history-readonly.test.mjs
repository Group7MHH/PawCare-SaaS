import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Customer pet profile has no manual care record creator',()=>{
 const page=read('frontend/src/pages/Pets.tsx');
 assert.ok(page.includes('<PetEditor pet={pet}'));
 assert.ok(page.includes('<Panel title="Lịch sử chăm sóc"'));
 assert.ok(page.includes('filteredRecords=records.filter'));
 assert.ok(page.includes('Kết quả chăm sóc sẽ hiển thị sau khi nhân viên hoàn thành lịch hẹn.'));
 assert.ok(!page.includes('setAddRecord'));
 assert.ok(!page.includes('Thêm hồ sơ chăm sóc'));
 assert.ok(!page.includes('>Thêm hồ sơ</button>'));
 assert.ok(page.includes('removeRecord.mutate(r.id)'));
});

test('Customer cannot bypass UI to manually create a care record, Staff still can',()=>{
 const api=read('backend/src/routes/pets.ts');
 const create=api.slice(api.indexOf("router.post('/:id/records'"),api.indexOf("router.delete('/:id/records/:recordId'"));
 assert.ok(create.includes("if(req.user!.role==='customer')throw new HttpError(403"));
 assert.ok(create.includes("req.user!.role==='staff'"));
 assert.ok(create.includes("status IN ('in_progress','completed')"));
 assert.ok(create.includes('INSERT INTO care_records'));
 const completed=read('backend/src/routes/appointments.ts');
 assert.ok(completed.includes("d.status==='completed' && current.status!=='completed'"));
 assert.ok(completed.includes('INSERT INTO care_records'));
});

test('Care history tabs reflect actual types and hide when records are empty',()=>{
 const page=read('frontend/src/pages/Pets.tsx');
 assert.ok(page.includes("records.length>0&&<div className=\"pc-pet-section-tabs\""));
 for(const type of ["vaccination","medical","grooming","other"]){
  assert.ok(page.includes("key:'"+type+"'"),type);
 }
 assert.ok(page.includes("filter(category=>category.count>0)"));
 assert.ok(page.includes("recordTab==='all'||r.record_type===recordTab"));
 assert.ok(page.includes("'Chưa có lịch sử chăm sóc'"));
});

test('Completed care records use service-aware type, not a fixed grooming type',()=>{
 const route=read('backend/src/routes/appointments.ts');
 const classifier=read('backend/src/lib/care-records.ts');
 assert.ok(route.includes('classifyAppointmentCare(selectedServices)'));
 assert.ok(route.includes('ORDER BY aps.position'));
 assert.ok(route.includes('recordType,d.care_result'));
 assert.ok(!route.includes("'Kết quả chăm sóc','grooming'"));
 for(const category of ["vaccination","medical","grooming","other"]){
  assert.ok(classifier.includes("'"+category+"'"));
 }
 assert.ok(classifier.includes("types.every(type=>type===types[0])"));
});

test('Service names are snapshotted for new and historical care entries',()=>{
 const migration=read('database/014_care_record_service_names.sql');
 const migrator=read('backend/src/migrate.ts');
 const completion=read('backend/src/routes/appointments.ts');
 const customer=read('frontend/src/pages/Pets.tsx');
 const staff=read('frontend/src/components/AppointmentPetProfile.tsx');
 const types=read('frontend/src/lib/api.ts');
 assert.ok(migration.includes('ALTER TABLE care_records ADD COLUMN IF NOT EXISTS service_names_snapshot TEXT'));
 assert.ok(migration.includes('COALESCE(aps.name_snapshot,s.name)'));
 assert.ok(migrator.includes('014_care_record_service_names.sql'));
 assert.ok(completion.includes("const bookedServiceNames=selectedServices.map(service=>service.name).join(' + ')"));
 assert.ok(completion.includes('appointment_id,service_names_snapshot)'));
 assert.ok(customer.includes('r.service_names_snapshot||r.title'));
 assert.ok(staff.includes('record.service_names_snapshot||record.title'));
 assert.ok(types.includes('service_names_snapshot?:string|null'));
});
