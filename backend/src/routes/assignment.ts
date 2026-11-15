import {Router} from 'express';
import {z} from 'zod';
import {rows,exec,transaction,lockStaff} from '../lib/db.js';
import {asyncRoute,HttpError,idParam,parse} from '../lib/http.js';
import {orgId,requireAuth,requireOrganization,requireRole} from '../lib/auth.js';
import {isoUTC} from '../lib/scheduling.js';

const router=Router();
router.use(requireAuth,requireOrganization);
const assignmentSql=`SELECT id,staff_id,status,starts_at,ends_at,needs_admin_attention
 FROM appointments WHERE id=? AND organization_id=? FOR UPDATE`;

/** Staff may accept only a booking explicitly assigned by Admin.
 * Locking Staff and appointment ensures no accidental double assignment.
 */
router.post('/:id/accept',requireRole('staff'),asyncRoute(async(req,res)=>{
 const id=idParam(req.params.id),staffId=req.user!.id,org=orgId(req);
 await transaction(async db=>{
  await lockStaff(db,[staffId]);
  const [appt]=await rows<{staff_id:number|null;status:string;starts_at:Date|string;ends_at:Date|string}>(assignmentSql,[id,org],db);
  if(!appt)throw new HttpError(404,'Không tìm thấy lịch hẹn');
  if(appt.staff_id!==staffId)throw new HttpError(403,'Chỉ được nhận lịch do Admin phân công cho bạn');
  if(appt.status!=='pending')throw new HttpError(409,'Lịch không còn chờ tiếp nhận');
  if(new Date(isoUTC(appt.starts_at)).getTime()<=Date.now())throw new HttpError(409,'Lịch đã đến giờ; cần Admin xử lý');
  const [declined]=await rows('SELECT 1 FROM appointment_staff_declines WHERE appointment_id=? AND staff_id=?',[id,staffId],db);
  if(declined)throw new HttpError(409,'Bạn đã từ chối lịch này');
  const [member]=await rows(`SELECT 1 FROM organization_members m JOIN users u ON u.id=m.user_id
   WHERE m.organization_id=? AND m.user_id=? AND m.role='staff' AND m.is_active=TRUE
   AND u.role='staff' AND u.is_active=TRUE`,[org,staffId],db);
  if(!member)throw new HttpError(403,'Nhân viên không còn hoạt động');
  const [conflict]=await rows(`SELECT 1 FROM appointments
   WHERE organization_id=? AND staff_id=? AND id<>? AND status<>'cancelled'
   AND starts_at<? AND ends_at>? LIMIT 1`,[org,staffId,id,appt.ends_at,appt.starts_at],db);
  if(conflict)throw new HttpError(409,'Bạn đã có lịch trùng khung giờ này');
  await exec("UPDATE appointments SET staff_id=?,status='confirmed',needs_admin_attention=FALSE,assignment_note=NULL WHERE id=? AND organization_id=?",
   [staffId,id,org],db);
 });
 res.json({message:'Bạn đã nhận và xác nhận lịch hẹn'});
}));

/** Return an assigned booking to Admin for explicit reassignment; never expose an open Staff queue. */
router.post('/:id/decline',requireRole('staff'),asyncRoute(async(req,res)=>{
 const id=idParam(req.params.id),staffId=req.user!.id,org=orgId(req);
 parse(z.object({reason:z.string().trim().max(200).optional()}).strict(),req.body||{});
 await transaction(async db=>{
  await db.query('SELECT pg_advisory_xact_lock($1,$2)',[42371,0]);
  await lockStaff(db,[staffId]);
  const [appt]=await rows<{staff_id:number|null;status:string}>(assignmentSql,[id,org],db);
  if(!appt)throw new HttpError(404,'Không tìm thấy lịch hẹn');
  if(appt.staff_id!==staffId)throw new HttpError(403,'Chỉ nhân viên được giao mới có thể trả lịch');
  if(!['pending','confirmed'].includes(appt.status))throw new HttpError(409,'Không thể trả lịch đang thực hiện hoặc đã kết thúc');
  await exec(`INSERT INTO appointment_staff_declines(appointment_id,staff_id)
   VALUES(?,?) ON CONFLICT DO NOTHING`,[id,staffId],db);
  await exec(`UPDATE appointments SET staff_id=NULL,status='pending',
   needs_admin_attention=TRUE,assignment_note='Nhân viên đã trả lịch; Admin cần phân công lại'
   WHERE id=? AND organization_id=?`,[id,org],db);
 });
 res.json({needs_admin_attention:true,message:'Đã trả lịch để Admin phân công lại'});
}));
export default router;
