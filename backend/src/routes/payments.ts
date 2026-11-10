import {Router} from 'express';
import {z} from 'zod';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import {pool,rows,exec,transaction,type DB} from '../lib/db.js';
import {asyncRoute,HttpError,idParam,pageParams,parse} from '../lib/http.js';
import {orgId,requireAuth,requireOrganization,requireRole} from '../lib/auth.js';
import {getBankSettings,getActiveBank} from '../lib/payment-bank.js';

export type PaymentStatus='unpaid'|'awaiting_payment'|'pending_review'|'paid'|'refund_required'|'refunded'|'void';
type PaymentRow={
 id:number;organization_id:number;appointment_id:number;customer_id:number;
 amount:number;currency:string;method:'cash'|'bank_transfer';status:PaymentStatus;
 payment_reference:string;customer_note:string|null;admin_note:string|null;
 paid_at:string|null;reviewed_at:string|null;reviewed_by:number|null;
 bank_name_snapshot:string|null;bank_account_snapshot:string|null;bank_owner_snapshot:string|null;
 appointment_status:string;staff_id:number|null;service_name:string;pet_name:string;customer_name:string;
};
const router=Router();
router.use(requireAuth,requireOrganization);
const bankChangeLimit=rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:'draft-7',legacyHeaders:false,
 message:{message:'Quá nhiều lần thay đổi thông tin ngân hàng. Vui lòng thử lại sau.'}});
const select=`SELECT p.*,a.status AS appointment_status,a.staff_id AS staff_id,COALESCE(bundle.names,s.name) AS service_name,
 pet.name AS pet_name,u.full_name AS customer_name
 FROM payments p
 JOIN appointments a ON a.id=p.appointment_id
 JOIN services s ON s.id=a.service_id
 JOIN pets pet ON pet.id=a.pet_id
 JOIN users u ON u.id=p.customer_id
 LEFT JOIN LATERAL(
  SELECT string_agg(COALESCE(aps.name_snapshot,svc.name),' + ' ORDER BY aps.position) AS names
  FROM appointment_services aps JOIN services svc ON svc.id=aps.service_id
  WHERE aps.appointment_id=a.id
 ) bundle ON TRUE`;
