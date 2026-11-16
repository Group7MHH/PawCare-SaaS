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
