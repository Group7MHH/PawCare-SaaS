import {Router} from 'express';
import {z} from 'zod';
import {rows,exec} from '../lib/db.js';
import {asyncRoute,HttpError,idParam,parse} from '../lib/http.js';
import {isPrivileged,orgId,requireAuth} from '../lib/auth.js';
const router=Router();router.use(requireAuth);
const petSchema=z.object({name:z.string().trim().min(1).max(100),species:z.enum(['dog','cat','other']),breed:z.string().max(120).nullable().optional(),gender:z.enum(['male','female','unknown']).default('unknown'),birthday:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),weight_kg:z.coerce.number().positive().max(500).nullable().optional(),color:z.string().max(80).nullable().optional(),notes:z.string().max(2000).nullable().optional(),owner_id:z.coerce.number().int().positive().optional()});
async function ownedPet(id:number,req:import('express').Request){const [pet]=await rows<any>('SELECT * FROM pets WHERE id=?',[id]);if(!pet)throw new HttpError(404,'Không tìm thấy thú cưng');if(!isPrivileged(req)&&pet.owner_id!==req.user!.id)throw new HttpError(403,'Không có quyền truy cập');
 if(isPrivileged(req)&&!(await rows('SELECT 1 FROM appointments WHERE pet_id=? AND organization_id=? AND (? <> 'staff' OR staff_id=?) LIMIT 1',[id,orgId(req),req.user!.role,req.user!.id])).length)throw new HttpError(404,'Không tìm thấy thú cưng trong cửa hàng');return pet;}
router.get('/',asyncRoute(async(req,res)=>{
 const filters:string[]=[];const params:unknown[]=[];
 if(!isPrivileged(req)){filters.push('p.owner_id=?');params.push(req.user!.id);}else { filters.push('EXISTS (SELECT 1 FROM appointments a WHERE a.pet_id=p.id AND a.organization_id=? ${req.user!.role==='staff'?'AND a.staff_id=?':''})');params.push(orgId(req)); if(req.user!.role==='staff')params.push(req.user!.id); if(req.query.owner_id){filters.push('p.owner_id=?');params.push(idParam(String(req.query.owner_id)));}}
 if(req.query.search){filters.push('(p.name ILIKE ? OR p.breed ILIKE ?)');params.push(...Array(2).fill(`%${String(req.query.search).slice(0,80)}%`));}
 if(isPrivileged(req))params.unshift(orgId(req));
 const pets=await rows<any>(`SELECT p.*,u.full_name AS owner_name,(SELECT COUNT(*) FROM care_records r WHERE r.pet_id=p.id ${isPrivileged(req)?'AND r.organization_id=?':''}) AS record_count FROM pets p JOIN users u ON p.owner_id=u.id ${filters.length?'WHERE '+filters.join(' AND '):''} ORDER BY p.created_at DESC`,params);
 res.json({items:pets});
}));
router.post('/',asyncRoute(async(req,res)=>{
 const d=parse(petSchema,req.body);const owner=isPrivileged(req)?(d.owner_id||req.user!.id):req.user!.id;
 if(!(await rows('SELECT id FROM users WHERE id=? AND is_active=TRUE',[owner])).length)throw new HttpError(422,'Chủ thú cưng phải là khách hàng hợp lệ');
 if(isPrivileged(req)&&!(await rows('SELECT 1 FROM appointments WHERE customer_id=? AND organization_id=? LIMIT 1',[owner,orgId(req)])).length)throw new HttpError(403,'Khách hàng chưa có lịch tại cửa hàng này');
 const r=await exec('INSERT INTO pets(owner_id,name,species,breed,gender,birthday,weight_kg,color,notes) VALUES(?,?,?,?,?,?,?,?,?)',[owner,d.name,d.species,d.breed||null,d.gender,d.birthday||null,d.weight_kg??null,d.color||null,d.notes||null]);
 res.status(201).json({id:r.insertId,message:'Đã thêm thú cưng'});
}));
router.get('/:id',asyncRoute(async(req,res)=>{const pet=await ownedPet(idParam(req.params.id),req);const records=await rows(`SELECT * FROM care_records WHERE pet_id=? ${isPrivileged(req)?'AND organization_id=?':''} ORDER BY care_date DESC`,isPrivileged(req)?[pet.id,orgId(req)]:[pet.id]);res.json({pet,records});}));
router.patch('/:id',asyncRoute(async(req,res)=>{
 const pet=await ownedPet(idParam(req.params.id),req);if(isPrivileged(req))throw new HttpError(403,'Chỉ chủ thú cưng được thay đổi thông tin hồ sơ chung');const d=parse(petSchema.omit({owner_id:true}).partial(),req.body);
 if(!Object.keys(d).length)throw new HttpError(422,'Không có trường cần cập nhật');
 const keys=Object.keys(d);await exec(`UPDATE pets SET ${keys.map(k=>`${k}=?`).join(',')} WHERE id=?`,[...keys.map(k=>(d as any)[k]??null),pet.id]);res.json({message:'Đã cập nhật thú cưng'});
}));
router.delete('/:id',asyncRoute(async(req,res)=>{
 const pet=await ownedPet(idParam(req.params.id),req);if(isPrivileged(req))throw new HttpError(403,'Chỉ chủ thú cưng có quyền xóa hồ sơ chung');
 if((await rows('SELECT id FROM appointments WHERE pet_id=? LIMIT 1',[pet.id])).length)throw new HttpError(409,'Thú cưng đã có lịch hẹn. Hãy giữ hồ sơ để bảo toàn lịch sử.');
 await exec('DELETE FROM pets WHERE id=?',[pet.id]);res.json({message:'Đã xóa thú cưng'});
}));
const careSchema=z.object({title:z.string().min(2).max(160),record_type:z.enum(['vaccination','medical','grooming','other']).default('other'),care_date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),description:z.string().max(3000).nullable().optional(),next_due_date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional()});
router.post('/:id/records',asyncRoute(async(req,res)=>{
 const pet=await ownedPet(idParam(req.params.id),req);const d=parse(careSchema,req.body);
 const r=await exec('INSERT INTO care_records(pet_id,organization_id,created_by_user_id,title,record_type,care_date,description,next_due_date) VALUES(?,?,?,?,?,?,?,?)',[pet.id,isPrivileged(req)?orgId(req):null,req.user!.id,d.title,d.record_type,d.care_date,d.description||null,d.next_due_date||null]);res.status(201).json({id:r.insertId,message:'Đã thêm hồ sơ chăm sóc'});
}));
router.delete('/:id/records/:recordId',asyncRoute(async(req,res)=>{
 const pet=await ownedPet(idParam(req.params.id),req);const r=await exec(`DELETE FROM care_records WHERE id=? AND pet_id=? ${isPrivileged(req)?'AND organization_id=?':'AND created_by_user_id=?'}` ,isPrivileged(req)?[idParam(req.params.recordId),pet.id,orgId(req)]:[idParam(req.params.recordId),pet.id,req.user!.id]);if(!r.affectedRows)throw new HttpError(404,'Không tìm thấy hồ sơ');res.json({message:'Đã xóa hồ sơ'});
}));
export default router;
