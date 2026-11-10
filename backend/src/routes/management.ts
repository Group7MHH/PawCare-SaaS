import {Router} from 'express';
import {rows} from '../lib/db.js';
import {isoUTC} from '../lib/scheduling.js';
import {asyncRoute,HttpError,idParam,pageParams} from '../lib/http.js';
import {orgId,requireAuth,requireRole} from '../lib/auth.js';
const router=Router();router.use(requireAuth);
router.get('/customers',requireRole('admin','staff'),asyncRoute(async(req,res)=>{
 const org=orgId(req),{page,limit}=pageParams(req);const q=`%${String(req.query.search||'').slice(0,90)}%`;
 const condition=req.user!.role==='staff'
  ? "FROM users u WHERE u.role='customer' AND EXISTS(SELECT 1 FROM appointments a WHERE a.customer_id=u.id AND a.organization_id=? AND a.staff_id=?) AND (u.full_name ILIKE ? OR u.email ILIKE ? OR u.phone ILIKE ?)"
  : "FROM users u WHERE u.role='customer' AND (u.full_name ILIKE ? OR u.email ILIKE ? OR u.phone ILIKE ?)";
 const scope=req.user!.role==='staff'?[org,req.user!.id]:[];
 const [{total}]=await rows<any>(`SELECT COUNT(*) AS total ${condition}`,[...scope,q,q,q]);
 const items=await rows<any>(`SELECT u.id,u.full_name,u.email,u.phone,u.address,u.is_active,u.created_at,
 (SELECT COUNT(DISTINCT a.pet_id) FROM appointments a WHERE a.customer_id=u.id AND a.organization_id=?) AS pet_count,
 (SELECT COUNT(*) FROM appointments a WHERE a.customer_id=u.id AND a.organization_id=?) AS appointment_count
 ${condition} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,[org,org,...scope,q,q,q,limit,(page-1)*limit]);
 res.json({items,total,page,limit});
}));
router.get('/customers/:id',requireRole('admin','staff'),asyncRoute(async(req,res)=>{
 const id=idParam(req.params.id),org=orgId(req);
 const [customer]=await rows<any>(`SELECT u.id,u.full_name,u.email,u.phone,u.address,u.created_at FROM users u
  WHERE u.id=? AND u.role='customer' ${req.user!.role==='staff'?"AND EXISTS (SELECT 1 FROM appointments a WHERE a.customer_id=u.id AND a.organization_id=? AND a.staff_id=?)":""}`,[id,...(req.user!.role==='staff'?[org,req.user!.id]:[])]);
 if(!customer)throw new HttpError(404,'Không tìm thấy khách hàng tại cửa hàng này');
 const pets=await rows(`SELECT p.* FROM pets p WHERE p.owner_id=? ${req.user!.role==='staff'?"AND EXISTS (SELECT 1 FROM appointments a WHERE a.pet_id=p.id AND a.organization_id=? AND a.staff_id=?)":""}`,[id,...(req.user!.role==='staff'?[org,req.user!.id]:[])]);res.json({customer,pets});
}));
router.get('/dashboard',asyncRoute(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 const id=req.user!.id,role=req.user!.role;
 if(role==='customer'){
  const [[pets],[upcoming],[total]]=await Promise.all([
   rows<any>('SELECT COUNT(*) AS value FROM pets WHERE owner_id=?',[id]),
   rows<any>("SELECT COUNT(*) AS value FROM appointments WHERE customer_id=? AND organization_id=? AND status IN('pending','confirmed','in_progress') AND starts_at>=now()",[id,req.user!.organization_id??0]),
   rows<any>('SELECT COUNT(*) AS value FROM appointments WHERE customer_id=? AND organization_id=?',[id,req.user!.organization_id??0])
  ]);
  const recent=await rows<any>(`SELECT a.id,a.status,a.starts_at,p.name AS pet_name,COALESCE(bundle.names,s.name) AS service_name
  FROM appointments a JOIN pets p ON a.pet_id=p.id JOIN services s ON a.service_id=s.id
  LEFT JOIN LATERAL(SELECT string_agg(COALESCE(aps.name_snapshot,svc.name),' + ' ORDER BY aps.position) AS names FROM appointment_services aps JOIN services svc ON svc.id=aps.service_id WHERE aps.appointment_id=a.id) bundle ON TRUE
  WHERE a.customer_id=? AND a.organization_id=? ORDER BY a.updated_at DESC,a.id DESC LIMIT 5`,[id,req.user!.organization_id??0]);
  const [next]=await rows<any>(`SELECT a.id,a.status,a.starts_at,p.name AS pet_name,COALESCE(bundle.names,s.name) AS service_name
  FROM appointments a JOIN pets p ON a.pet_id=p.id JOIN services s ON a.service_id=s.id
  LEFT JOIN LATERAL(SELECT string_agg(COALESCE(aps.name_snapshot,svc.name),' + ' ORDER BY aps.position) AS names FROM appointment_services aps JOIN services svc ON svc.id=aps.service_id WHERE aps.appointment_id=a.id) bundle ON TRUE
  WHERE a.customer_id=? AND a.organization_id=? AND (a.status='in_progress' OR (a.status IN('pending','confirmed') AND a.starts_at>=now()))
  ORDER BY CASE WHEN a.status='in_progress' THEN 0 ELSE 1 END,a.starts_at ASC LIMIT 1`,[id,req.user!.organization_id??0]);
  res.json({stats:{pets:pets.value,upcoming:upcoming.value,appointments:total.value},next:next?{...next,starts_at:isoUTC(next.starts_at)}:null,recent:recent.map(a=>({...a,starts_at:isoUTC(a.starts_at)}))});return;
 }
 const org=orgId(req),staff=role==='staff';
 const params=staff?[org,id]:[org];
 const where=staff?'organization_id=? AND staff_id=?':'organization_id=?';
 const [[customers],[pets],[totals]]=await Promise.all([
  rows<any>('SELECT COUNT(DISTINCT customer_id) AS value FROM appointments WHERE organization_id=?',[org]),
  rows<any>('SELECT COUNT(DISTINCT pet_id) AS value FROM appointments WHERE organization_id=?',[org]),
  rows<any>(`SELECT COUNT(*)::int AS appointments,COUNT(*) FILTER (WHERE status='completed')::int AS completed,
   COALESCE(SUM(price_snapshot) FILTER (WHERE status='completed'),0) AS revenue
   FROM appointments WHERE ${where}`,params)
 ]);
 const [finance]=await rows<{collected:number;unpaid:number;awaiting_payment:number;pending_review:number;refund_required:number;refunded:number}>(`
   SELECT COALESCE(SUM(p.amount) FILTER(WHERE p.status='paid'),0) AS collected,
    COALESCE(SUM(p.amount) FILTER(WHERE p.status='unpaid'),0) AS unpaid,
    COALESCE(SUM(p.amount) FILTER(WHERE p.status='awaiting_payment'),0) AS awaiting_payment,
    COALESCE(SUM(p.amount) FILTER(WHERE p.status='pending_review'),0) AS pending_review,
    COALESCE(SUM(p.amount) FILTER(WHERE p.status='refund_required'),0) AS refund_required,
    COALESCE(SUM(p.amount) FILTER(WHERE p.status='refunded'),0) AS refunded
   FROM payments p JOIN appointments a ON a.id=p.appointment_id
   WHERE a.organization_id=? ${staff?'AND a.staff_id=?':''}`,params);
 const recent=await rows<any>(`SELECT a.id,a.status,a.starts_at,u.full_name AS customer_name,p.name AS pet_name,COALESCE(bundle.names,s.name) AS service_name,a.price_snapshot
  FROM appointments a JOIN users u ON u.id=a.customer_id JOIN pets p ON p.id=a.pet_id JOIN services s ON s.id=a.service_id
  LEFT JOIN LATERAL (SELECT string_agg(COALESCE(aps.name_snapshot,svc.name),' + ' ORDER BY aps.position) AS names FROM appointment_services aps JOIN services svc ON svc.id=aps.service_id WHERE aps.appointment_id=a.id) bundle ON TRUE
  WHERE a.organization_id=? ${staff?'AND a.staff_id=?':''} ORDER BY a.updated_at DESC,a.id DESC LIMIT 7`,params);
 const series=await rows<any>(`SELECT to_char(COALESCE(completed_at,updated_at) AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM') AS month,
  COALESCE(SUM(price_snapshot),0) AS revenue,COUNT(*) AS appointments
  FROM appointments WHERE ${where} AND status='completed'
  AND COALESCE(completed_at,updated_at) >= (date_trunc('month', now() AT TIME ZONE 'Asia/Ho_Chi_Minh') - interval '5 months') AT TIME ZONE 'Asia/Ho_Chi_Minh'
  AND COALESCE(completed_at,updated_at) < (date_trunc('month', now() AT TIME ZONE 'Asia/Ho_Chi_Minh') + interval '1 month') AT TIME ZONE 'Asia/Ho_Chi_Minh'
  GROUP BY to_char(COALESCE(completed_at,updated_at) AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM') ORDER BY month ASC`,params);
 const recentCompleted=await rows<any>(`SELECT a.id,a.starts_at,COALESCE(a.completed_at,a.updated_at) AS completed_at,
  a.price_snapshot,u.full_name AS customer_name,p.name AS pet_name,COALESCE(bundle.names,s.name) AS service_name
  FROM appointments a JOIN users u ON u.id=a.customer_id JOIN pets p ON p.id=a.pet_id JOIN services s ON s.id=a.service_id
  LEFT JOIN LATERAL (SELECT string_agg(COALESCE(aps.name_snapshot,svc.name),' + ' ORDER BY aps.position) AS names FROM appointment_services aps JOIN services svc ON svc.id=aps.service_id WHERE aps.appointment_id=a.id) bundle ON TRUE
  WHERE a.organization_id=? ${staff?'AND a.staff_id=?':''} AND a.status='completed'
  ORDER BY COALESCE(a.completed_at,a.updated_at) DESC,a.id DESC LIMIT 5`,params);
 const statuses=await rows<any>(`SELECT status,COUNT(*) AS value FROM appointments WHERE ${where} GROUP BY status`,params);
 res.json({stats:{customers:customers.value,pets:pets.value,appointments:totals.appointments,completed:totals.completed,revenue:totals.revenue,collected:finance.collected,unpaid:finance.unpaid,awaiting_payment:finance.awaiting_payment,pending_review:finance.pending_review,refund_required:finance.refund_required,refunded:finance.refunded},recent:recent.map(a=>({...a,starts_at:isoUTC(a.starts_at)})),recent_completed:recentCompleted.map(a=>({...a,starts_at:isoUTC(a.starts_at),completed_at:isoUTC(a.completed_at)})),series,statuses});
}));
export default router;
