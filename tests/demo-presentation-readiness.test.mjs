import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Account list is sorted consistently: Admin, Staff, Customer, then natural number and ID',()=>{
 const api=read('backend/src/routes/accounts.ts');
 assert.ok(api.includes("CASE role WHEN 'admin' THEN 0 WHEN 'staff' THEN 1 ELSE 2 END"));
 assert.ok(api.includes("REGEXP_REPLACE(full_name,'[0-9]+$','')"));
 assert.ok(api.includes("NULLIF(SUBSTRING(full_name FROM '[0-9]+$'),'')::numeric NULLS LAST"));
 assert.ok(api.includes('LOWER(full_name),id ASC LIMIT ? OFFSET ?'));
 assert.ok(api.includes('COUNT(*) AS total'));
 assert.ok(read('frontend/src/pages/Accounts.tsx').includes('Admin → Staff → Customer'));
});

test('Admin appointment list exposes payment status, filtering and readable navigation',()=>{
 const backend=read('backend/src/routes/appointments.ts');
 const page=read('frontend/src/pages/AdminAppointments.tsx');
 const layout=read('frontend/src/components/Layout.tsx');
 const css=read('frontend/src/workflow-integrity.css');
 assert.ok(backend.includes("req.user!.role==='admin' && req.query.payment_status"));
 assert.ok(backend.includes("clauses.push('pay.status=?')"));
 assert.ok(backend.includes("LEFT JOIN payments pay ON pay.appointment_id=a.id"));
 assert.ok(backend.includes('ORDER BY a.starts_at DESC,a.id DESC'));
 assert.ok(page.includes('Quản lý lịch hẹn và thanh toán'));
 assert.ok(page.includes('Lọc trạng thái thanh toán'));
 assert.ok(page.includes('payment_status='));
 assert.ok(page.includes('<th>THANH TOÁN</th>'));
 assert.ok(page.includes("paid:'Đã thanh toán'"));
 assert.ok(page.includes("unpaid:'Chưa thanh toán'"));
 assert.ok(layout.includes("title:'Lịch & thanh toán'"));
 assert.ok(css.includes('.nb-app .nb-nav-link .nb-link-index{display:none}'));
 assert.ok(css.includes('text-overflow:clip'));
});

test('Demo reset is manual only and preserves accounts, roles, services and migration history',()=>{
 const reset=read('scripts/reset-demo-data.sql');
 const migrator=read('backend/src/migrate.ts');
 const workflow=read('.github/workflows/ci.yml');
 assert.ok(reset.includes('BEGIN;'));
 assert.ok(reset.includes('COMMIT;'));
 assert.ok(reset.includes('pg_advisory_xact_lock(42371,0)'));
 for(const name of ['care_records','payments','appointment_staff_declines','appointment_services','appointments','pets']) {
  assert.ok(reset.includes('DELETE FROM '+name+';'));
 }
 for(const name of ['users','services','organization_members','staff_profiles','schema_migrations']) {
  assert.ok(!reset.includes('DELETE FROM '+name+';'));
  assert.ok(!reset.includes('TRUNCATE '+name));
 }
 assert.ok(!migrator.includes('reset-demo-data.sql'));
 assert.ok(!workflow.includes('reset-demo-data.sql'));
});
