import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('customer payments has its own protected route and sidebar entry',()=>{
 const routes=read('frontend/src/main.tsx');
 const layout=read('frontend/src/components/Layout.tsx');
 assert.ok(routes.includes("import {CustomerPayments} from './pages/CustomerPayments'"));
 assert.ok(routes.includes('<Route path="/payments" element={<RolePage><CustomerPayments/></RolePage>}/>'));
 assert.ok(layout.includes("{to:'/payments',title:'Thanh toán',icon:CreditCard}"));
 const customer=layout.slice(layout.indexOf('const customerLinks'),layout.indexOf('const adminLinks'));
 assert.ok(customer.includes("to:'/payments'"));
 assert.ok(!layout.slice(layout.indexOf('const adminLinks'),layout.indexOf('const staffLinks')).includes("to:'/payments'"));
});
test('customer payment history uses real, customer-scoped paginated API and detail panel',()=>{
 const page=read('frontend/src/pages/CustomerPayments.tsx'),backend=read('backend/src/routes/payments.ts');
 for(const needle of ['PaymentPanel','/payments?status=','search=','page=','limit=','aria-pressed={filter===f.key}','setSelectedId(p.appointment_id)','<PaymentPanel key={selectedId} appointmentId={selectedId}/>','refetchInterval:20000','summary?.paid']){
  assert.ok(page.includes(needle),needle);
 }
 assert.ok(backend.includes("if(req.user!.role==='customer')"));
 assert.ok(backend.includes('p.customer_id=?'));
 assert.ok(backend.includes('pageParams(req)'));
 assert.ok(backend.includes('LIMIT ? OFFSET ?'));
 assert.ok(backend.includes('WHERE ${scope}'));
 assert.ok(backend.includes('res.json({items:publicItems,total:count.total,page,limit,summary})'));
});
test('transaction panel retains all customer payment actions and blocks self-confirmation',()=>{
 const panel=read('frontend/src/components/PaymentPanel.tsx');
 const backend=read('backend/src/routes/payments.ts');
 assert.ok(panel.includes('transfer-notice'));
 assert.ok(panel.includes('Tôi đã chuyển khoản'));
 assert.ok(panel.includes('Chờ đối soát'));
 assert.ok(backend.includes("requireRole('admin','staff')"));
 assert.ok(backend.includes("action!=='confirm_paid'"));
 assert.ok(backend.includes("status='pending_review'"));
 assert.ok(backend.includes("if(action==='confirm_paid')"));
 assert.ok(!read('frontend/src/pages/CustomerPayments.tsx').includes('/reconcile'));
});
test('payment page supports mobile and reduced motion',()=>{
 const css=read('frontend/src/customer-payments.css');
 assert.ok(read('frontend/src/main.tsx').includes("import './customer-payments.css';"));
 for(const needle of ['.pc-wallet-stats','.pc-wallet-item','.pc-wallet-detail','max-width:720px','max-width:510px','prefers-reduced-motion:reduce'])assert.ok(css.includes(needle),needle);
 assert.ok(read('frontend/src/pages/CustomerPayments.tsx').includes("event.key==='Escape'"));
});
