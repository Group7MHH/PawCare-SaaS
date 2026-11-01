import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const read=(file)=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
test('approved art loads from public artwork with safe SVG fallback',()=>{
 const c=read('frontend/src/components/CuteIllustration.tsx');
 assert.match(c,/\/artwork\/\$\{file\}\.webp/);
 assert.doesNotMatch(c,/stickers-atlas\.webp/);
 for(const name of ["bath","groom","nails","ears","vet","spa","dental","walk","daycare","transport","banner-duo","banner-play","banner-family","empty","not-found","error"]){
  const size=statSync(new URL('../frontend/public/artwork/'+name+'.webp',import.meta.url)).size;
  assert.ok(size>4000,name+' illustration should be committed at useful resolution');
 }
 assert.match(c,/onError=.*failed:true/);
 assert.match(c,/PetArtwork/);
 assert.match(c,/cuteAssetForService/);
});
test('dashboard keeps Figma workflow sections and uses only real API data',()=>{
 const d=read('frontend/src/pages/AdminDashboard.tsx');
 for(const item of ['dashboard-grid','donut-section','bottom-grid','Truy cập nhanh','Doanh thu theo tháng','Lịch hẹn gần đây'])assert.ok(d.includes(item),item);
 assert.match(d,/api<Stats>\('\/dashboard'\)/);
 assert.match(d,/api<\{items:Service\[\]\}>\('\/services'\)/);
 assert.match(d,/pc-featured-grid/);
});
test('multi-service booking API contract is not modified',()=>{
 const b=read('frontend/src/pages/Booking.tsx');
 for(const expected of ['service_ids:serviceIds','totalPrice=selected.reduce','duration=selected.reduce','/appointments/availability'])assert.ok(b.includes(expected),expected);
});
test('animations honor reduced-motion preference',()=>{
 const css=read('frontend/src/styles.css');
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/pc-soft-enter/);
 assert.match(css,/pc-soft-glow/);
});
