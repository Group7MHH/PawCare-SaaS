import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('database supports waiting for bank payment and preserves old bank transfers',()=>{
 const sql=read('database/013_awaiting_bank_payment.sql');
 assert.ok(sql.includes("status='awaiting_payment'"));
 assert.ok(sql.includes("method='bank_transfer' AND status='unpaid'"));
 assert.ok(sql.includes('DROP CONSTRAINT IF EXISTS payments_status_check'));
 assert.ok(read('backend/src/migrate.ts').includes('013_awaiting_bank_payment.sql'));
});
test('new bank bookings start awaiting payment and cash bookings stay unpaid',()=>{
 const book=read('backend/src/routes/appointments.ts');
 assert.ok(book.includes("d.payment_method==='bank_transfer'?'awaiting_payment':'unpaid'"));
 const pay=read('backend/src/routes/payments.ts');
 assert.ok(pay.includes("method==='bank_transfer'?'awaiting_payment':'unpaid'"));
 assert.ok(pay.includes("if(p.status!=='awaiting_payment'||p.method!=='bank_transfer'"));
 assert.ok(pay.includes("status='pending_review'"));
 assert.ok(pay.includes("status=p.appointment_status==='cancelled'?'void':'awaiting_payment'"));
 assert.ok(pay.includes("'awaiting_payment'"));
});
test('customer, staff, admin render the waiting label and filters',()=>{
 const panel=read('frontend/src/components/PaymentPanel.tsx');
 const list=read('frontend/src/pages/CustomerPayments.tsx');
 const staff=read('frontend/src/pages/StaffDashboard.tsx');
 const admin=read('frontend/src/pages/AdminAppointments.tsx');
 assert.ok(panel.includes("awaiting_payment:'Chờ thanh toán'"));
 assert.ok(panel.includes("p.status==='awaiting_payment'&&bank"));
 assert.ok(list.includes("{key:'awaiting_payment',label:'Chờ thanh toán'}"));
 assert.ok(list.includes("summary.unpaid+summary.awaiting_payment"));
 assert.ok(staff.includes("a.payment_status==='awaiting_payment'?'Chờ thanh toán'"));
 assert.ok(admin.includes("a.payment_status==='awaiting_payment'?'Chờ thanh toán'"));
 assert.ok(read('backend/src/routes/management.ts').includes('awaiting_payment:finance.awaiting_payment'));
});
