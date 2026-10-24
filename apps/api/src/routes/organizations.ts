import {Router} from 'express';
import {randomBytes} from 'node:crypto';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import {z} from 'zod';
import {rows,exec,transaction} from '../lib/db.js';
import {asyncRoute,HttpError,idParam,parse} from '../lib/http.js';
import {hashToken,orgId,requireAuth,requireOrganization,requireRole} from '../lib/auth.js';
const router=Router();router.use(requireAuth);
const emailSchema=z.string().email().max(190).transform(v=>v.toLowerCase().trim());
async function canManage(req:import('express').Request,id:number):Promise<'owner'|'admin'> {
 if(req.user?.role==='owner')return 'owner';
 if(req.user?.role==='admin'&&req.user.organization_id===id)return 'admin';
 throw new HttpError(403,'Không có quyền quản trị cửa hàng này');
}
router.get('/organizations',asyncRoute(async(req,res)=>{
 const u=req.user!;
 const items=await rows<any>(u.role==='owner'
  ?'SELECT id,name,slug,is_active FROM organizations ORDER BY id DESC'
  : u.role==='customer'
   ?'SELECT id,name,slug,is_active FROM organizations WHERE is_active=TRUE ORDER BY name'
   :`SELECT o.id,o.name,o.slug,o.is_active FROM organizations o JOIN organization_members m ON m.organization_id=o.id
     WHERE m.user_id=? AND m.is_active=TRUE AND o.is_active=TRUE ORDER BY o.name`,u.role==='customer'||u.role==='owner'?[]:[u.id]);
 res.json({items});
}));
router.post('/owner/organizations',requireRole('owner'),asyncRoute(async(req,res)=>{
 const d=parse(z.object({name:z.string().trim().min(2).max(160),slug:z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100)}),req.body);
 const r=await transaction(async db=>{
  const store=await exec('INSERT INTO organizations(name,slug) VALUES(?,?)',[d.name,d.slug],db);
  const templates:[string,string,string,number,number][]=[['Tắm & sấy cơ bản','Spa','Làm sạch, chải lông và sấy khô',60,180000],['Cắt tỉa lông','Spa','Cắt tỉa tạo kiểu',90,250000],['Vệ sinh tai & móng','Chăm sóc','Vệ sinh tai, cắt móng',30,90000]];
  for(const [name,category,description,duration,price] of templates)await exec('INSERT INTO services(organization_id,name,category,description,duration_minutes,price) VALUES(?,?,?,?,?,?)',[store.insertId,name,category,description,duration,price],db);
  return store;
 });
 await exec('INSERT INTO role_audit_logs(actor_id,organization_id,action,details) VALUES(?,?,?,?::jsonb)',[req.user!.id,r.insertId,'organization.create',JSON.stringify({name:d.name})]);
 res.status(201).json({id:r.insertId});
}));

