import {Router} from 'express';
import {z} from 'zod';
import {pool,rows,exec,transaction,lockStaff,type DB} from '../lib/db.js';
import {asyncRoute,HttpError,idParam,parse,pageParams} from '../lib/http.js';
import {isPrivileged,orgId,requireAuth,requireOrganization} from '../lib/auth.js';
import {canTransition,isoUTC,sqlUTC,validateBookingTime} from '../lib/scheduling.js';
const router=Router();router.use(requireAuth,requireOrganization);
const bookingSchema=z.object({pet_id:z.coerce.number().int().positive(),service_id:z.coerce.number().int().positive(),staff_id:z.coerce.number().int().positive().nullable().optional(),starts_at:z.string().datetime({offset:true}).or(z.string().datetime()),notes:z.string().max(1000).nullable().optional(),customer_id:z.coerce.number().int().positive().optional()});
const appointmentSelect=`SELECT a.*,u.full_name AS customer_name,u.phone AS customer_phone,p.name AS pet_name,p.species AS pet_species,s.name AS service_name,a.duration_minutes_snapshot AS duration_minutes,st.full_name AS staff_name
  FROM appointments a JOIN users u ON a.customer_id=u.id JOIN pets p ON a.pet_id=p.id JOIN services s ON a.service_id=s.id LEFT JOIN users st ON a.staff_id=st.id`;
