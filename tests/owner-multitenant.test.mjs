import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');
const schema=file('infra/004_single_store.sql');
const auth=file('apps/api/src/lib/auth.ts');
const appointments=file('apps/api/src/routes/appointments.ts');
const org=file('apps/api/src/routes/organizations.ts');
const ui=file('apps/web/src/main.tsx');
test('single store migration refuses ambiguous legacy database',()=>{
 assert.match(schema,/store_count > 1/);
 assert.match(schema,/RAISE EXCEPTION/);
 assert.match(schema,/role IN \('customer','staff','admin'\)/);
 assert.match(schema,/duration_minutes_snapshot/);
 assert.match(schema,/appointment_id/);
});
test('session roles come from users, and Owner route is removed',()=>{
 assert.match(auth,/u.role AS role/);
 assert.doesNotMatch(auth,/type Role=.*owner/);
 assert.doesNotMatch(ui,/path="\/owner"/);
 assert.doesNotMatch(ui,/OwnerConsole/);
});
test('staff invitations are admin only',()=>{
 assert.match(org,/requireRole\('admin'\)/);
 assert.match(org,/z.literal\('staff'\)/);
 assert.doesNotMatch(org,/\/owner\/organizations/);
});
test('booking reserves assigned staff and stores duration snapshot',()=>{
 assert.match(appointments,/pg_advisory_xact_lock/);
 assert.match(appointments,/duration_minutes_snapshot/);
 assert.match(appointments,/care_result/);
 assert.match(appointments,/INSERT INTO care_records/);
});
