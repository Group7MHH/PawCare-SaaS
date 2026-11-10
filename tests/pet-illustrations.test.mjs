import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const base=new URL('../frontend/public/illustrations/',import.meta.url);
const source=readFileSync(new URL('../frontend/src/components/BrandArtwork.tsx',import.meta.url),'utf8');
const webpFiles=[
 'companion-hero','staff-care-photo','admin-office-photo',
 'avatar-dog','avatar-cat','service-checkup','service-bath','service-groom',
 'service-vaccine','service-dental','service-general'
];

test('pet artwork images are optimized local WebP rather than distorted SVG silhouettes',()=>{
 for(const name of webpFiles){
  const buf=readFileSync(new URL(`${name}.webp`,base));
  assert.ok(buf.length>3000,`${name} image is unexpectedly small`);
  assert.equal(buf.toString('ascii',0,4),'RIFF',`${name} missing RIFF header`);
  assert.equal(buf.toString('ascii',8,12),'WEBP',`${name} is not a WebP file`);
 }
});

test('functional navigation and branding remain vector, pet scenes use local illustrations',()=>{
 assert.match(source,/const base='\/illustrations\/'/);
 for(const x of ['function PawcareMark','function NotebookStory','function PetPortrait','function CompanionCover','function StaffCareDesk','function AdminLedger','function ServiceArtwork']){
  assert.ok(source.includes(x),x);
 }
 assert.match(source,/file="companion-hero" format="webp"/);
 assert.match(source,/file="staff-care-photo" format="webp"/);
 assert.match(source,/file="admin-office-photo" format="webp"/);
 assert.match(source,/format="webp" className="pc-service-svg"/);
 assert.match(source,/species==='dog'\|\|species==='cat'/);
 assert.ok(!source.includes('https://'));
});
