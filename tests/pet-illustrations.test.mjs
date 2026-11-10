import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('care illustrations are true SVG and replace pet-specific artwork in the UI',()=>{
 const art=read('frontend/src/components/BrandArtwork.tsx');
 const files=['care-overview','care-workspace','care-analytics','care-notebook','care-record','care-bath','care-groom','care-checkup','care-vaccine','care-dental','care-general'];
 for(const name of files){
  const svg=read('frontend/public/illustrations/'+name+'.svg');
  assert.ok(svg.length>900,name);
  assert.ok(svg.includes('viewBox'),name);
  assert.ok(svg.trim().endsWith('</svg>'),name);
 }
 assert.ok(art.includes('file="care-overview"'));
 assert.ok(art.includes('file="care-workspace"'));
 assert.ok(art.includes('file="care-analytics"'));
 assert.ok(art.includes('file="care-notebook"'));
 assert.ok(art.includes('file="care-record"'));
 assert.ok(art.includes('care-${serviceArtwork(label)}'));
 assert.ok(!art.includes('avatar-dog'));
 assert.ok(!art.includes('companion-hero'));
 assert.ok(!art.includes('.webp'));
});
test('brand, navigation, dashboard and service visual components remain intact',()=>{
 const art=read('frontend/src/components/BrandArtwork.tsx');
 for(const name of ['PawcareMark','CompanionCover','StaffCareDesk','AdminLedger','NotebookStory','PetPortrait','ServiceArtwork'])
  assert.ok(art.includes('function '+name),name);
 assert.ok(read('frontend/src/components/Layout.tsx').includes('<NotebookStory'));
 assert.ok(read('frontend/src/pages/Overview.tsx').includes('<CompanionCover'));
 assert.ok(read('frontend/src/pages/StaffDashboard.tsx').includes('<StaffCareDesk'));
 assert.ok(read('frontend/src/pages/AdminDashboard.tsx').includes('<AdminLedger'));
});
