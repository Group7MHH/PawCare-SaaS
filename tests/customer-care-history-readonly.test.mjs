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
