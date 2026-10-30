import {Router} from 'express';
import {rows} from '../lib/db.js';
import {isoUTC} from '../lib/scheduling.js';
import {asyncRoute,HttpError,idParam,pageParams} from '../lib/http.js';
import {orgId,requireAuth,requireRole} from '../lib/auth.js';
const router=Router();router.use(requireAuth);
router.get('/customers',requireRole('admin','staff'),asyncRoute(async(req,res)=>{
 const org=orgId(req),{page,limit}=pageParams(req);const q=`%${String(req.query.search||'').slice(0,90)}%`;
 const condition=`FROM users u WHERE EXISTS(SELECT 1 FROM appointments a WHERE a.customer_id=u.id AND a.organization_id=? ${req.user!.role==='staff'?'AND a.staff_id=?':''})
  AND (u.full_name ILIKE ? OR u.email ILIKE ? OR u.phone ILIKE ?)`;
 const scope=req.user!.role==='staff'?[org,req.user!.id]:[org];
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
  WHERE u.id=? AND EXISTS(SELECT 1 FROM appointments a WHERE a.customer_id=u.id AND a.organization_id=? ${req.user!.role==='staff'?'AND a.staff_id=?':''})`,[id,org,...(req.user!.role==='staff'?[req.user!.id]:[])]);
 if(!customer)throw new HttpError(404,'Không tìm thấy khách hàng tại cửa hàng này');
 const pets=await rows('SELECT p.* FROM pets p WHERE p.owner_id=? AND EXISTS (SELECT 1 FROM appointments a WHERE a.pet_id=p.id AND a.organization_id=? ${req.user!.role==='staff'?'AND a.staff_id=?':''})',[id,org,...(req.user!.role==='staff'?[req.user!.id]:[])]);res.json({customer,pets});
}));
router.get('/dashboard',asyncRoute(async(req,res)=>{
 const id=req.user!.id,role=req.user!.role;
 if(role==='customer'){
  const [[pets],[upcoming],[total]]=await Promise.all([
   rows<any>('SELECT COUNT(*) AS value FROM pets WHERE owner_id=?',[id]),
   rows<any>("SELECT COUNT(*) AS value FROM appointments WHERE customer_id=? AND organization_id=? AND status IN('pending','confirmed','in_progress') AND starts_at>=now()",[id,req.user!.organization_id??0]),
   rows<any>('SELECT COUNT(*) AS value FROM appointments WHERE customer_id=? AND organization_id=?',[id,req.user!.organization_id??0])
  ]);
  const recent=await rows<any>(`SELECT a.id,a.status,a.starts_at,p.name AS pet_name,s.name AS service_name FROM appointments a JOIN pets p ON a.pet_id=p.id JOIN services s ON a.service_id=s.id WHERE a.customer_id=? AND a.organization_id=? ORDER BY a.starts_at DESC LIMIT 5`,[id,req.user!.organization_id??0]);
  res.json({stats:{pets:pets.value,upcoming:upcoming.value,appointments:total.value},recent:recent.map(a=>({...a,starts_at:isoUTC(a.starts_at)}))});return;
 }
 const org=orgId(req),staff=role==='staff';
 const params=staff?[org,id]:[org];
 const where=staff?'organization_id=? AND staff_id=?':'organization_id=?';
 const [[customers],[pets],[appointments],[revenue]]=await Promise.all([
  rows<any>('SELECT COUNT(DISTINCT customer_id) AS value FROM appointments WHERE organization_id=?',[org]),
  rows<any>('SELECT COUNT(DISTINCT pet_id) AS value FROM appointments WHERE organization_id=?',[org]),
  rows<any>(`SELECT COUNT(*) AS value FROM appointments WHERE ${where}`,params),
  rows<any>(`SELECT COALESCE(SUM(price_snapshot),0) AS value FROM appointments WHERE ${where} AND status='completed'`,params)
 ]);
 const recent=await rows<any>(`SELECT a.id,a.status,a.starts_at,u.full_name AS customer_name,p.name AS pet_name,s.name AS service_name,a.price_snapshot
  FROM appointments a JOIN users u ON u.id=a.customer_id JOIN pets p ON p.id=a.pet_id JOIN services s ON s.id=a.service_id
  WHERE a.organization_id=? ${staff?'AND a.staff_id=?':''} ORDER BY a.starts_at DESC LIMIT 7`,params);
 const series=await rows<any>(`SELECT to_char(starts_at AT TIME ZONE 'UTC', 'YYYY-MM') AS month,COALESCE(SUM(price_snapshot),0) AS revenue,COUNT(*) AS appointments
  FROM appointments WHERE ${where} AND status='completed' AND starts_at>=(now() - interval '6 months')
  GROUP BY to_char(starts_at AT TIME ZONE 'UTC', 'YYYY-MM') ORDER BY month ASC`,params);
 const statuses=await rows<any>(`SELECT status,COUNT(*) AS value FROM appointments WHERE ${where} GROUP BY status`,params);
 res.json({stats:{customers:customers.value,pets:pets.value,appointments:appointments.value,revenue:revenue.value},recent:recent.map(a=>({...a,starts_at:isoUTC(a.starts_at)})),series,statuses});
}));
export default router;
