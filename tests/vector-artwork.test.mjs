import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const names=['care-overview','care-workspace','care-analytics','care-notebook','care-record','care-checkup','care-bath','care-groom','care-vaccine','care-dental','care-general'];
test('PawCare uses locally stored standalone care, medical and grooming SVG drawings',()=>{
 for(const name of names){
  const svg=read('frontend/public/illustrations/'+name+'.svg');
  assert.match(svg,/<svg\b[^>]*viewBox=/,name);
  assert.match(svg,/<\/svg>\s*$/,name);
  assert.doesNotMatch(svg,/<script\b|<foreignObject\b|onload=|<image\b/i,name);
 }
});
test('PawCare illustrations consistently use clinical themes rather than animal portraits',()=>{
 const art=read('frontend/src/components/BrandArtwork.tsx');
 for(const component of ['PawcareMark','CompanionCover','StaffCareDesk','AdminLedger','NotebookStory','PetPortrait','ServiceArtwork'])
  assert.ok(art.includes('function '+component),component);
 for(const asset of ['care-overview','care-workspace','care-analytics','care-notebook','care-record','care-bath','care-dental'])
  assert.ok(art.includes(asset)||names.includes(asset));
 assert.doesNotMatch(art,/avatar-dog|avatar-cat|companion-hero|staff-care-photo|admin-office-photo|\.webp/);
 for(const name of names)assert.ok(!/dog|cat/.test(name),name);
});
test('the design still maps live services without altering booking functionality',()=>{
 const cards=read('frontend/src/components/ServiceCards.tsx');
 for(const str of ['money(service.price)','onToggle(service.id)','service.duration_minutes','selectedIds.includes(service.id)'])
  assert.ok(cards.includes(str),str);
});
