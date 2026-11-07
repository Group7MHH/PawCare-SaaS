import {Router} from 'express';
import {randomBytes} from 'node:crypto';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import {z} from 'zod';
import {rows,exec,transaction,type DB} from '../lib/db.js';
import {asyncRoute,HttpError,idParam,pageParams,parse} from '../lib/http.js';
import {requireAuth,requireRole,orgId} from '../lib/auth.js';

const router=Router();
router.use(requireAuth,requireRole('admin'));

/** Account administration is restricted to the single-store Admin.
 * The old password is never available: only one-time, newly generated
 * credentials are shown to an authenticated Admin after re-authentication.
 */
const sensitiveLimit=rateLimit({
 windowMs:15*60*1000,
 limit:10,
 standardHeaders:'draft-7',
 legacyHeaders:false,
 message:{message:'Quá nhiều yêu cầu nhạy cảm. Vui lòng thử lại sau.'}
});
const adminProof=z.object({admin_password:z.string().min(1).max(100)});
const accountEdit=adminProof.extend({
 full_name:z.string().trim().min(2).max(120),
 email:z.string().trim().email().max(190).transform(value=>value.toLowerCase()),
 phone:z.string().trim().max(25).nullable(),
 address:z.string().trim().max(255).nullable()
});
type AccountRow={id:number;full_name:string;email:string;phone:string|null;address:string|null;role:'admin'|'staff'|'customer';is_active:boolean;created_at:string};

async function confirmAdmin(id:number,password:string){
 const [admin]=await rows<{password_hash:string;is_active:boolean;role:string}>('SELECT password_hash,is_active,role FROM users WHERE id=?',[id]);
 if(!admin||!admin.is_active||admin.role!=='admin'||!await bcrypt.compare(password,admin.password_hash)){
  throw new HttpError(403,'Mật khẩu quản trị viên không đúng');
 }
}

router.get('/accounts',asyncRoute(async(req,res)=>{
 const {page,limit}=pageParams(req);
 const search=String(req.query.search||'').trim().slice(0,90);
 const q='%'+search.replace(/[\\%_]/g,'\\$&')+'%';
 const filter="WHERE (full_name ILIKE ? ESCAPE '\\' OR email ILIKE ? ESCAPE '\\')";
 const [count]=await rows<{total:number}>(`SELECT COUNT(*) AS total FROM users ${filter}`,[q,q]);
 const items=await rows<AccountRow>(`SELECT id,full_name,email,phone,address,role,is_active,created_at FROM users ${filter} ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?`,[q,q,limit,(page-1)*limit]);
 res.setHeader('Cache-Control','no-store');
 res.json({items,total:Number(count.total),page,limit});
}));


/** Preview all database rows affected by permanently deleting one account. */
type DeletionImpact={
 pets:number;appointments:number;active_appointments:number;
 completed_appointments:number;completed_revenue:number;care_records:number
};
async function deletionImpact(target:number,db?:DB):Promise<DeletionImpact>{
 const [petRows,appointmentRows,recordRows]=await Promise.all([
  rows<{count:number}>('SELECT COUNT(*)::int AS count FROM pets WHERE owner_id=?',[target],db),
  rows<{appointments:number;active_appointments:number;completed_appointments:number;completed_revenue:number}>(`
   SELECT COUNT(*)::int AS appointments,
   COUNT(*) FILTER (WHERE status IN ('pending','confirmed','in_progress'))::int AS active_appointments,
   COUNT(*) FILTER (WHERE status='completed')::int AS completed_appointments,
   COALESCE(SUM(price_snapshot) FILTER (WHERE status='completed'),0) AS completed_revenue
   FROM appointments WHERE customer_id=? OR staff_id=?
   OR pet_id IN (SELECT id FROM pets WHERE owner_id=?)`,[target,target,target],db),
  rows<{count:number}>(`
   SELECT COUNT(*)::int AS count FROM care_records
   WHERE created_by_user_id=? OR pet_id IN (SELECT id FROM pets WHERE owner_id=?)
   OR appointment_id IN (SELECT id FROM appointments
    WHERE customer_id=? OR staff_id=? OR pet_id IN (SELECT id FROM pets WHERE owner_id=?))`,
   [target,target,target,target,target],db)
 ]);
 return {pets:petRows[0].count,...appointmentRows[0],care_records:recordRows[0].count};
}
const deleteConfirmation=adminProof.extend({
 confirmation_email:z.string().trim().email().max(190).transform(value=>value.toLowerCase()),
 expected_pets:z.number().int().nonnegative(),
 expected_appointments:z.number().int().nonnegative(),
 expected_care_records:z.number().int().nonnegative()
}).strict();

