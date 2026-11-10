import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('demo confirmation requires neither bank reference nor proof but keeps staff permissions',()=>{
 const route=read('backend/src/routes/payments.ts');
 const start=route.indexOf("router.post('/:id/reconcile'");
 const area=route.slice(start);
 assert.ok(area.includes("requireRole('admin','staff')"));
 assert.ok(area.includes("p.staff_id!==req.user!.id"));
 assert.ok(area.includes("action!=='confirm_paid'"));
 assert.ok(area.includes("p.method!=='bank_transfer'||p.status!=='pending_review'"));
 assert.ok(area.includes("['confirmed','in_progress','completed']"));
 assert.ok(!area.includes("verification_reference"));
 assert.ok(area.includes('reviewed_by=?'));
 assert.ok(area.includes('demo_confirmation:demoBankConfirmation'));
 assert.ok(area.includes('bank_verified:false'));
 assert.ok(area.includes("status=p.appointment_status==='cancelled'?'refund_required':'paid'"));
});
test('customer never self-confirms and demo screen is one clear button',()=>{
 const route=read('backend/src/routes/payments.ts');
 const ui=read('frontend/src/components/PaymentPanel.tsx');
 const notice=route.slice(route.indexOf("router.post('/:id/transfer-notice'"),route.indexOf("router.post('/:id/reconcile'"));
 assert.ok(notice.includes("status='pending_review'"));
 assert.ok(!notice.includes("status='paid'"));
 assert.ok(ui.includes('Xác nhận chuyển khoản (Demo)'));
 assert.ok(ui.includes('Chuyển khoản chỉ mô phỏng trong bản demo.'));
 assert.ok(ui.includes('không có kết nối hoặc xác minh giao dịch ngân hàng'));
 assert.ok(!ui.includes('verificationReference'));
 assert.ok(!ui.includes('Mã giao dịch ngân hàng đã đối chiếu'));
 assert.ok(!ui.includes('Bằng chứng/ghi chú xác minh (bắt buộc)'));
});
test('Admin keeps refund/reject note requirements and cash confirmation',()=>{
 const route=read('backend/src/routes/payments.ts');
 const ui=read('frontend/src/components/PaymentPanel.tsx');
 assert.ok(route.includes("if(!note)throw new HttpError(422,'Vui lòng nhập lý do từ chối đối soát')"));
 assert.ok(route.includes("if(!note)throw new HttpError(422,'Cần ghi lại bằng chứng/ghi chú hoàn tiền')"));
 assert.ok(route.includes("if(p.method==='cash' && p.status==='unpaid')status='paid'"));
 assert.ok(ui.includes('Từ chối đối soát'));
 assert.ok(ui.includes('Xác nhận đã hoàn tiền'));
});
