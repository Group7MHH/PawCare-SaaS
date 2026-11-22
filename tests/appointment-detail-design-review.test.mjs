import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Appointment detail uses focused tabs and summary without changing actions',()=>{
 const page=read('frontend/src/pages/AdminAppointments.tsx');
 const ui=read('frontend/src/components/UI.tsx');
 const css=read('frontend/src/appointment-workflow.css');
 assert.ok(page.includes('pc-appt-detail-tabs'));
 for(const label of ['Xử lý lịch','Hồ sơ thú cưng','Thanh toán'])assert.ok(page.includes(label),label);
 for(const item of ["setDetailTab('manage')","setDetailTab('pet')","setDetailTab('payment')",'pc-appt-detail-facts','pc-appt-detail-hero'])assert.ok(page.includes(item),item);
 for(const item of ["save.mutate()","decision.mutate('accept')","decision.mutate('decline')","reschedule.mutate()","<PaymentPanel key={selected.id} appointmentId={selected.id} admin/>"])assert.ok(page.includes(item),item);
 assert.ok(ui.includes("className=''"));
 assert.ok(css.includes('.pc-appt-dialog.modal-wide'));
 assert.ok(css.includes('@media(max-width:540px)'));
});
test('Customer overview removes only redundant metrics journey strip',()=>{
 const page=read('frontend/src/pages/Overview.tsx');
 assert.ok(!page.includes('className="nb-index-strip nb-enter"'));
 assert.ok(!page.includes('Xem hành trình'));
 for(const item of ['nb-customer-layout','nb-pet-album','nb-appointment-section','nb-customer-bottom','nb-journey','nb-quick-notes'])assert.ok(page.includes(item),item);
 assert.ok(page.includes("api<Stats>('/dashboard')"));
});
test('Legacy pet future birthdays are flagged without mutating user records',()=>{
 const dossier=read('frontend/src/components/AppointmentPetProfile.tsx');
 const backend=read('backend/src/routes/pets.ts');
 assert.ok(dossier.includes('profile.data.pet.birthday.slice(0,10)>todayVN()'));
 assert.ok(dossier.includes('Ngày sinh trong tương lai'));
 assert.ok(!dossier.includes('PATCH'));
 assert.ok(backend.includes("refine(validBirthday,'Ngày sinh không hợp lệ hoặc nằm trong tương lai')"));
});