router.get('/accounts/:id/delete-preview',sensitiveLimit,asyncRoute(async(req,res)=>{
 const target=idParam(req.params.id);
 if(target===req.user!.id)throw new HttpError(403,'Không thể xóa tài khoản Admin đang đăng nhập');
 const [account]=await rows<{id:number;full_name:string;email:string;role:string}>(
  'SELECT id,full_name,email,role FROM users WHERE id=?',[target]);
 if(!account)throw new HttpError(404,'Không tìm thấy tài khoản');
 if(account.role==='admin')throw new HttpError(403,'Không được xóa tài khoản Admin khác');
 const impact=await deletionImpact(target);
 res.setHeader('Cache-Control','no-store');
 res.json({...account,...impact});
}));

/** Hard delete all records attached to Customer/Staff in one PostgreSQL transaction.
 * This also permanently removes appointments assigned to the deleted Staff,
 * even when the customers of those appointments still exist.
 */
router.delete('/accounts/:id',sensitiveLimit,asyncRoute(async(req,res)=>{
 const target=idParam(req.params.id),data=parse(deleteConfirmation,req.body);
 if(target===req.user!.id)throw new HttpError(403,'Không thể tự xóa tài khoản Admin');
 await confirmAdmin(req.user!.id,data.admin_password);
 await transaction(async db=>{
  // Serialize with booking operations to prevent new related appointments
  // during the preview verification and cascade.
  await db.query('SELECT pg_advisory_xact_lock($1,$2)',[42371,0]);
  const [account]=await rows<{id:number;email:string;role:string}>(
   'SELECT id,email,role FROM users WHERE id=? FOR UPDATE',[target],db);
  if(!account)throw new HttpError(404,'Không tìm thấy tài khoản');
  if(account.role==='admin')throw new HttpError(403,'Không được xóa tài khoản Admin');
  if(data.confirmation_email!==account.email)throw new HttpError(400,'Email xác nhận không khớp với tài khoản');
  const impact=await deletionImpact(target,db);
  if(data.expected_pets!==impact.pets ||
     data.expected_appointments!==impact.appointments ||
     data.expected_care_records!==impact.care_records){
   throw new HttpError(409,'Dữ liệu tài khoản đã thay đổi. Hãy xem lại danh sách dữ liệu sẽ bị xóa');
  }
  // care_records reference both pets and appointments without ON DELETE CASCADE.
  // Remove those plus records authored by the deleted user before appointments.
  await exec(`DELETE FROM care_records
   WHERE created_by_user_id=? OR pet_id IN (SELECT id FROM pets WHERE owner_id=?)
   OR appointment_id IN (SELECT id FROM appointments WHERE customer_id=? OR staff_id=?
    OR pet_id IN (SELECT id FROM pets WHERE owner_id=?))`,
   [target,target,target,target,target],db);
  // appointment_services and appointment_staff_declines cascade from appointments.
  await exec(`DELETE FROM appointments WHERE customer_id=? OR staff_id=?
   OR pet_id IN (SELECT id FROM pets WHERE owner_id=?)`,[target,target,target],db);
  await exec('DELETE FROM pets WHERE owner_id=?',[target],db);
  // Legacy invitations and audit entries hold restrictive user foreign keys.
  await exec('DELETE FROM invitations WHERE created_by=?',[target],db);
  await exec('DELETE FROM role_audit_logs WHERE actor_id=? OR target_user_id=?',[target,target],db);
  const removed=await exec('DELETE FROM users WHERE id=?',[target],db);
  if(removed.affectedRows!==1)throw new HttpError(409,'Không thể xóa tài khoản');
  // Sessions, staff profiles, memberships and standalone staff declines cascade.
  // Log the action without retaining a foreign key or PII for the erased account.
  await exec('INSERT INTO role_audit_logs(actor_id,organization_id,target_user_id,action,details) VALUES(?,?,NULL,?,?::jsonb)',[
   req.user!.id,orgId(req),'account.permanently_deleted',
   JSON.stringify({role:account.role,pets_removed:impact.pets,appointments_removed:impact.appointments,
    care_records_removed:impact.care_records,completed_revenue_removed:impact.completed_revenue})
  ],db);
 });
 res.setHeader('Cache-Control','no-store');
 res.json({message:'Đã xóa vĩnh viễn tài khoản và toàn bộ dữ liệu liên quan'});
}));

