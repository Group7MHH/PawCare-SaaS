import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('all local illustrations expose four numeric nonzero SVG viewBox values',()=>{
 const dir=new URL('../frontend/public/illustrations/',import.meta.url);
 const list=readdirSync(dir).filter(name=>name.endsWith('.svg'));
 assert.ok(list.length>=14);
 for(const filename of list){
  const svg=read('frontend/public/illustrations/'+filename);
  const raw=svg.match(/\bviewBox="([^"]+)"/)?.[1];
  assert.ok(raw,filename+' missing viewBox');
  const values=raw.trim().split(/[\s,]+/);
  assert.equal(values.length,4,filename+' invalid viewBox '+raw);
  const nums=values.map(Number);
  assert.ok(nums.every(Number.isFinite),filename+' nonnumeric viewBox '+raw);
  assert.ok(nums[2]>0&&nums[3]>0,filename+' bad dimensions');
  assert.match(svg,/<svg\b/);
  assert.match(svg,/<\/svg>\s*$/);
 }
});
test('six original service scenes plus nail and eye-ear hygiene are full-width vector graphics',()=>{
 for(const name of ['vaccine','groom','bath','checkup','dental','general','nails','hygiene']){
  const svg=read('frontend/public/illustrations/care-'+name+'.svg');
  assert.ok(svg.includes('viewBox="0 0 420 320"'),name);
  assert.ok(svg.includes('aria-label='),name);
 }
 const art=read('frontend/src/components/BrandArtwork.tsx');
 assert.ok(art.includes("return 'nails'"));
 assert.ok(art.includes("return 'hygiene'"));
 assert.ok(art.includes("return 'vaccine'"));
 assert.ok(art.includes("return 'groom'"));
});
test('service art is fitted without cropping, including mobile and reduced-motion',()=>{
 const css=read('frontend/src/service-art-repair.css');
 const main=read('frontend/src/main.tsx');
 assert.ok(main.includes("import './service-art-repair.css';"));
 for(const rule of ['object-fit:contain!important','object-position:center!important','max-width:760px','max-width:520px','prefers-reduced-motion:reduce','pc-service-plan-artwork']){
  assert.ok(css.includes(rule),rule);
 }
 const cards=read('frontend/src/components/ServiceCards.tsx');
 assert.ok(cards.includes('<ServiceArtwork'));
 assert.ok(cards.includes('money(service.price)'));
 assert.ok(cards.includes('onToggle(service.id)'));
});
