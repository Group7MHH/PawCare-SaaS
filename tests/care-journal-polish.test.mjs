import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('pet care collection keeps live API, editable records and working navigation',()=>{
 const pets=read('frontend/src/pages/Pets.tsx');
 for(const phrase of ["queryKey:['pets']","api<{items:Pet[]}>('/pets')","setAdding(true)","<PetEditor","'/pets/'+p.id","recordTab==='vaccination'","filteredRecords=records.filter","removeRecord.mutate(r.id)"]){
  assert.ok(pets.includes(phrase),phrase);
 }
 assert.ok(pets.includes('pc-record-collection'));
 assert.ok(pets.includes('aria-pressed={filter===t.key}'));
 assert.ok(pets.includes('record_count'));
});
test('care artwork is local and decorative, not fake patient data',()=>{
 const art=read('frontend/src/components/CareArtwork.tsx');
 const hero=read('frontend/src/components/PageHero.tsx');
 assert.match(art,/aria-hidden="true"/);
 assert.match(art,/pc-care-art/);
 assert.ok(hero.includes('CareArtwork'));
 assert.ok(!art.includes('fetch('));
});
test('site-wide card motion supports touch, mobile and reduced-motion',()=>{
 const css=read('frontend/src/care-polish.css'),main=read('frontend/src/main.tsx');
 for(const s of ['pc-card-appear','pc-record-card','nb-staff-task','nb-admin-stat','nb-pet-polaroid','pc-service-plan','pc-care-art','prefers-reduced-motion:reduce','max-width:520px']){
  assert.ok(css.includes(s),s);
 }
 assert.match(main,/import '\.\/care-polish\.css'/);
});
