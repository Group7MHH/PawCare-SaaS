import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

const files=['pawcare-mark','companion-cover','staff-care-desk','admin-ledger','sidebar-story','avatar-dog','avatar-cat','avatar-other','service-bath','service-groom','service-checkup','service-vaccine','service-dental','service-general'];
test('PawCare stores its visual identity as real editable local SVG artworks',()=>{
 for(const name of files){
  const data=read(`frontend/public/illustrations/${name}.svg`);
  assert.match(data,/<svg\b[^>]*viewBox=/,name);
  assert.match(data,/<\/svg>\s*$/,name);
  assert.doesNotMatch(data,/<script\b|<foreignObject\b|<image\s[^>]*href="https?:|onload=/i,name);
 }
});
test('PawCare Notebook uses a unified artwork set instead of generic species glyphs',()=>{
 const art=read('frontend/src/components/BrandArtwork.tsx');
 const layout=read('frontend/src/components/Layout.tsx');
 const dashboard=read('frontend/src/pages/Overview.tsx');
 const staff=read('frontend/src/pages/StaffDashboard.tsx');
 const admin=read('frontend/src/pages/AdminDashboard.tsx');
 const avatar=read('frontend/src/components/PetAvatar.tsx');
 const catalog=read('frontend/src/components/ServiceCards.tsx');
 assert.ok(art.includes("const base='/illustrations/'"));
 for(const name of ['PawcareMark','CompanionCover','StaffCareDesk','AdminLedger','NotebookStory','PetPortrait','ServiceArtwork']) assert.ok(art.includes(`function ${name}`),name);
 assert.ok(layout.includes('<PawcareMark')&&layout.includes('<NotebookStory'));
 assert.ok(dashboard.includes('<CompanionCover')&&dashboard.includes('<NotebookStory'));
 assert.ok(staff.includes('<StaffCareDesk'));
 assert.ok(admin.includes('<AdminLedger'));
 assert.ok(avatar.includes('<PetPortrait'));
 assert.ok(catalog.includes('<ServiceArtwork'));
});
test('Service illustrations never modify existing booking and price logic',()=>{
 const cards=read('frontend/src/components/ServiceCards.tsx');
 assert.ok(cards.includes('selectedIds.includes(service.id)'));
 assert.ok(cards.includes('onToggle(service.id)'));
 assert.ok(cards.includes('money(service.price)'));
 assert.ok(cards.includes('/book?service_ids='));
 assert.ok(cards.includes('service.duration_minutes'));
});
test('SVG animations respect reduced-motion and mobile screen widths',()=>{
 const css=read('frontend/src/notebook.css');
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/\.pc-service-plan-artwork/);
 assert.match(css,/\.nb-cover-illustration/);
 assert.match(css,/@media\(max-width:520px\)/);
});
