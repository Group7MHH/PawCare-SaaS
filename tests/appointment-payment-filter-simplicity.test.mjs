import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Admin appointment page keeps simple appointment-state tabs, not a second payment filter bar',()=>{
 const ui=read('frontend/src/pages/AdminAppointments.tsx');
 assert.ok(ui.includes('className="filter-tabs"'));
 assert.ok(ui.includes('Lịch quá hẹn'));
 assert.ok(!ui.includes('pc-pay-filter-bar'));
 assert.ok(!ui.includes('setPaymentStatus'));
 assert.ok(!ui.includes('&payment_status='));
});

test('Removing filter chips does not remove payment visibility or Admin reconciliation',()=>{
 const ui=read('frontend/src/pages/AdminAppointments.tsx');
 const panel=read('frontend/src/components/PaymentPanel.tsx');
 const backend=read('backend/src/routes/payments.ts');
 assert.ok(ui.includes('<th>THANH TOÁN</th>'));
 assert.ok(ui.includes('paymentLabels[a.payment_status'));
 assert.ok(ui.includes('<PaymentPanel key={selected.id} appointmentId={selected.id} admin/>'));
 assert.ok(panel.includes('pending_review'));
 assert.ok(backend.includes('pending_review'));
});
