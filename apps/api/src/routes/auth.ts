import {Router} from 'express';
import {z} from 'zod';
import bcrypt from 'bcryptjs';
import {exec,rows,transaction} from '../lib/db.js';
import {asyncRoute,HttpError,parse} from '../lib/http.js';
import {createSession,clearSession,revokeSession,requireAuth,updateSessionOrganization,hashToken,orgId} from '../lib/auth.js';
const router=Router();
const credentials=z.object({email:z.string().email().max(190).transform(v=>v.toLowerCase().trim()),password:z.string().min(8).max(100)});
const registration=credentials.extend({full_name:z.string().trim().min(2).max(120),phone:z.string().max(25).optional()});
async function startingOrganization(userId:number,role:string){
 

 return (await rows<any>('SELECT id FROM organizations WHERE is_active=TRUE ORDER BY id LIMIT 1'))[0]?.id??null;
}
async function currentUser(userId:number,organizationId:number|null){
 const [u]=await rows<any>(`SELECT u.id,u.full_name,u.email,u.phone,u.address,
  u.role AS role,
  o.id AS organization_id,o.name AS organization_name
  FROM users u LEFT JOIN organizations o ON o.id=? AND o.is_active=TRUE
  
  WHERE u.id=? AND u.is_active=TRUE`,[organizationId,userId]);return u;
}
router.post('/register',asyncRoute(async(req,res)=>{
 const d=parse(registration,req.body);
 const hash=await bcrypt.hash(d.password,12);
 const result=await exec('INSERT INTO users(full_name,email,password_hash,phone,role) VALUES(?,?,?,?,?)',[d.full_name,d.email,hash,d.phone||null,'customer']);
 const org=await startingOrganization(result.insertId,'customer');
 await createSession(res,result.insertId,org);
 res.status(201).json({message:'Đăng ký thành công',user:await currentUser(result.insertId,org)});
}));
router.post('/login',asyncRoute(async(req,res)=>{
 const d=parse(credentials,req.body);
 const [u]=await rows<any>('SELECT id,password_hash,is_active,role FROM users WHERE email=? LIMIT 1',[d.email]);
 if(!u||!u.is_active||!(await bcrypt.compare(d.password,u.password_hash)))throw new HttpError(401,'Email hoặc mật khẩu không chính xác');
 const org=await startingOrganization(u.id,u.role);
 await createSession(res,u.id,org);
 res.json({user:await currentUser(u.id,org)});
}));
router.post('/logout',asyncRoute(async(req,res)=>{await revokeSession(req);clearSession(res);res.json({message:'Đã đăng xuất'});}));
router.get('/me',requireAuth,(req,res)=>res.json({user:req.user}));
router.post('/select-organization',requireAuth,asyncRoute(async(_req,_res)=>{throw new HttpError(410,'Ứng dụng chỉ phục vụ một cửa hàng');}));
router.post('/accept-invitation',requireAuth,asyncRoute(async(req,res)=>{
 const d=parse(z.object({token:z.string().regex(/^[a-f0-9]{64}$/)}),req.body);
 let targetOrg:number=0;
 await transaction(async db=>{
  const [invite]=await rows<any>(`SELECT i.* FROM invitations i JOIN organizations o ON o.id=i.organization_id
   WHERE i.token_hash=? AND i.accepted_at IS NULL AND i.expires_at>now() AND o.is_active=TRUE FOR UPDATE OF i`,[hashToken(d.token)],db);
  if(!invite)throw new HttpError(404,'Lời mời đã hết hạn hoặc đã sử dụng');
  if(invite.email!==req.user!.email)throw new HttpError(403,'Lời mời thuộc email khác');
  const [existing]=await rows<any>('SELECT role FROM organization_members WHERE organization_id=? AND user_id=?',[invite.organization_id,req.user!.id],db);
  if(existing&&existing.role!==invite.role)throw new HttpError(409,'Bạn đã có vai trò khác tại cửa hàng; liên hệ Owner');
  await exec(`INSERT INTO organization_members(organization_id,user_id,role,is_active) VALUES(?,?,?,TRUE)
    ON CONFLICT (organization_id,user_id) DO UPDATE SET is_active=TRUE`,[invite.organization_id,req.user!.id,invite.role],db);
  await exec('UPDATE users SET role=? WHERE id=?',[invite.role,req.user!.id],db);
  await exec('UPDATE invitations SET accepted_at=now() WHERE id=?',[invite.id],db);
  await exec('INSERT INTO role_audit_logs(actor_id,organization_id,target_user_id,action,details) VALUES(?,?,?,?,?::jsonb)',[req.user!.id,invite.organization_id,req.user!.id,'invitation.accept',JSON.stringify({role:invite.role})],db);
  targetOrg=invite.organization_id;
 });
 await updateSessionOrganization(req,targetOrg);
 res.json({message:'Đã tham gia cửa hàng',user:await currentUser(req.user!.id,targetOrg)});
}));
router.patch('/profile',requireAuth,asyncRoute(async(req,res)=>{
 const d=parse(z.object({full_name:z.string().trim().min(2).max(120),phone:z.string().max(25).nullable().optional(),address:z.string().max(255).nullable().optional()}),req.body);
 await exec('UPDATE users SET full_name=?,phone=?,address=? WHERE id=?',[d.full_name,d.phone??null,d.address??null,req.user!.id]);
 res.json({user:await currentUser(req.user!.id,req.user!.organization_id)});
}));
router.patch('/password',requireAuth,asyncRoute(async(req,res)=>{
 const d=parse(z.object({current_password:z.string(),new_password:z.string().min(8).max(100)}),req.body);
 const [u]=await rows<any>('SELECT password_hash FROM users WHERE id=?',[req.user!.id]);
 if(!await bcrypt.compare(d.current_password,u.password_hash))throw new HttpError(400,'Mật khẩu hiện tại không đúng');
 await exec('UPDATE users SET password_hash=? WHERE id=?',[await bcrypt.hash(d.new_password,12),req.user!.id]);
 await exec('DELETE FROM sessions WHERE user_id=?',[req.user!.id]);clearSession(res);res.json({message:'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.'});
}));
export default router;
