import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('logout button remains accessible and uses original auth logic',()=>{
 const layout=read('frontend/src/components/Layout.tsx');
 assert.match(layout,/className="side-user"/);
 assert.match(layout,/title="Đăng xuất"/);
 assert.match(layout,/aria-label=\{`Đăng xuất tài khoản/);
 assert.match(layout,/logout\(\)\.catch\(\(\)=>toast\.error/);
 assert.match(layout,/className="logout-action"/);
 assert.match(layout,/setOpen\(false\)/);
});
test('sidebar uses visible footer and independently scrollable navigation',()=>{
 const css=read('frontend/src/styles.css');
 const region=css.slice(css.lastIndexOf('/* Responsive sidebar logout:'));
 assert.match(region,/height:100dvh/);
 assert.match(region,/\.sidebar nav\{[\s\S]*?min-height:0;[\s\S]*?overflow-y:auto/);
 assert.match(region,/\.sidebar-bottom\{[\s\S]*?flex:0 0 auto/);
 assert.match(region,/\.side-user\{[\s\S]*?min-height:56px/);
 assert.match(region,/@media\(max-height:800px\)/);
 assert.match(region,/@media\(max-height:490px\)/);
 assert.match(region,/@media\(max-width:760px\)/);
 assert.match(region, /@media\(prefers-reduced-motion:reduce\)/);
});
test('role-specific navigation and protected routes are untouched',()=>{
 const layout=read('frontend/src/components/Layout.tsx');
 const routes=read('frontend/src/main.tsx');
 assert.match(layout,/user\.role==='staff'/);
 assert.match(layout,/user\.role==='admin'/);
 assert.match(layout,/user\.role!=='customer'/);
 assert.match(routes,/AdminOnly/);
 assert.match(routes,/StaffOnly/);
});
