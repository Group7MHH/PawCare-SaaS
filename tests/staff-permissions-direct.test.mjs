import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Admin can grant and revoke Staff from account management',()=>{
 const api=read('backend/src/routes/accounts.ts');
 const ui=read('frontend/src/pages/Accounts.tsx');
 assert.match(api,/router\.patch\('\/accounts\/:id\/role',sensitiveLimit/);
 assert.match(api,/router\.use\(requireAuth,requireRole\('admin'\)\)/);
 assert.match(api,/await confirmAdmin\(req\.user!\.id,data\.admin_password\)/);
 assert.match(api,/z\.enum\(\['staff','customer'\]\)/);
 assert.match(ui,/Cấp quyền Staff/);
 assert.match(ui,/Thu hồi quyền Staff/);
 assert.match(ui,/roleChange\.mutate\(\)/);
});
test('Staff promotion updates users, memberships and profiles within one transaction',()=>{
 const source=read('backend/src/routes/accounts.ts');
 assert.match(source,/router\.patch\('\/accounts\/:id\/role'[\s\S]*?await transaction\(async db=>/);
 assert.match(source,/INSERT INTO organization_members/);
 assert.match(source,/ON CONFLICT\(organization_id,user_id\) DO UPDATE SET role='staff',is_active=TRUE/);
 assert.match(source,/INSERT INTO staff_profiles/);
 assert.match(source,/INSERT INTO organization_staff_profiles/);
 assert.match(source,/UPDATE users SET role=\? WHERE id=\?/);
 assert.match(source,/account\.role\.changed/);
});
test('Demotion protects in-flight bookings and keeps historical foreign keys',()=>{
 const source=read('backend/src/routes/accounts.ts');
 assert.match(source,/COUNT\(\*\)::int AS total[\s\S]*?status IN \('pending','confirmed','in_progress'\)/);
 assert.match(source,/busy\.total>0/);
 assert.match(source,/UPDATE organization_members SET is_active=FALSE/);
 assert.doesNotMatch(source,/DELETE FROM organization_members/);
 assert.match(source,/DELETE FROM sessions WHERE user_id=\?/);
 assert.match(source,/account\.role==='admin'/);
 assert.match(source,/target===req\.user!\.id/);
});
test('Invitation endpoints and UI have been removed',()=>{
 const organizations=read('backend/src/routes/organizations.ts');
 const auth=read('backend/src/routes/auth.ts');
 const main=read('frontend/src/main.tsx');
 const team=read('frontend/src/pages/Team.tsx');
 const catalog=read('frontend/src/pages/Catalog.tsx');
 assert.doesNotMatch(organizations,/router\.(?:get|post)\('\/organizations\/:id\/invitations/);
 assert.doesNotMatch(auth,/router\.post\('\/accept-invitation/);
 assert.doesNotMatch(main,/\/invite\/:token/);
 assert.doesNotMatch(team,/invite_url|Tạo link mời/);
 assert.match(team,/to="\/admin\/accounts"/);
 assert.match(catalog,/window\.location\.assign\('\/admin\/accounts'\)/);
 assert.doesNotMatch(catalog,/Mời nhân viên/);
});
test('Staff candidate listing does not include demoted customers',()=>{
 const catalog=read('backend/src/routes/catalog.ts');
 assert.match(catalog,/m\.role='staff' AND u\.role='staff' AND u\.is_active=TRUE/);
});