router.patch('/accounts/:id',sensitiveLimit,asyncRoute(async(req,res)=>{
 const target=idParam(req.params.id),data=parse(accountEdit,req.body);
 if(target===req.user!.id)throw new HttpError(403,'Vui lòng cập nhật hồ sơ của bạn trong Thông tin cá nhân');
 await confirmAdmin(req.user!.id,data.admin_password);
 await transaction(async db=>{
  const [account]=await rows<{id:number;role:string;email:string}>('SELECT id,role,email FROM users WHERE id=? FOR UPDATE',[target],db);
  if(!account)throw new HttpError(404,'Không tìm thấy tài khoản');
  if(account.role==='admin')throw new HttpError(403,'Không được thay đổi thông tin tài khoản quản trị viên khác');
  await exec('UPDATE users SET full_name=?,email=?,phone=?,address=? WHERE id=?',[data.full_name,data.email,data.phone||null,data.address||null,target],db);
  // Invalidate every prior session so changes to the login email take effect.
  await exec('DELETE FROM sessions WHERE user_id=?',[target],db);
  await exec('INSERT INTO role_audit_logs(actor_id,organization_id,target_user_id,action,details) VALUES(?,?,?,?,?::jsonb)',[
   req.user!.id,orgId(req),target,'account.profile.updated',
   JSON.stringify({email_changed:account.email!==data.email})
  ],db);
 });
 res.setHeader('Cache-Control','no-store');
 res.json({message:'Đã cập nhật tài khoản. Các phiên đăng nhập cũ đã được thu hồi.'});
}));


/** Admin grants/revokes Staff directly on an existing account.
 * Keep the membership row when downgrading: historical appointments have an
 * (organization_id,staff_id) foreign key to organization_members.
 */
