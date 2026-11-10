import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('payment updates acquire booking lock before payment lock to serialize cancellation',()=>{
 const source=read('backend/src/routes/payments.ts');
 for(const [start,end] of [["router.patch('/:id/method'","router.post('/:id/transfer-notice'"],["router.post('/:id/transfer-notice'","router.post('/:id/reconcile'"]]){
  const action=source.slice(source.indexOf(start),source.indexOf(end));
  const first=action.indexOf("SELECT id FROM appointments WHERE id=? AND organization_id=? FOR UPDATE");
  const second=action.indexOf('FOR UPDATE OF p,a');
  assert.ok(first>=0 && second>first, 'booking is locked before payment');
  assert.ok(action.includes("p.appointment_status==='cancelled'"), 'cancelled bookings must be rejected');
  assert.ok(action.includes("locked.customer_id!==req.user!.id") || action.includes("p.customer_id!==req.user!.id"), 'Customer ownership is enforced');
 }
 assert.ok(source.includes("router.post('/:id/reconcile',requireRole('admin')"), 'only Admin can reconcile');
});

test('Staff cannot view pet history for pending or cancelled bookings or write premature care notes',()=>{
 const pets=read('backend/src/routes/pets.ts');
 const customers=read('backend/src/routes/management.ts');
 assert.ok(pets.includes("a.status IN ('confirmed','in_progress','completed')"));
 assert.ok(pets.includes("status IN ('confirmed','in_progress','completed') LIMIT 1"));
 assert.ok(pets.includes("status IN ('in_progress','completed') LIMIT 1"));
 assert.ok(pets.includes("Staff chỉ được ghi hồ sơ"));
 assert.ok(customers.includes("a.status IN ('confirmed','in_progress','completed')"));
 assert.ok(pets.includes("record.appointment_id!==null"));
});

test('Login/register rate limits protect against brute-force requests',()=>{
 const source=read('backend/src/routes/auth.ts');
 assert.ok(source.includes("router.use('/login',loginLimit)"));
 assert.ok(source.includes("router.use('/register',registerLimit)"));
 assert.ok(source.includes("limit:12"));
 assert.ok(source.includes("limit:10"));
});

test('Manual one-time reset script and references are gone',()=>{
 assert.equal(existsSync(new URL('../scripts/reset-demo-data.sql',import.meta.url)),false);
 assert.ok(!read('README.md').includes('reset-demo-data.sql'));
 assert.ok(!read('backend/src/migrate.ts').includes('reset-demo-data.sql'));
});