async function loadPayment(id:number,org:number,db:DB){
 const [payment]=await rows<PaymentRow>(`${select} WHERE p.appointment_id=? AND p.organization_id=?`,[id,org],db);
 if(!payment)throw new HttpError(404,'Không tìm thấy thông tin thanh toán cho lịch hẹn');
 return payment;
}
function allowed(p:PaymentRow,user:{id:number;role:string}){
 if(user.role==='admin')return;
 if(user.role==='customer'&&p.customer_id===user.id)return;
 if(user.role==='staff'&&p.staff_id===user.id&&['confirmed','in_progress','completed'].includes(p.appointment_status))return;
 throw new HttpError(403,'Bạn không có quyền xem thanh toán này');
}
router.get('/config',asyncRoute(async(req,res)=>{
 const bank=await getActiveBank(orgId(req));
 res.setHeader('Cache-Control','no-store');
 res.json({methods:['cash',...(bank?['bank_transfer']:[])],bank,provider:'manual',automatic_confirmation:false});
}));
router.get('/admin-bank',requireRole('admin'),asyncRoute(async(req,res)=>{
 const settings=await getBankSettings(orgId(req));
 res.setHeader('Cache-Control','no-store');
 res.json({settings});
}));
router.put('/admin-bank',requireRole('admin'),bankChangeLimit,asyncRoute(async(req,res)=>{
 const data=parse(z.object({
  name:z.string().trim().min(2).max(80),
  account:z.string().trim().regex(/^[0-9]{6,32}$/,'Số tài khoản phải gồm 6 đến 32 chữ số'),
  owner:z.string().trim().min(2).max(100),
  enabled:z.boolean(),
  admin_password:z.string().min(1).max(100)
 }).strict(),req.body);
 const [adminAccount]=await rows<{password_hash:string}>('SELECT password_hash FROM users WHERE id=? AND role=? AND is_active=TRUE',[req.user!.id,'admin']);
 if(!adminAccount||!await bcrypt.compare(data.admin_password,adminAccount.password_hash))
  throw new HttpError(403,'Mật khẩu Admin không chính xác');
 await transaction(async db=>{
  await exec(`INSERT INTO payment_bank_settings(organization_id,bank_name,bank_account,bank_owner,enabled,updated_by,updated_at)
  VALUES(?,?,?,?,?,?,now()) ON CONFLICT(organization_id) DO UPDATE SET
  bank_name=EXCLUDED.bank_name,bank_account=EXCLUDED.bank_account,
  bank_owner=EXCLUDED.bank_owner,enabled=EXCLUDED.enabled,
  updated_by=EXCLUDED.updated_by,updated_at=now()`,[orgId(req),data.name,data.account,data.owner,data.enabled,req.user!.id],db);
  await exec('INSERT INTO role_audit_logs(actor_id,organization_id,action,details) VALUES(?,?,?,?::jsonb)',[
   req.user!.id,orgId(req),'payment_bank.update',
   JSON.stringify({bank_name:data.name,bank_account_last4:data.account.slice(-4),enabled:data.enabled})
  ],db);
 });
 res.json({message:'Đã lưu thông tin tài khoản nhận chuyển khoản'});
}));
router.get('/',requireRole('customer','admin'),asyncRoute(async(req,res)=>{
 // Customer and Admin have paginated ledgers; Staff sees only status on assigned booking details.
 const {page,limit}=pageParams(req);
 const scopeParams:(string|number)[]=[orgId(req)];
 let scope='p.organization_id=?';
 if(req.user!.role==='customer'){
  scope+=' AND p.customer_id=?';
  scopeParams.push(req.user!.id);
 }
 const params=[...scopeParams];
 let where=scope;
 if(req.query.status&&String(req.query.status)!=='all'){
  const status=z.enum(['unpaid','awaiting_payment','pending_review','paid','refund_required','refunded','void']).safeParse(req.query.status);
  if(!status.success)throw new HttpError(422,'Trạng thái thanh toán không hợp lệ');
  where+=' AND p.status=?';
  params.push(status.data);
 }
 const search=String(req.query.search||'').trim().slice(0,80);
 if(search){
  where+=' AND (p.payment_reference ILIKE ? OR pet.name ILIKE ? OR s.name ILIKE ?)';
  const pattern='%'+search+'%';
  params.push(pattern,pattern,pattern);
 }
 const fromTable=`FROM payments p JOIN appointments a ON a.id=p.appointment_id
  JOIN services s ON s.id=a.service_id
  JOIN pets pet ON pet.id=a.pet_id`;
 const [count]=await rows<{total:number}>(`SELECT COUNT(*)::int AS total ${fromTable} WHERE ${where}`,params);
 const items=await rows<PaymentRow>(`${select} WHERE ${where}
  ORDER BY p.created_at DESC,p.id DESC LIMIT ? OFFSET ?`,[...params,limit,(page-1)*limit]);
 // Summary covers the authorized ledger, not just the selected page or filter.
 const [summary]=await rows<{total:number;unpaid:number;awaiting_payment:number;pending_review:number;paid:number;refund_required:number;refunded:number;paid_amount:string}>(`
  SELECT COUNT(*)::int AS total,
  COUNT(*) FILTER (WHERE p.status='unpaid')::int AS unpaid,
  COUNT(*) FILTER (WHERE p.status='awaiting_payment')::int AS awaiting_payment,
  COUNT(*) FILTER (WHERE p.status='pending_review')::int AS pending_review,
  COUNT(*) FILTER (WHERE p.status='paid')::int AS paid,
  COUNT(*) FILTER (WHERE p.status='refund_required')::int AS refund_required,
  COUNT(*) FILTER (WHERE p.status='refunded')::int AS refunded,
  COALESCE(SUM(p.amount) FILTER (WHERE p.status='paid'),0)::text AS paid_amount
  FROM payments p JOIN appointments a ON a.id=p.appointment_id WHERE ${scope}`,scopeParams);
 res.setHeader('Cache-Control','no-store');
 const publicItems=req.user!.role==='customer'
  ?items.map(p=>({...p,admin_note:null,bank_transaction_reference:undefined}))
  :items;
 res.json({items:publicItems,total:count.total,page,limit,summary});
}));
router.get('/:id',asyncRoute(async(req,res)=>{
 const p=await loadPayment(idParam(req.params.id),orgId(req),pool);
 allowed(p,req.user!);
 res.setHeader('Cache-Control','no-store');
 // Internal reconciliation notes are visible to Admin only.
 res.json({payment:req.user!.role==='admin'?p:{...p,admin_note:null,bank_transaction_reference:undefined}});
}));
router.patch('/:id/method',asyncRoute(async(req,res)=>{
 if(req.user!.role!=='customer')throw new HttpError(403,'Chỉ khách hàng chọn phương thức thanh toán');
 const method=parse(z.object({method:z.enum(['cash','bank_transfer'])}).strict(),req.body).method;
 const recipient=method==='bank_transfer'?await getActiveBank(orgId(req)):null;
 if(method==='bank_transfer'&&!recipient)throw new HttpError(409,'Cửa hàng chưa cấu hình thông tin chuyển khoản');
 const id=idParam(req.params.id);
 await transaction(async db=>{
  // Lock the booking before its payment, matching cancellation/reconciliation lock order.
  const [booking]=await rows<{id:number}>('SELECT id FROM appointments WHERE id=? AND organization_id=? FOR UPDATE',[id,orgId(req)],db);
  if(!booking)throw new HttpError(404,'Không tìm thấy lịch hẹn');
  const [locked]=await rows<PaymentRow>(`SELECT p.*,a.status AS appointment_status
   FROM payments p JOIN appointments a ON a.id=p.appointment_id
   WHERE p.appointment_id=? AND p.organization_id=? FOR UPDATE OF p,a`,[id,orgId(req)],db);
  if(!locked)throw new HttpError(404,'Không tìm thấy thanh toán');
  if(locked.customer_id!==req.user!.id)throw new HttpError(403,'Không có quyền chỉnh sửa thanh toán này');
  if(!['unpaid','awaiting_payment'].includes(locked.status)||locked.appointment_status==='cancelled')throw new HttpError(409,'Không thể đổi phương thức cho thanh toán đã xử lý');
  await exec('UPDATE payments SET method=?,status=?,customer_note=NULL,bank_name_snapshot=?,bank_account_snapshot=?,bank_owner_snapshot=? WHERE id=?',[
   method,method==='bank_transfer'?'awaiting_payment':'unpaid',recipient?.name??null,recipient?.account??null,recipient?.owner??null,locked.id
  ],db);
 });
 res.json({message:'Đã cập nhật phương thức thanh toán'});
}));
router.post('/:id/transfer-notice',asyncRoute(async(req,res)=>{
 if(req.user!.role!=='customer')throw new HttpError(403,'Chỉ khách hàng được gửi xác nhận chuyển khoản');
 // An existing bank transfer retains its original payee snapshot even when Admin changes the account.
 const {note}=parse(z.object({note:z.string().trim().max(300).optional()}).strict(),req.body);
 const id=idParam(req.params.id);
 await transaction(async db=>{
  // Serialize transfer notices with cancellations and Admin reconciliation.
  const [booking]=await rows<{id:number}>('SELECT id FROM appointments WHERE id=? AND organization_id=? FOR UPDATE',[id,orgId(req)],db);
  if(!booking)throw new HttpError(404,'Không tìm thấy lịch hẹn');
  const [p]=await rows<PaymentRow>(`SELECT p.*,a.status AS appointment_status
   FROM payments p JOIN appointments a ON a.id=p.appointment_id
   WHERE p.appointment_id=? AND p.organization_id=? FOR UPDATE OF p,a`,[id,orgId(req)],db);
  if(!p)throw new HttpError(404,'Không tìm thấy thanh toán');
  if(p.customer_id!==req.user!.id)throw new HttpError(403,'Không có quyền xác nhận thanh toán này');
  if(p.status!=='awaiting_payment'||p.method!=='bank_transfer'||p.appointment_status==='cancelled')
   throw new HttpError(409,'Chỉ có thể thông báo chuyển khoản cho lịch chưa thanh toán');
  await exec("UPDATE payments SET status='pending_review',customer_note=? WHERE id=?",[note||null,p.id],db);
 });
 res.json({message:'Đã gửi thông báo. Thanh toán đang chờ Admin xác nhận trong bản demo.'});
}));
router.post('/:id/reconcile',requireRole('admin'),asyncRoute(async(req,res)=>{
 const id=idParam(req.params.id);
 const {action,note}=parse(z.object({
  action:z.enum(['confirm_paid','reject_transfer','confirm_refund']),
  note:z.string().trim().max(500).optional()
 }).strict(),req.body);
 await transaction(async db=>{
  // Acquire booking row first, consistently with cancellation and rescheduling.
  // This avoids lock-order inversions while payment and booking are updated together.
  const [bookingLock]=await rows<{id:number}>('SELECT id FROM appointments WHERE id=? AND organization_id=? FOR UPDATE',[id,orgId(req)],db);
  if(!bookingLock)throw new HttpError(404,'Không tìm thấy lịch hẹn');
  const [p]=await rows<PaymentRow>(`SELECT p.*,a.status AS appointment_status,a.staff_id
   FROM payments p JOIN appointments a ON a.id=p.appointment_id
   WHERE p.appointment_id=? AND p.organization_id=? FOR UPDATE OF p,a`,[id,orgId(req)],db);
  if(!p)throw new HttpError(404,'Không tìm thấy thanh toán');
  let status:PaymentStatus=p.status;
  if(action==='confirm_paid'){
   if(p.appointment_status==='cancelled' && p.status!=='pending_review')throw new HttpError(409,'Lịch đã hủy, không thể ghi nhận thanh toán mới');
   if(p.method==='cash' && p.status==='unpaid')status='paid';
   else if(p.method==='bank_transfer'&&p.status==='pending_review')status=p.appointment_status==='cancelled'?'refund_required':'paid';
   else throw new HttpError(409,'Trạng thái hoặc phương thức thanh toán không phù hợp');
  }else if(action==='reject_transfer'){
   if(p.method!=='bank_transfer'||p.status!=='pending_review')throw new HttpError(409,'Chỉ có thể từ chối chuyển khoản đang chờ đối soát');
   if(!note)throw new HttpError(422,'Vui lòng nhập lý do từ chối đối soát');
   status=p.appointment_status==='cancelled'?'void':'awaiting_payment';
  }else{
   if(p.status!=='refund_required')throw new HttpError(409,'Chưa có khoản cần hoàn tiền');
   if(!note)throw new HttpError(422,'Cần ghi lại bằng chứng/ghi chú hoàn tiền');
   status='refunded';
  }
  // Demo workflow: actor confirmation is recorded, but bank receipt is NOT verified.
  const demoBankConfirmation=action==='confirm_paid'&&p.method==='bank_transfer';
  const reviewerNote=demoBankConfirmation
   ?'Xác nhận mô phỏng trong bản demo; PawCare không xác minh giao dịch ngân hàng.'
   :action==='confirm_paid'&&p.method==='cash'?'Đã nhận tiền mặt tại quầy.':note||null;
  await exec("UPDATE payments SET status=?,admin_note=?,reviewed_by=?,reviewed_at=now(),paid_at=CASE WHEN ?='paid' THEN now() ELSE paid_at END WHERE id=?",[
   status,reviewerNote,req.user!.id,status,p.id
  ],db);
  await exec('INSERT INTO role_audit_logs(actor_id,organization_id,action,details) VALUES(?,?,?,?::jsonb)',[
   req.user!.id,orgId(req),'payment.'+action,
   JSON.stringify({appointment_id:id,payment_id:p.id,from:p.status,to:status,method:p.method,amount:p.amount,actor_role:req.user!.role,demo_confirmation:demoBankConfirmation,bank_verified:false})
  ],db);
 });
 res.json({message:action==='confirm_paid'?'Đã xác nhận thanh toán trong bản demo':action==='reject_transfer'?'Đã từ chối đối soát và hoàn về trạng thái chờ thanh toán':'Đã ghi nhận hoàn tiền'});
}));
export default router;
