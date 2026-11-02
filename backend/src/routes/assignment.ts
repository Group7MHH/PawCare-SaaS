import {Router} from 'express';
import {z} from 'zod';
import {rows,exec,transaction,lockStaff} from '../lib/db.js';
import {asyncRoute,HttpError,idParam,parse} from '../lib/http.js';
import {orgId,requireAuth,requireOrganization,requireRole} from '../lib/auth.js';

const router=Router();
router.use(requireAuth,requireOrganization);

const assignmentSql=`SELECT id,staff_id,status,starts_at,ends_at,needs_admin_attention
 FROM appointments WHERE id=? AND organization_id=? FOR UPDATE`;

/** Staff confirms only a pending booking currently assigned to them.
 * Row lock plus status guard prevents duplicate/stale acceptance.
 */
router.post('/:id/accept',requireRole('staff'),asyncRoute(async(req,res)=>{
 const id=idParam(req.params.id),staffId=req.user!.id,org=orgId(req);
 await transaction(async db=>{
  await lockStaff(db,[staffId]);
  const [appt]=await rows<{staff_id:number|null;status:string;needs_admin_attention:boolean}>(assignmentSql,[id,org],db);
  if(!appt)throw new HttpError(404,'Không tìm thấy lịch hẹn');
  if(appt.staff_id!==staffId)throw new HttpError(403,'Chỉ nhân viên được phân công mới được nhận lịch');
  if(appt.status!=='pending')throw new HttpError(409,'Lịch không còn chờ tiếp nhận');
  if(appt.needs_admin_attention)throw new HttpError(409,'Lịch đang cần Admin điều phối');
  const [member]=await rows<{user_id:number}>(`SELECT m.user_id FROM organization_members m
   JOIN users u ON u.id=m.user_id
   WHERE m.organization_id=? AND m.user_id=? AND m.role='staff' AND m.is_active=TRUE
   AND u.role='staff' AND u.is_active=TRUE`,[org,staffId],db);
  if(!member)throw new HttpError(403,'Nhân viên không còn hoạt động');
  await exec("UPDATE appointments SET status='confirmed',needs_admin_attention=FALSE,assignment_note=NULL WHERE id=? AND organization_id=?",[id,org],db);
 });
 res.json({message:'Đã tiếp nhận và xác nhận lịch hẹn'});
}));

/** When Staff declines, do not cancel the customer's booking. Try an alternate
 * active, free Staff that has never declined this appointment. If none is
 * available, release the assignment and flag the booking for Admin.
 */
router.post('/:id/decline',requireRole('staff'),asyncRoute(async(req,res)=>{
 const id=idParam(req.params.id),staffId=req.user!.id,org=orgId(req);
 const input=parse(z.object({reason:z.string().trim().max(200).optional()}).strict(),req.body||{});
 const result=await transaction(async db=>{
  // Serialize auto-assignment/reassignment requests in a stable order.
  await db.query('SELECT pg_advisory_xact_lock($1,$2)',[42371,0]);
  const staff=await rows<{user_id:number}>(`SELECT m.user_id FROM organization_members m
    JOIN users u ON u.id=m.user_id WHERE m.organization_id=?
    AND m.role='staff' AND m.is_active=TRUE AND u.role='staff' AND u.is_active=TRUE
    ORDER BY m.user_id`,[org],db);
  // Lock every candidate in sorted order, including the declining staff member.
  await lockStaff(db,[staffId,...staff.map(s=>s.user_id)]);
  const [appt]=await rows<{staff_id:number|null;status:string;starts_at:string;ends_at:string}>(assignmentSql,[id,org],db);
  if(!appt)throw new HttpError(404,'Không tìm thấy lịch hẹn');
  if(appt.staff_id!==staffId)throw new HttpError(403,'Chỉ nhân viên được phân công mới được từ chối lịch');
  if(appt.status!=='pending')throw new HttpError(409,'Chỉ có thể từ chối lịch đang chờ tiếp nhận');
  await exec(`INSERT INTO appointment_staff_declines(appointment_id,staff_id)
   VALUES(?,?) ON CONFLICT DO NOTHING`,[id,staffId],db);
  const replacement=await rows<{user_id:number}>(`SELECT m.user_id FROM organization_members m
   JOIN users u ON u.id=m.user_id
   WHERE m.organization_id=? AND m.role='staff' AND m.is_active=TRUE
     AND u.role='staff' AND u.is_active=TRUE
     AND NOT EXISTS(SELECT 1 FROM appointment_staff_declines d
       WHERE d.appointment_id=? AND d.staff_id=m.user_id)
     AND NOT EXISTS(SELECT 1 FROM appointments a
       WHERE a.staff_id=m.user_id AND a.id<>? AND a.status<>'cancelled'
       AND a.starts_at<? AND a.ends_at>?)
   ORDER BY (SELECT COUNT(*) FROM appointments w WHERE w.staff_id=m.user_id
     AND w.status IN ('pending','confirmed','in_progress')
     AND w.starts_at >= date_trunc('day',?::timestamptz)
     AND w.starts_at < date_trunc('day',?::timestamptz) + interval '1 day') ASC,
     m.user_id ASC LIMIT 1`,[org,id,id,appt.ends_at,appt.starts_at,appt.starts_at,appt.starts_at],db);
  const alternate=replacement[0]?.user_id??null;
  const note=alternate?'Nhân viên trước không thể tiếp nhận; đã chuyển sang nhân viên khác':
   'Chưa có nhân viên thay thế; Admin cần điều phối';
  // Do not delete or cancel the appointment: its service bundle, price and time survive.
  await exec(`UPDATE appointments SET staff_id=?,status='pending',
     needs_admin_attention=?,assignment_note=? WHERE id=? AND organization_id=?`,
    [alternate,!alternate,note,id,org],db);
  return {assigned_staff_id:alternate,needs_admin_attention:!alternate};
 });
 res.json({...result,message:result.needs_admin_attention?
  'Đã chuyển yêu cầu đến Admin để điều phối':'Đã chuyển lịch cho nhân viên khác tiếp nhận'});
}));

export default router;
