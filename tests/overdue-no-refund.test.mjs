import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Admin filters display All first and overdue bookings last, default All',()=>{
 const ui=read('frontend/src/pages/AdminAppointments.tsx');
 assert.ok(ui.includes("[overdueOnly,setOverdueOnly]=useState(user?.role==='admin'&&searchParams.get('overdue')==='true')"));
 assert.ok(ui.includes('&overdue=${overdueOnly?\'true\':\'false\'}'));
 assert.ok(ui.includes('Lịch quá hẹn'));
 assert.ok(!ui.includes('>Cần điều phối</button>'));
 const controls=ui.slice(ui.indexOf('className="filter-tabs"'),ui.indexOf('</div><SearchBox'));
 assert.ok(controls.indexOf('>Tất cả</button>')<controls.indexOf('states.map'));
 assert.ok(controls.indexOf('states.map')<controls.indexOf('>Lịch quá hẹn</button>'));
});
test('Overdue means pending/confirmed with start in the past, never completed',()=>{
 const api=read('backend/src/routes/appointments.ts');
 assert.ok(api.includes("if(req.query.overdue==='true' && req.user!.role==='admin')"));
 assert.ok(api.includes("a.status IN ('pending','confirmed') AND a.starts_at < now()"));
 const dash=read('frontend/src/pages/AdminDashboard.tsx');
 assert.ok(dash.includes("/appointments?overdue=true&limit=1"));
 assert.ok(dash.includes("Lịch quá hẹn"));
});
test('No refund buttons, refund API action, or refunds newly generated on cancellation',()=>{
 const panel=read('frontend/src/components/PaymentPanel.tsx');
 const payments=read('backend/src/routes/payments.ts');
 const booking=read('backend/src/routes/appointments.ts');
 assert.ok(!panel.includes('confirm_refund'));
 assert.ok(!panel.includes('Xác nhận đã hoàn tiền'));
 assert.ok(!payments.includes("'confirm_refund'"));
 assert.ok(!booking.includes("THEN 'refund_required'"));
 assert.ok(booking.includes("if(payment&&!['unpaid','awaiting_payment','void'].includes(payment.status))"));
 assert.ok(booking.includes("UPDATE payments SET status='void'"));
 const customer=read('frontend/src/pages/MyAppointments.tsx');
 assert.ok(customer.includes("['unpaid','awaiting_payment','void'].includes(a.payment_status)"));
});
test('Legacy refund status codes stay supported for read-only records without migration',()=>{
 const payments=read('backend/src/routes/payments.ts');
 assert.ok(payments.includes("'refund_required'"));
 assert.ok(payments.includes("'refunded'"));
 const panel=read('frontend/src/components/PaymentPanel.tsx');
 assert.ok(panel.includes("refund_required:'Cần hoàn tiền'"));
 assert.ok(!read('frontend/src/pages/AdminAppointments.tsx').includes("{v:'refund_required',t:'Cần hoàn tiền'}"));
});