function mapAppointment(a:any){return {...a,starts_at:isoUTC(a.starts_at),ends_at:isoUTC(a.ends_at)};}
async function accessible(id:number,req:import('express').Request,db:DB=pool){
 const [a]=await rows<any>(`${appointmentSelect} WHERE a.id=? AND a.organization_id=?`,[id,orgId(req)],db);
 if(!a)throw new HttpError(404,'Không tìm thấy lịch hẹn');
 if(req.user!.role==='customer'&&a.customer_id!==req.user!.id)throw new HttpError(403,'Không có quyền xem lịch hẹn');
 if(req.user!.role==='staff'&&a.staff_id!==req.user!.id)throw new HttpError(403,'Bạn chỉ được xử lý lịch được phân công');
 return a;
}
router.get('/',asyncRoute(async(req,res)=>{
 const {page,limit}=pageParams(req),clauses:string[]=[];const params:unknown[]=[];
 clauses.push('a.organization_id=?');params.push(orgId(req));
 if(req.user!.role==='admin' && d.status==='completed')throw new HttpError(403,'Chỉ Staff phụ trách được hoàn thành công việc');
 if(req.user!.role==='customer'){clauses.push('a.customer_id=?');params.push(req.user!.id);}
 if(req.user!.role==='staff'){clauses.push('a.staff_id=?');params.push(req.user!.id);}
 if(req.query.status&&req.query.status!=='all'){clauses.push('a.status=?');params.push(String(req.query.status));}
 if(req.query.search){clauses.push('(u.full_name ILIKE ? OR p.name ILIKE ? OR s.name ILIKE ?)');params.push(...Array(3).fill(`%${String(req.query.search).slice(0,80)}%`));}
 const where=clauses.length?' WHERE '+clauses.join(' AND '):'';
 const [{total}]=await rows<any>(`SELECT COUNT(*) AS total FROM appointments a JOIN users u ON a.customer_id=u.id JOIN pets p ON a.pet_id=p.id JOIN services s ON a.service_id=s.id ${where}`,params);
 const items=await rows<any>(`${appointmentSelect}${where} ORDER BY a.starts_at DESC LIMIT ? OFFSET ?`,[...params,limit,(page-1)*limit]);
 res.json({items:items.map(mapAppointment),total,page,limit});
}));
router.get('/availability',asyncRoute(async(req,res)=>{
 const input=parse(z.object({date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),service_id:z.coerce.number().int().positive(),staff_id:z.coerce.number().int().positive().optional()}),req.query);
 const [service]=await rows<any>('SELECT id,duration_minutes FROM services WHERE id=? AND organization_id=? AND is_active=TRUE',[input.service_id,orgId(req)]);
 if(!service)throw new HttpError(404,'Không có dịch vụ');
 if(input.staff_id){const [member]=await rows<any>("SELECT u.id FROM organization_members m JOIN users u ON u.id=m.user_id WHERE m.user_id=? AND m.organization_id=? AND m.role='staff' AND m.is_active=TRUE AND u.is_active=TRUE",[input.staff_id,orgId(req)]);if(!member)throw new HttpError(422,'Nhân viên không khả dụng');}
 const slots:{time:string;available:boolean}[]=[];
 const [y,m,d]=input.date.split('-').map(Number);
 if(new Date(Date.UTC(y,m-1,d)).toISOString().slice(0,10)!==input.date)throw new HttpError(422,'Ngày không hợp lệ');
 for(let minute=8*60;minute+service.duration_minutes<=18*60;minute+=30){
   const time=`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;
   const start=new Date(`${input.date}T${time}:00+07:00`);
   let available=true;
   try{validateBookingTime(start,service.duration_minutes);}catch{available=false;}
   if(available&&input.staff_id){
     const conflict=await rows<any>("SELECT id FROM appointments WHERE staff_id=? AND status<>'cancelled' AND starts_at<? AND ends_at>? LIMIT 1",[input.staff_id,sqlUTC(new Date(start.getTime()+service.duration_minutes*60000)),sqlUTC(start)]);
     if(conflict.length)available=false;
   }
   if(available&&!input.staff_id){
     const free=await rows<any>(`SELECT m.user_id FROM organization_members m JOIN users u ON u.id=m.user_id
       WHERE m.organization_id=? AND m.role='staff' AND m.is_active=TRUE AND u.is_active=TRUE
       AND NOT EXISTS(SELECT 1 FROM appointments a WHERE a.staff_id=m.user_id AND a.status<>'cancelled' AND a.starts_at<? AND a.ends_at>?) LIMIT 1`,
       [orgId(req),sqlUTC(new Date(start.getTime()+service.duration_minutes*60000)),sqlUTC(start)]);
     available=free.length>0;
   }
   slots.push({time,available});
 }
 res.json({date:input.date,slots});
}));
router.get('/:id',asyncRoute(async(req,res)=>res.json({appointment:mapAppointment(await accessible(idParam(req.params.id),req))})));
// PostgreSQL advisory transaction locks coordinate staff bookings across replicas.
async function verifyAvailability(db:DB,staffId:number|null,start:string,end:string,exceptId?:number){
 if(!staffId)throw new HttpError(422,'Cần phân công nhân viên trước khi xác nhận lịch');
 const conflicts=await rows<any>(`SELECT id FROM appointments WHERE staff_id=? AND status<>'cancelled' AND starts_at<? AND ends_at>? ${exceptId?'AND id<>?':''} LIMIT 1`,[staffId,end,start,...(exceptId?[exceptId]:[])],db);
 if(conflicts.length)throw new HttpError(409,'Nhân viên đã có lịch trong khung giờ này');
}
router.post('/',asyncRoute(async(req,res)=>{
 const d=parse(bookingSchema,req.body);
 if(req.user!.role==='staff')throw new HttpError(403,'Staff không được tự tạo lịch thay khách');
 if(isPrivileged(req)&&!d.customer_id)throw new HttpError(422,'Cần chọn khách hàng khi tạo lịch thay khách');
 const customerId=isPrivileged(req)?d.customer_id!:req.user!.id;
 const [pet]=await rows<any>('SELECT id,owner_id FROM pets WHERE id=?',[d.pet_id]);
 if(!pet||pet.owner_id!==customerId)throw new HttpError(422,'Thú cưng không thuộc khách hàng đã chọn');
 const [service]=await rows<any>('SELECT * FROM services WHERE id=? AND organization_id=? AND is_active=TRUE',[d.service_id,orgId(req)]);if(!service)throw new HttpError(422,'Dịch vụ không khả dụng');
 const start=new Date(d.starts_at);validateBookingTime(start,service.duration_minutes);
 if(d.staff_id){const [staff]=await rows<any>("SELECT u.id FROM organization_members m JOIN users u ON u.id=m.user_id WHERE m.user_id=? AND m.organization_id=? AND m.role='staff' AND m.is_active=TRUE AND u.is_active=TRUE",[d.staff_id,orgId(req)]);if(!staff)throw new HttpError(422,'Nhân viên không khả dụng');}
 const st=sqlUTC(start),en=sqlUTC(new Date(start.getTime()+service.duration_minutes*60000));const staffId=d.staff_id||null;
 const result=await transaction(async db=>{
   // Serialize selection for requests without a preferred staff member.
   if(!staffId)await db.query('SELECT pg_advisory_xact_lock($1,$2)',[42371,0]);
   let assigned=staffId;
   if(!assigned){
     const candidates=await rows<any>("SELECT m.user_id FROM organization_members m JOIN users u ON u.id=m.user_id WHERE m.organization_id=? AND m.role='staff' AND m.is_active=TRUE AND u.is_active=TRUE ORDER BY m.user_id",[orgId(req)],db);
     for(const candidate of candidates){
       const occupied=await rows<any>("SELECT 1 FROM appointments WHERE staff_id=? AND status<>'cancelled' AND starts_at<? AND ends_at>? LIMIT 1",[candidate.user_id,en,st],db);
       if(!occupied.length){assigned=candidate.user_id;break;}
     }
     if(!assigned)throw new HttpError(409,'Không còn nhân viên trống trong khung giờ đã chọn');
   }
   await lockStaff(db,[assigned]);
   await verifyAvailability(db,assigned,st,en);
   return exec('INSERT INTO appointments(organization_id,customer_id,pet_id,service_id,staff_id,starts_at,ends_at,price_snapshot,notes,duration_minutes_snapshot) VALUES(?,?,?,?,?,?,?,?,?,?)',[orgId(req),customerId,d.pet_id,d.service_id,assigned,st,en,service.price,d.notes||null,service.duration_minutes],db);
 });res.status(201).json({id:result.insertId,message:'Đặt lịch thành công'});
}));
router.patch('/:id',asyncRoute(async(req,res)=>{
 const id=idParam(req.params.id);
 const schema=z.object({status:z.enum(['pending','confirmed','in_progress','completed','cancelled']).optional(),staff_id:z.coerce.number().int().positive().nullable().optional(),starts_at:z.string().datetime({offset:true}).or(z.string().datetime()).optional(),notes:z.string().max(1000).nullable().optional(),care_result:z.string().trim().min(2).max(3000).optional()});
 const d=parse(schema,req.body);if(!Object.keys(d).length)throw new HttpError(422,'Thiếu dữ liệu');
 const current=await accessible(id,req);
 if(req.user!.role==='customer' && d.status && d.status!=='cancelled' && d.status!==current.status)throw new HttpError(403,'Khách hàng chỉ được hủy lịch');
 if(d.status&&!canTransition(current.status,d.status,req.user!.role))throw new HttpError(422,'Chuyển trạng thái không hợp lệ');
 if(req.user!.role==='staff'&&(d.staff_id!==undefined||d.starts_at!==undefined))throw new HttpError(403,'Chỉ quản trị viên được đổi nhân viên hoặc giờ hẹn');
 if(req.user!.role==='customer'){
   if(Object.keys(d).some(k=>k!=='status'&&k!=='notes'))throw new HttpError(403,'Khách hàng chỉ được sửa ghi chú hoặc hủy lịch');
   if(!['pending','confirmed'].includes(current.status))throw new HttpError(409,'Không thể thay đổi lịch này');
 }
 if(['completed','cancelled'].includes(current.status))throw new HttpError(409,'Lịch đã kết thúc hoặc hủy');
 if(d.staff_id){const [staff]=await rows<any>("SELECT u.id FROM organization_members m JOIN users u ON u.id=m.user_id WHERE m.user_id=? AND m.organization_id=? AND m.role='staff' AND m.is_active=TRUE AND u.is_active=TRUE",[d.staff_id,orgId(req)]);if(!staff)throw new HttpError(422,'Nhân viên không khả dụng');}
 if(d.care_result && req.user!.role!=='staff')throw new HttpError(403,'Chỉ Staff được ghi kết quả chăm sóc');
 if(d.status==='completed'&&req.user!.role==='staff'&&!d.care_result&&!current.care_result)throw new HttpError(422,'Vui lòng ghi kết quả chăm sóc trước khi hoàn thành');
 const start=d.starts_at?new Date(d.starts_at):new Date(isoUTC(current.starts_at));
 if(d.starts_at){if(req.user!.role==='customer')throw new HttpError(403,'Không có quyền đổi thời gian');validateBookingTime(start,Math.round((new Date(isoUTC(current.ends_at)).getTime()-new Date(isoUTC(current.starts_at)).getTime())/60000));}
 const originalDuration=Math.round((new Date(isoUTC(current.ends_at)).getTime()-new Date(isoUTC(current.starts_at)).getTime())/60000);
 const st=sqlUTC(start),en=sqlUTC(new Date(start.getTime()+originalDuration*60000));const staffId=d.staff_id===undefined?current.staff_id:d.staff_id;
 if(d.status==='confirmed'&&!staffId)throw new HttpError(422,'Chưa phân công nhân viên');
 await transaction(async db=>{
   await lockStaff(db,[current.staff_id,staffId]);
   // Prevent stale writes to a schedule concurrently changed by another request.
   const [fresh]=await rows<any>('SELECT status,staff_id,starts_at,ends_at FROM appointments WHERE id=? AND organization_id=? FOR UPDATE',[id,orgId(req)],db);
   if(!fresh || fresh.status!==current.status || isoUTC(fresh.starts_at)!==isoUTC(current.starts_at) || fresh.staff_id!==current.staff_id)throw new HttpError(409,'Lịch đã thay đổi, hãy tải lại trang');
   if(d.starts_at!==undefined||d.staff_id!==undefined)await verifyAvailability(db,staffId,st,en,id);
   await exec('UPDATE appointments SET status=?,staff_id=?,starts_at=?,ends_at=?,notes=?,care_result=? WHERE id=? AND organization_id=?',[d.status||current.status,staffId,st,en,d.notes===undefined?current.notes:d.notes,d.care_result??current.care_result??null,id,orgId(req)],db);
 });res.json({message:'Đã cập nhật lịch hẹn'});
}));
router.delete('/:id',asyncRoute(async(req,res)=>{
 const a=await accessible(idParam(req.params.id),req);
 if(!canTransition(a.status,'cancelled',req.user!.role))throw new HttpError(409,'Không thể hủy lịch ở trạng thái này');
 await exec("UPDATE appointments SET status='cancelled' WHERE id=? AND organization_id=?",[a.id,orgId(req)]);res.json({message:'Đã hủy lịch hẹn'});
}));
export default router;