// Additional platform Owners can only be created by an authenticated Owner
// who re-enters their own password. This is not available to store Admins.
router.post('/owner/owners',rateLimit({windowMs:15*60*1000,limit:5,standardHeaders:'draft-7',legacyHeaders:false}),requireRole('owner'),asyncRoute(async(req,res)=>{
 const d=parse(z.object({email:emailSchema,current_password:z.string().min(1)}),req.body);
 const [actor]=await rows<any>('SELECT password_hash FROM users WHERE id=?',[req.user!.id]);
 if(!await bcrypt.compare(d.current_password,actor.password_hash))throw new HttpError(403,'Mật khẩu Owner hiện tại không đúng');
 const [target]=await rows<any>('SELECT id,role FROM users WHERE email=? AND is_active=TRUE',[d.email]);
 if(!target)throw new HttpError(404,'Email chưa đăng ký hoặc đã bị khóa');
 if(target.role==='owner')throw new HttpError(409,'Tài khoản đã là Owner');
 await transaction(async db=>{
  await exec("UPDATE users SET role='owner' WHERE id=?",[target.id],db);
  await exec('INSERT INTO role_audit_logs(actor_id,target_user_id,action,details) VALUES(?,?,?,?::jsonb)',[req.user!.id,target.id,'owner.promote',JSON.stringify({email:d.email})],db);
 });
 res.json({message:'Đã trao quyền Owner nền tảng'});
}));
router.patch('/owner/organizations/:id',requireRole('owner'),asyncRoute(async(req,res)=>{
 const id=idParam(req.params.id),d=parse(z.object({name:z.string().trim().min(2).max(160).optional(),is_active:z.boolean().optional()}),req.body);
 if(!Object.keys(d).length)throw new HttpError(422,'Thiếu dữ liệu');
 const changes=Object.keys(d);const r=await exec(`UPDATE organizations SET ${changes.map(k=>`${k}=?`).join(',')} WHERE id=?`,[...changes.map(k=>(d as any)[k]),id]);
 if(!r.affectedRows)throw new HttpError(404,'Không tìm thấy cửa hàng');
 await exec('INSERT INTO role_audit_logs(actor_id,organization_id,action,details) VALUES(?,?,?,?::jsonb)',[req.user!.id,id,'organization.update',JSON.stringify(d)]);
 res.json({message:'Đã cập nhật cửa hàng'});
}));
router.get('/organizations/:id/members',asyncRoute(async(req,res)=>{
 const id=idParam(req.params.id);await canManage(req,id);
 const items=await rows<any>(`SELECT m.user_id,u.full_name,u.email,u.phone,m.role,m.is_active,m.created_at
  FROM organization_members m JOIN users u ON u.id=m.user_id WHERE m.organization_id=? ORDER BY m.role,u.full_name`,[id]);
 res.json({items});
}));
router.patch('/organizations/:id/members/:userId',asyncRoute(async(req,res)=>{
 const id=idParam(req.params.id),target=idParam(req.params.userId),actor=await canManage(req,id);
 const d=parse(z.object({role:z.enum(['admin','staff']).optional(),is_active:z.boolean().optional()}),req.body);
 if(!Object.keys(d).length)throw new HttpError(422,'Thiếu thay đổi');
 await transaction(async db=>{
  const [prior]=await rows<any>('SELECT role,is_active FROM organization_members WHERE organization_id=? AND user_id=? FOR UPDATE',[id,target],db);
  if(!prior)throw new HttpError(404,'Không tìm thấy thành viên');
  if(actor==='admin'&&(prior.role!=='staff'||(d.role&&d.role!=='staff')))throw new HttpError(403,'Admin chỉ được quản lý Staff');
  const fields=Object.keys(d);
  await exec(`UPDATE organization_members SET ${fields.map(k=>`${k}=?`).join(',')} WHERE organization_id=? AND user_id=?`,[...fields.map(k=>(d as any)[k]),id,target],db);
  await exec('INSERT INTO role_audit_logs(actor_id,organization_id,target_user_id,action,details) VALUES(?,?,?,?,?::jsonb)',[req.user!.id,id,target,'member.update',JSON.stringify({previous:prior,changes:d})],db);
 });
 res.json({message:'Đã cập nhật quyền thành viên'});
}));
router.post('/organizations/:id/invitations',asyncRoute(async(req,res)=>{
 const id=idParam(req.params.id),actor=await canManage(req,id);
 const d=parse(z.object({email:emailSchema,role:z.enum(['admin','staff'])}),req.body);
 if(actor==='admin'&&d.role!=='staff')throw new HttpError(403,'Admin chỉ có thể mời Staff');
 const [org]=await rows<any>('SELECT id FROM organizations WHERE id=? AND is_active=TRUE',[id]);if(!org)throw new HttpError(404,'Cửa hàng không hoạt động');
 const token=randomBytes(32).toString('hex');
 await exec(`INSERT INTO invitations(organization_id,email,role,token_hash,created_by,expires_at)
  VALUES(?,?,?,?,?,now()+interval '7 days')`,[id,d.email,d.role,hashToken(token),req.user!.id]);
 await exec('INSERT INTO role_audit_logs(actor_id,organization_id,action,details) VALUES(?,?,?,?::jsonb)',[req.user!.id,id,'invitation.create',JSON.stringify({email:d.email,role:d.role})]);
 // Manual copy/share until an email provider is connected. Token is only returned once.
 const origin=process.env.APP_ORIGIN|| (process.env.RAILWAY_PUBLIC_DOMAIN?`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`:'http://localhost:5173');
 res.status(201).json({invite_url:`${origin}/invite/${token}`,expires_in_days:7,message:'Đã tạo link mời. Hãy gửi riêng cho người được mời.'});
}));
router.get('/organizations/:id/invitations',asyncRoute(async(req,res)=>{
 const id=idParam(req.params.id);await canManage(req,id);
 const items=await rows<any>(`SELECT id,email,role,expires_at,accepted_at,created_at FROM invitations WHERE organization_id=? ORDER BY id DESC LIMIT 100`,[id]);res.json({items});
}));
export default router;
