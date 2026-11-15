import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Admin and accepted Staff see read-only pet dossier from appointment details',()=>{
 const modal=read('frontend/src/pages/AdminAppointments.tsx');
 const dossier=read('frontend/src/components/AppointmentPetProfile.tsx');
 assert.ok(modal.includes('Chi tiết lịch hẹn #'));
 assert.ok(modal.includes('AppointmentPetProfile'));
 assert.ok(modal.includes("user?.role==='admin'"));
 assert.ok(modal.includes("selected.staff_id===user.id&&['confirmed','in_progress','completed'].includes(selected.status)"));
 assert.ok(modal.includes('Vui lòng nhận lịch trước khi xem hồ sơ và lịch sử chăm sóc.'));
 assert.ok(modal.includes('viewerId={user!.id}'));
 assert.ok(dossier.includes("queryKey:['appointment-pet-profile',viewerId,petId]"));
 assert.ok(dossier.includes('api<PetProfileResponse>(`/pets/${petId}`)'));
 for(const label of ['Hồ sơ thú cưng','Loài','Giống','Giới tính','Ngày sinh','Cân nặng','Màu lông','Lưu ý từ chủ thú cưng','Lịch sử chăm sóc']){
  assert.ok(dossier.includes(label),label);
 }
 assert.ok(!dossier.includes('PATCH'));
 assert.ok(!dossier.includes('DELETE'));
});

test('Backend restricts pet dossier access to assigned and accepted Staff',()=>{
 const api=read('backend/src/routes/pets.ts');
 assert.ok(api.includes("staff_id=? AND status IN ('confirmed','in_progress','completed')"));
 assert.ok(api.includes("router.get('/:id'"));
 assert.ok(api.includes('const pet=await ownedPet(idParam(req.params.id),req)'));
 assert.ok(api.includes('FROM care_records WHERE pet_id=?'));
 assert.ok(api.includes('AND organization_id=?'));
});

test('Appointment pet detail has responsive styling',()=>{
 const css=read('frontend/src/pages.css');
 assert.ok(css.includes('.pc-appointment-pet-grid'));
 assert.ok(css.includes('.pc-appointment-pet-history'));
 assert.ok(css.includes('@media(max-width:650px)'));
});
