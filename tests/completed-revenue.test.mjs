import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file = p => readFileSync(new URL(p,import.meta.url),'utf8');
const migration=file('../database/005_completed_revenue.sql');
const runner=file('../backend/src/migrate.ts');
const booking=file('../backend/src/routes/appointments.ts');
const dashboard=file('../backend/src/routes/management.ts');

test('completion timestamp migration runs and backfills prior completed appointments',()=>{
 assert.match(runner,/005_completed_revenue\.sql/);
 assert.match(migration,/ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ/);
 assert.match(migration,/SET completed_at = updated_at/);
 assert.match(migration,/WHERE status = 'completed'/);
});
test('completing an appointment records the completion time',()=>{
 assert.match(booking,/completed_at=CASE WHEN/);
 assert.match(booking,/THEN now\(\) ELSE completed_at END/);
});
test('dashboard separates projected appointment value from confirmed cash receipts by Vietnam month',()=>{
 assert.match(dashboard,/date_trunc\('month',starts_at AT TIME ZONE 'Asia\/Ho_Chi_Minh'\)/);
 assert.match(dashboard,/date_trunc\('month',paid_at AT TIME ZONE 'Asia\/Ho_Chi_Minh'\)/);
 assert.match(dashboard,/payment_status='paid' AND paid_at IS NOT NULL/);
 assert.match(dashboard,/interval '5 months'/);
});
