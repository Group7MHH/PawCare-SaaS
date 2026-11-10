import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('new sidebar logout retains original session revoke and accessible label',()=>{
 const layout=read('frontend/src/components/Layout.tsx');
 assert.match(layout,/className="sb-user"/);
 assert.match(layout,/title="Đăng xuất"/);
 assert.match(layout,/aria-label=\{`Đăng xuất tài khoản/);
 assert.match(layout,/logout\(\)\.catch\(\(\)=>toast\.error/);
 assert.match(layout,/setOpen\(false\)/);
});
test('new sidebar keeps logout visible while menu independently scrolls',()=>{
 const css=read('frontend/src/styles.css');
 assert.match(css,/\.sb\{[^}]*height:100dvh[^}]*display:flex;flex-direction:column/);
 assert.match(css,/\.sb-nav\{[^}]*flex:1;[^}]*overflow-y:auto/);
 assert.match(css,/\.sb-foot\{[^}]*border-top/);
 assert.match(css,/@media\(max-width:900px\)/);
 assert.match(css,/@media\(max-width:640px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
test('role-specific navigation and protected routes remain',()=>{
 const layout=read('frontend/src/components/Layout.tsx'),routes=read('frontend/src/main.tsx');
 for(const v of ["user.role==='staff'","user.role==='admin'","user.role!=='customer'"])assert.ok(layout.includes(v));
 assert.match(routes,/AdminOnly/);assert.match(routes,/StaffOnly/);
});
