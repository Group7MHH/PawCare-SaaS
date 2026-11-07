import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const api=read('backend/src/routes/accounts.ts');
const ui=read('frontend/src/pages/Accounts.tsx');

test('only authorized Admin can preview and hard-delete non-Admin accounts',()=>{
 assert.match(api,/router\.use\(requireAuth,requireRole\('admin'\)\)/);
 assert.match(api,/router\.get\('\/accounts\/:id\/delete-preview',sensitiveLimit/);
 assert.match(api,/router\.delete\('\/accounts\/:id',sensitiveLimit/);
 assert.match(api,/target===req\.user!\.id/);
 assert.match(api,/account\.role==='admin'/);
 assert.match(api,/confirmAdmin\(req\.user!\.id,data\.admin_password\)/);
 assert.match(api,/confirmation_email!==account\.email/);
});

test('permanent deletion executes atomically with impact validation and account cleanup',()=>{
 assert.match(api,/await transaction\(async db=>/);
 assert.match(api,/pg_advisory_xact_lock/);
 assert.match(api,/expected_appointments!==impact\.appointments/);
 assert.match(api,/DELETE FROM care_records/);
 assert.match(api,/DELETE FROM appointments/);
 assert.match(api,/DELETE FROM pets WHERE owner_id=\?/);
 assert.match(api,/DELETE FROM invitations WHERE created_by=\?/);
 assert.match(api,/DELETE FROM role_audit_logs WHERE actor_id=\? OR target_user_id=\?/);
 assert.match(api,/DELETE FROM users WHERE id=\?/);
 assert.match(api,/account\.permanently_deleted/);
});

test('Admin UI previews effects and requires typed email and Admin password',()=>{
 assert.match(ui,/delete-preview/);
 assert.match(ui,/Xóa tài khoản vĩnh viễn/);
 assert.match(ui,/confirmationEmail\.trim\(\)\.toLowerCase\(\)!==selected\.email/);
 assert.match(ui,/expected_appointments:deletePreview\.data!\.appointments/);
 assert.match(ui,/admin_password:adminPassword/);
 assert.match(ui,/json\('DELETE'/);
 assert.match(ui,/Nếu xóa Staff/);
});
