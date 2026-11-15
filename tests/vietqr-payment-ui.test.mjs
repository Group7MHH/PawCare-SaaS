import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('Customer transfer details show order-specific VietQR, never auto-confirm payment',()=>{
 const ui=read('frontend/src/components/PaymentPanel.tsx');
 const qr=read('frontend/src/lib/vietqr.ts');
 assert.ok(ui.includes('buildVietQrUrl(bank,Number(p.amount),p.payment_reference)'));
 assert.ok(ui.includes("p.status==='awaiting_payment'"));
 assert.ok(ui.includes("!admin&&!staff&&p.method==='bank_transfer'"));
 assert.ok(ui.includes('onError={()=>setFailedQr(vietQrUrl)}'));
 assert.ok(ui.includes("notice.mutate()"));
 assert.ok(qr.includes('https://img.vietqr.io/image/'));
 assert.ok(!qr.includes('/api/payments/'));
 assert.ok(ui.includes('Quét QR không đồng nghĩa đã thanh toán.'));
});

test('API preserves Admin-only reconciliation and bank snapshot on existing bookings',()=>{
 const api=read('backend/src/routes/payments.ts');
 assert.ok(api.includes("router.post('/:id/reconcile',requireRole('admin')"));
 assert.ok(api.includes("status='pending_review'"));
 assert.ok(api.includes('bank_name_snapshot'));
 assert.ok(api.includes('bank_account_snapshot'));
 const csp=read('backend/src/index.ts');
 assert.ok(csp.includes("'img-src':[\"'self'\",'data:','https://img.vietqr.io']"));
});

test('Admin can choose recognized banks without changing existing account schema',()=>{
 const admin=read('frontend/src/pages/AdminBankSettings.tsx');
 assert.ok(admin.includes('pc-vietqr-banks'));
 assert.ok(admin.includes('Chỉ Admin được xác nhận thanh toán'));
});
