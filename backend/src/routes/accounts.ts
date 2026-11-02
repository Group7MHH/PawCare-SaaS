import {Router} from 'express';
import {randomBytes} from 'node:crypto';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import {z} from 'zod';
import {rows,exec,transaction} from '../lib/db.js';
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
const accountId=z.object({id:z.number().int().positive()});
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
