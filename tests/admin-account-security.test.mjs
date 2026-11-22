import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('account endpoints restrict viewing, revocation, and deletion to Admin',()=>{
 const routes=read('backend/src/routes/accounts.ts');
 const entry=read('backend/src/index.ts');
 assert.match(routes,/router\.use\(requireAuth,requireRole\('admin'\)\)/);
 assert.match(routes,/router\.get\('\/accounts'/);
 assert.match(routes,/router\.patch\('\/accounts\/:id\/role',sensitiveLimit/);
 assert.match(routes,/router\.delete\('\/accounts\/:id',sensitiveLimit/);
 assert.doesNotMatch(routes,/router\.patch\('\/accounts\/:id',sensitiveLimit/);
 assert.doesNotMatch(routes,/router\.post\('\/accounts\/:id\/reset-password'/);
 assert.ok(entry.includes("app.use('/api',accounts)"));
});
test('Admin cannot read existing passwords or reset another account password',()=>{
 const routes=read('backend/src/routes/accounts.ts');
 assert.match(routes,/SELECT id,full_name,email,phone,address,role,is_active,created_at FROM users/);
 assert.doesNotMatch(routes,/SELECT \* FROM users/);
 assert.match(routes,/bcrypt\.compare\(password,admin\.password_hash\)/);
 assert.doesNotMatch(routes,/temporary_password:temporaryPassword/);
 assert.doesNotMatch(routes,/account\.password\.reset/);
});
test('revocation requires Admin password, logs changes and revokes sessions',()=>{
 const route=read('backend/src/routes/accounts.ts');
 assert.match(route,/DELETE FROM sessions WHERE user_id=\?/);
 assert.match(route,/account\.role\.changed/);
 assert.match(route,/Cache-Control','no-store/);
 assert.match(route,/target===req\.user!\.id/);
 assert.match(route,/account\.role==='admin'/);
 assert.match(route,/role:z\.literal\('customer'\)/);
});
test('navigation hides account tools from non-admin roles',()=>{
 const main=read('frontend/src/main.tsx'),layout=read('frontend/src/components/Layout.tsx'),page=read('frontend/src/pages/Accounts.tsx');
 assert.match(main,/path="\/admin\/accounts" element=\{<AdminOnly><Accounts\/><\/AdminOnly>\}/);
 assert.match(layout,/user\.role==='admin'/);
 assert.match(layout,/adminOnlyLinks/);
 assert.ok(layout.includes("to:'/admin/accounts'"));
 assert.ok(page.includes("'/accounts/'+selected!.id+'/delete-preview'"));
 assert.ok(page.includes('Thu hồi quyền Staff'));
 assert.ok(!page.includes('Đặt lại mật khẩu'));
});
test('three-role authentication remains unchanged',()=>{
 const auth=read('backend/src/routes/auth.ts');
 assert.match(auth,/bcrypt\.compare\(d\.password,u\.password_hash\)/);
 assert.match(auth,/router\.patch\('\/password'/);
 assert.match(auth,/DELETE FROM sessions WHERE user_id=\?/);
});
