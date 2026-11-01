import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('dashboard keeps its original Figma sections and only adds illustration',()=>{
 const view=read('frontend/src/pages/AdminDashboard.tsx');
 for(const name of ['metrics-grid four','dashboard-grid','donut-section','bottom-grid','Truy cập nhanh','Lịch hẹn gần đây','Doanh thu theo tháng']){
  assert.ok(view.includes(name),'Missing original dashboard section: '+name);
 }
 assert.match(view,/(?:PetArtwork kind="welcome"|CuteIllustration kind="welcome" asset="banner-duo")/);
 assert.match(view,/api<Stats>\('\/dashboard'\)/);
});
test('illustrations offer distinct service-specific scenes, not repeated single mascot',()=>{
 const art=read('frontend/src/components/PetArtwork.tsx');
 for(const kind of ['bath','groom','nails','vet','spa','ears','walk','dental','daycare']){
  assert.ok(art.includes(kind+':'), 'Missing '+kind+' scene');
 }
 for(const title of ['BathPoodle','GroomMaltese','NailsCorgi','EarTabby','VetShiba','SpaCat','WalkDachshund']){
  assert.ok(art.includes('function '+title),'Missing distinct character '+title);
 }
});
test('customer booking remains multi-service and pets can have varying portraits',()=>{
 const booking=read('frontend/src/pages/Booking.tsx');
 const pets=read('frontend/src/pages/Pets.tsx');
 assert.match(booking,/service_ids:serviceIds/);
 assert.match(booking,/totalPrice=selected\.reduce/);
 assert.match(booking,/duration=selected\.reduce/);
 assert.match(booking,/service_ids:serviceIds/);
 assert.match(booking,/(?:variant=\{p\.id\}|CuteIllustration kind=\{p\.species)/);
 assert.match(pets,/(?:variant=\{pet\.id\}|CuteIllustration className="pc-pet-profile-art")/);
});
