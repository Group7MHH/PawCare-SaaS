import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const api = readFileSync(new URL('../apps/api/src/routes/catalog.ts', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../apps/web/src/pages/Catalog.tsx', import.meta.url), 'utf8');

test('service deletion supports non-destructive stop and separate permanent delete', () => {
 assert.match(api, /router\.delete\('\/services\/:id'/);
 assert.match(api, /is_active=FALSE/);
 assert.match(api, /router\.get\('\/services\/:id\/delete-preview',requireRole\('admin'\)/);
 assert.match(api, /router\.post\('\/services\/:id\/permanent-delete',requireRole\('admin'\)/);
});

test('permanent service deletion confirms impact and preserves care history atomically', () => {
 assert.match(api, /confirmation_name/);
 assert.match(api, /expected_appointments/);
 assert.match(api, /await transaction\(async db=>/);
 assert.match(api, /FOR UPDATE/);
 assert.match(api, /UPDATE care_records SET appointment_id=NULL/);
 assert.match(api, /DELETE FROM appointments WHERE service_id=/);
 assert.match(api, /DELETE FROM services WHERE id=/);
 assert.match(api, /service\.permanently_delete/);
});

test('Admin UI previews affected appointments and requires exact service name', () => {
 assert.match(ui, /Xóa vĩnh viễn/);
 assert.match(ui, /delete-preview/);
 assert.match(ui, /confirmationName===entry\.name/);
 assert.match(ui, /permanent-delete/);
 assert.match(ui, /lịch đã hoàn thành/);
});
