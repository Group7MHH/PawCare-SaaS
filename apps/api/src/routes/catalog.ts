import {Router} from 'express';
import {z} from 'zod';
import {rows,exec,transaction} from '../lib/db.js';
import {asyncRoute,HttpError,idParam,parse} from '../lib/http.js';
import {orgId,requireAuth,requireOrganization,requireRole} from '../lib/auth.js';
export const router=Router();router.use(requireAuth,requireOrganization);
const serviceSchema=z.object({name:z.string().trim().min(2).max(120),category:z.string().trim().min(2).max(80),description:z.string().max(3000).nullable().optional(),duration_minutes:z.coerce.number().int().min(30).max(480).refine(v=>v%30===0),price:z.coerce.number().min(0).max(999999999),is_active:z.boolean().optional()});
router.get('/services',asyncRoute(async(req,res)=>{
 const customer=req.user!.role==='customer';const org=orgId(req);
 res.json({items:await rows(`SELECT * FROM services WHERE organization_id=? ${customer?'AND is_active=TRUE':''} ORDER BY is_active DESC,id DESC`,[org])});
}));
router.post('/services',requireRole('admin'),asyncRoute(async(req,res)=>{
 const d=parse(serviceSchema,req.body);const r=await exec('INSERT INTO services(organization_id,name,category,description,duration_minutes,price,is_active) VALUES(?,?,?,?,?,?,?)',[orgId(req),d.name,d.category,d.description||null,d.duration_minutes,d.price,d.is_active??true]);res.status(201).json({id:r.insertId});
}));
router.patch('/services/:id',requireRole('admin'),asyncRoute(async(req,res)=>{
 const d=parse(serviceSchema.partial(),req.body);if(!Object.keys(d).length)throw new HttpError(422,'Thiếu dữ liệu');const keys=Object.keys(d);
 const r=await exec(`UPDATE services SET ${keys.map(k=>`${k}=?`).join(',')} WHERE id=? AND organization_id=?`,[...keys.map(k=>(d as any)[k]),idParam(req.params.id),orgId(req)]);
 if(!r.affectedRows)throw new HttpError(404,'Không có dịch vụ');res.json({message:'Đã cập nhật'});
}));
router.delete('/services/:id',requireRole('admin'),asyncRoute(async(req,res)=>{
 const r=await exec('UPDATE services SET is_active=FALSE WHERE id=? AND organization_id=?',[idParam(req.params.id),orgId(req)]);
 if(!r.affectedRows)throw new HttpError(404,'Không có dịch vụ');res.json({message:'Đã ngừng cung cấp dịch vụ'});
}));
router.get('/staff',asyncRoute(async(req,res)=>{
 const internal=req.user!.role!=='customer';
 const items=await rows<any>(`SELECT u.id,u.full_name,${internal?'u.email,u.phone,':''} m.is_active,p.specialty,p.bio,
  ${internal?"(SELECT COUNT(*) FROM appointments a WHERE a.staff_id=u.id AND a.organization_id=m.organization_id AND a.status NOT IN('cancelled','completed'))":'0'} AS active_appointments
  FROM organization_members m JOIN users u ON u.id=m.user_id LEFT JOIN organization_staff_profiles p ON p.user_id=u.id AND p.organization_id=m.organization_id
  WHERE m.organization_id=? AND m.role='staff' AND u.is_active=TRUE ${internal?'':'AND m.is_active=TRUE'} ORDER BY m.is_active DESC,u.full_name`,[orgId(req)]);
 res.json({items});
}));
router.post('/staff',requireRole('admin'),asyncRoute(async(_req,_res)=>{throw new HttpError(410,'Hãy mời Staff qua trang Thành viên cửa hàng');}));
router.patch('/staff/:id',requireRole('admin'),asyncRoute(async(req,res)=>{
 const id=idParam(req.params.id),d=parse(z.object({specialty:z.string().max(160).nullable().optional(),bio:z.string().max(500).nullable().optional(),is_active:z.boolean().optional()}),req.body);
 if(!Object.keys(d).length)throw new HttpError(422,'Thiếu dữ liệu');
 if(!(await rows('SELECT user_id FROM organization_members WHERE organization_id=? AND user_id=? AND role=?',[orgId(req),id,'staff'])).length)throw new HttpError(404,'Không có nhân viên');
 await transaction(async db=>{
  // Global name/email/password belong to the account holder and are NOT editable by a store admin.
  if(d.is_active===false){
   const [busy]=await rows<any>("SELECT COUNT(*) AS count FROM appointments WHERE staff_id=? AND status IN ('pending','confirmed','in_progress')",[id],db);
   if(Number(busy.count)>0)throw new HttpError(409,'Hãy điều phối lịch của Staff trước khi khóa');
  }
  if(d.is_active!==undefined){
   await exec('UPDATE organization_members SET is_active=? WHERE organization_id=? AND user_id=?',[d.is_active,orgId(req),id],db);
   await exec('UPDATE users SET is_active=? WHERE id=?',[d.is_active,id],db);
  }
  if(d.specialty!==undefined||d.bio!==undefined)await exec(`INSERT INTO organization_staff_profiles(organization_id,user_id,specialty,bio) VALUES(?,?,?,?) ON CONFLICT(organization_id,user_id) DO UPDATE SET specialty=COALESCE(EXCLUDED.specialty,organization_staff_profiles.specialty),bio=COALESCE(EXCLUDED.bio,organization_staff_profiles.bio)`,[orgId(req),id,d.specialty??null,d.bio??null],db);
  await exec('INSERT INTO role_audit_logs(actor_id,organization_id,target_user_id,action,details) VALUES(?,?,?,?,?::jsonb)',[req.user!.id,orgId(req),id,'staff.update',JSON.stringify(d)],db);
 });res.json({message:'Đã cập nhật nhân viên trong cửa hàng'});
}));
router.delete('/staff/:id',requireRole('admin'),asyncRoute(async(req,res)=>{
 const id=idParam(req.params.id);
 await transaction(async db=>{
  const [staff]=await rows<any>("SELECT user_id FROM organization_members WHERE organization_id=? AND user_id=? AND role='staff' FOR UPDATE",[orgId(req),id],db);
  if(!staff)throw new HttpError(404,'Không có nhân viên');
  const [busy]=await rows<any>("SELECT COUNT(*) AS count FROM appointments WHERE staff_id=? AND status IN ('pending','confirmed','in_progress')",[id],db);
  if(Number(busy.count)>0)throw new HttpError(409,'Hãy điều phối lịch của Staff trước khi khóa');
  await exec('UPDATE organization_members SET is_active=FALSE WHERE organization_id=? AND user_id=?',[orgId(req),id],db);
  await exec('UPDATE users SET is_active=FALSE WHERE id=?',[id],db);
  await exec('INSERT INTO role_audit_logs(actor_id,organization_id,target_user_id,action) VALUES(?,?,?,?)',[req.user!.id,orgId(req),id,'staff.deactivate'],db);
 });
 res.json({message:'Đã vô hiệu hóa nhân viên'});
}));
export default router;
