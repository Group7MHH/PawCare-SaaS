import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('account endpoints restrict both viewing and changes to admin',()=>{
 const routes=read('backend/src/routes/accounts.ts');
 const entry=read('backend/src/index.ts');
 assert.match(routes,/router\.use\(requireAuth,requireRole\('admin'\)\)/);
 assert.match(routes,/router\.get\('\/accounts'/);
 assert.match(routes,/router\.patch\('\/accounts\/:id',sensitiveLimit/);
 assert.match(routes,/router\.post\('\/accounts\/:id\/reset-password',sensitiveLimit/);
 assert.ok(entry.includes("app.use('/api',accounts)"));
});
test('admin can never read or reverse an existing password hash',()=>{
 const routes=read('backend/src/routes/accounts.ts');
 assert.match(routes,/SELECT id,full_name,email,phone,address,role,is_active,created_at FROM users/);
 assert.doesNotMatch(routes,/SELECT \* FROM users/);
 assert.match(routes,/bcrypt\.compare\(password,admin\.password_hash\)/);
 assert.match(routes,/randomBytes\(18\)\.toString\('base64url'\)/);
 assert.match(routes,/bcrypt\.hash\(temporaryPassword,12\)/);
 assert.doesNotMatch(routes,/res\.json\([^\n]*password_hash/);
});
test('password reset invalidates prior sessions and keeps secret out of audit',()=>{
 const route=read('backend/src/routes/accounts.ts');
 assert.match(route,/DELETE FROM sessions WHERE user_id=\?/);
 assert.match(route,/account\.password\.reset/);
 assert.match(route,/JSON\.stringify\(\{sessions_revoked:true\}\)/);
 assert.match(route,/Cache-Control','no-store/);
 assert.match(route,/target===req\.user!\.id/);
 assert.match(route,/account\.role==='admin'/);
 assert.match(route,/temporary_password:temporaryPassword/);
});
test('frontend route and navigation are admin-only',()=>{
 const main=read('frontend/src/main.tsx');
 const layout=read('frontend/src/components/Layout.tsx');
 const page=read('frontend/src/pages/Accounts.tsx');
 assert.match(main,/path="\/admin\/accounts" element=\{<AdminOnly><Accounts\/><\/AdminOnly>\}/);
 assert.ok(layout.includes("user.role==='admin'?["));
 assert.ok(layout.includes("to:'/admin/accounts'"));
 assert.ok(page.includes("'/accounts/'+selected!.id+'/reset-password'"));
 assert.ok(page.includes('Mật khẩu cũ không thể xem lại'));
 assert.ok(page.includes('Chỉ hiển thị lần này'));
});
test('existing three-role authentication remains intact',()=>{
 const auth=read('backend/src/routes/auth.ts');
 assert.match(auth,/bcrypt\.compare\(d\.password,u\.password_hash\)/);
 assert.match(auth,/router\.patch\('\/password'/);
 assert.match(auth,/DELETE FROM sessions WHERE user_id=\?/);
});