router.patch('/accounts/:id/role',sensitiveLimit,asyncRoute(async(req,res)=>{
 const target=idParam(req.params.id);
 const data=parse(adminProof.extend({role:z.enum(['staff','customer'])}).strict(),req.body);
 if(target===req.user!.id)throw new HttpError(403,'Không thể tự thay đổi quyền của mình');
 await confirmAdmin(req.user!.id,data.admin_password);
 const organization=orgId(req);
 await transaction(async db=>{
  const [account]=await rows<{id:number;role:string;is_active:boolean}>(
   'SELECT id,role,is_active FROM users WHERE id=? FOR UPDATE',[target],db
  );
  if(!account)throw new HttpError(404,'Không tìm thấy tài khoản');
  if(account.role==='admin')throw new HttpError(403,'Không được thay đổi quyền Admin');
  if(account.role===data.role)throw new HttpError(409,'Tài khoản đã có quyền này');
  if(!account.is_active)throw new HttpError(409,'Tài khoản đang bị khóa. Vui lòng mở khóa trước khi cấp quyền');

  if(data.role==='customer'){
   // Do not strand ongoing bookings without an authorized staff member.
   const [busy]=await rows<{total:number}>(`SELECT COUNT(*)::int AS total
    FROM appointments WHERE staff_id=? AND status IN ('pending','confirmed','in_progress')`,[target],db);
   if(busy.total>0)throw new HttpError(409,'Nhân viên còn lịch chưa hoàn thành. Hãy phân công lại hoặc hoàn tất trước khi thu hồi quyền');
   // Leave membership for historical appointment FK, mark it unavailable for booking.
   await exec("UPDATE organization_members SET is_active=FALSE WHERE organization_id=? AND user_id=? AND role='staff'",
    [organization,target],db);
  }else{
   await exec(`INSERT INTO organization_members(organization_id,user_id,role,is_active)
    VALUES(?,?,'staff',TRUE)
    ON CONFLICT(organization_id,user_id) DO UPDATE SET role='staff',is_active=TRUE`,
    [organization,target],db);
   await exec('INSERT INTO staff_profiles(user_id) VALUES(?) ON CONFLICT(user_id) DO NOTHING',[target],db);
   await exec(`INSERT INTO organization_staff_profiles(organization_id,user_id)
    VALUES(?,?) ON CONFLICT(organization_id,user_id) DO NOTHING`,[organization,target],db);
  }
  await exec('UPDATE users SET role=? WHERE id=?',[data.role,target],db);
  await exec('DELETE FROM sessions WHERE user_id=?',[target],db);
  await exec(`INSERT INTO role_audit_logs(actor_id,organization_id,target_user_id,action,details)
    VALUES(?,?,?,?,?::jsonb)`,[
     req.user!.id,organization,target,'account.role.changed',
     JSON.stringify({from:account.role,to:data.role,sessions_revoked:true})
    ],db);
 });
 res.setHeader('Cache-Control','no-store');
 res.json({message:data.role==='staff'?
  'Đã cấp quyền Staff. Nhân viên đăng nhập lại để sử dụng quyền mới.':
  'Đã thu hồi quyền Staff. Tài khoản trở về Customer và cần đăng nhập lại.'});
}));

router.post('/accounts/:id/reset-password',sensitiveLimit,asyncRoute(async(req,res)=>{
 const target=idParam(req.params.id),data=parse(adminProof,req.body);
 if(target===req.user!.id)throw new HttpError(403,'Vui lòng tự đổi mật khẩu trong Thông tin cá nhân');
 await confirmAdmin(req.user!.id,data.admin_password);
 const temporaryPassword=randomBytes(18).toString('base64url'); // 24 high-entropy chars
 const hashed=await bcrypt.hash(temporaryPassword,12);
 await transaction(async db=>{
  const [account]=await rows<{id:number;role:string}>('SELECT id,role FROM users WHERE id=? FOR UPDATE',[target],db);
  if(!account)throw new HttpError(404,'Không tìm thấy tài khoản');
  if(account.role==='admin')throw new HttpError(403,'Không được đặt lại mật khẩu của quản trị viên khác');
  await exec('UPDATE users SET password_hash=? WHERE id=?',[hashed,target],db);
  await exec('DELETE FROM sessions WHERE user_id=?',[target],db);
  await exec('INSERT INTO role_audit_logs(actor_id,organization_id,target_user_id,action,details) VALUES(?,?,?,?,?::jsonb)',[
   req.user!.id,orgId(req),target,'account.password.reset',JSON.stringify({sessions_revoked:true})
  ],db);
 });
 res.setHeader('Cache-Control','no-store');
 res.setHeader('Pragma','no-cache');
 res.json({message:'Đã cấp mật khẩu mới và đăng xuất mọi phiên cũ',temporary_password:temporaryPassword});
}));

export default router;
