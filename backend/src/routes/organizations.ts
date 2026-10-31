import {Router} from 'express';
import {randomBytes} from 'node:crypto';
import {z} from 'zod';
import {rows,exec,transaction} from '../lib/db.js';
import {asyncRoute,HttpError,idParam,parse} from '../lib/http.js';
import {hashToken,orgId,requireAuth,requireRole} from '../lib/auth.js';
const router=Router();
router.use(requireAuth);
const email=z.string().email().max(190).transform(v=>v.trim().toLowerCase());
const checkStore=(req:import('express').Request,id:number)=>{if(id!==orgId(req))throw new HttpError(404,'Không tìm thấy cửa hàng');};
router.get('/organizations',asyncRoute(async(req,res)=>{
 const items=await rows('SELECT id,name,slug,is_active FROM organizations WHERE id=?',[orgId(req)]);
 res.json({items});
}));
router.get('/organizations/:id/members',requireRole('admin'),asyncRoute(async(req,res)=>{
 checkStore(req,idParam(req.params.id));
 const items=await rows("SELECT u.id AS user_id,u.full_name,u.email,u.phone,u.role,u.is_active FROM users u WHERE u.role IN ('staff','admin') ORDER BY u.role,u.full_name");
 res.json({items});
}));
router.patch('/organizations/:id/members/:userId',requireRole('admin'),asyncRoute(async(req,res)=>{
 checkStore(req,idParam(req.params.id));
 const target=idParam(req.params.userId),changes=parse(z.object({is_active:z.boolean()}),req.body);
 await transaction(async db=>{
  const [staff]=await rows<any>("SELECT id,role,is_active FROM users WHERE id=? AND role='staff' FOR UPDATE",[target],db);
  if(!staff)throw new HttpError(403,'Admin chỉ có thể khóa hoặc mở khóa Staff');
  if(changes.is_active===false){
   const [busy]=await rows<any>("SELECT COUNT(*) AS count FROM appointments WHERE staff_id=? AND status IN ('pending','confirmed','in_progress')",[target],db);
   if(Number(busy.count)>0)throw new HttpError(409,'Hãy phân công lại hoặc hoàn tất các lịch của nhân viên trước khi khóa');
  }
  await exec('UPDATE users SET is_active=? WHERE id=?',[changes.is_active,target],db);
  await exec('UPDATE organization_members SET is_active=? WHERE organization_id=? AND user_id=?',[changes.is_active,orgId(req),target],db);
  await exec('INSERT INTO role_audit_logs(actor_id,organization_id,target_user_id,action,details) VALUES(?,?,?,?,?::jsonb)',[req.user!.id,orgId(req),target,'staff.status',JSON.stringify(changes)],db);
 });
 res.json({message:'Đã cập nhật nhân viên'});
}));
router.post('/organizations/:id/invitations',requireRole('admin'),asyncRoute(async(req,res)=>{
 checkStore(req,idParam(req.params.id));
 const d=parse(z.object({email,role:z.literal('staff')}),req.body);
 const token=randomBytes(32).toString('hex');
 await exec("INSERT INTO invitations(organization_id,email,role,token_hash,created_by,expires_at) VALUES(?,?,?,?,?,now()+interval '7 days')",[orgId(req),d.email,'staff',hashToken(token),req.user!.id]);
 const origin=process.env.APP_ORIGIN||process.env.RENDER_EXTERNAL_URL||'http://localhost:5173';
 res.status(201).json({invite_url:`${origin}/invite/${token}`,expires_in_days:7});
}));
router.get('/organizations/:id/invitations',requireRole('admin'),asyncRoute(async(req,res)=>{
 checkStore(req,idParam(req.params.id));
 const items=await rows("SELECT id,email,role,created_at,expires_at,accepted_at FROM invitations WHERE organization_id=? ORDER BY id DESC LIMIT 100",[orgId(req)]);
 res.json({items});
}));
export default router;
