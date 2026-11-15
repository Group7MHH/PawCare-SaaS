import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {api,type Appointment} from '../lib/api';
import {Badge,Loading,ErrorNotice,Empty} from '../components/UI';
import {StaffCareDesk,PawcareMark} from '../components/BrandArtwork';
import {ArrowRight,ArrowUpRight,CalendarCheck2,ChevronRight,Clock3,HandHeart} from 'lucide-react';

const dayLabel=(iso:string)=>new Date(iso).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',timeZone:'Asia/Ho_Chi_Minh'});
const timeLabel=(iso:string)=>new Date(iso).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Ho_Chi_Minh'});
function sameLocalDay(iso:string){const fmt=(v:Date)=>v.toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'});return fmt(new Date(iso))===fmt(new Date());}

export function StaffDashboard(){
 const q=useQuery({queryKey:['staff-work'],queryFn:()=>api<{items:Appointment[];total:number}>('/appointments?limit=50'),refetchInterval:15000});
 if(q.isLoading)return <Loading/>;
 if(q.error||!q.data)return <ErrorNotice message="Không thể tải lịch được phân công"/>;
 const items=q.data.items;
 const active=items.filter(x=>['pending','confirmed','in_progress'].includes(x.status));
 const pending=items.filter(x=>x.status==='pending');
 const inProgress=items.filter(x=>x.status==='in_progress').length;
 const upcoming=active.filter(x=>new Date(x.starts_at).getTime()>=Date.now()).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
 const today=active.filter(x=>sameLocalDay(x.starts_at)).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
 const schedule=today.length?today:upcoming.slice(0,4);
 const shown=upcoming.slice(0,5);
 return <div className="nb-dashboard nb-staff-dashboard">
  <header className="nb-staff-header nb-enter"><div className="nb-staff-header-copy"><span className="nb-overline"><span className="nb-overline-dot"/> SỔ TRỰC · HÔM NAY</span><h1>Cùng nhau chăm sóc<br/><em>những người bạn nhỏ.</em></h1><p>Admin phân công lịch; bạn tiếp nhận, chăm sóc và ghi kết quả cho thú cưng.</p><Link className="nb-action-primary" to="/staff/appointments">Mở bàn công việc <ArrowUpRight size={18}/></Link></div><div className="nb-staff-header-art nb-care-illustration" aria-hidden="true"><StaffCareDesk/><span className="nb-staff-art-label"><PawcareMark size={15}/> MADE WITH CARE</span></div></header>
  <div className="nb-staff-figures nb-enter" aria-label="Tổng quan công việc"><div><span className="nb-staff-num-index">01</span><strong>{q.data.total}</strong><small>Lịch của tôi</small></div><div><span className="nb-staff-num-index amber">02</span><strong>{pending.length}</strong><small>Chờ xác nhận</small></div><div><span className="nb-staff-num-index blue">03</span><strong>{upcoming.length}</strong><small>Sắp tới</small></div><div><span className="nb-staff-num-index green">04</span><strong>{inProgress}</strong><small>Đang chăm sóc</small></div></div>
  <div className="nb-staff-workspace">
   <section className="nb-paper-panel nb-staff-inbox nb-enter"><div className="nb-section-heading"><div><span className="nb-section-kicker">01 / CÔNG VIỆC</span><h2>Lịch Admin đã giao</h2><p>Nhấn vào lịch được giao để tiếp nhận hoặc cập nhật tiến độ chăm sóc.</p></div><Link className="nb-section-link" to="/staff/appointments">Tất cả <ArrowUpRight size={16}/></Link></div>
    {!shown.length?<Empty title="Chưa có lịch sắp tới" description="Các lịch do Admin phân công sẽ xuất hiện tại đây."/>:<div className="nb-staff-queue" aria-live="polite">{shown.map((a,index)=><article className="nb-staff-task" key={a.id} style={{animationDelay:`${index*55}ms`}}><span className="nb-task-date"><strong>{timeLabel(a.starts_at)}</strong><small>{dayLabel(a.starts_at)}</small></span><div className="nb-task-details"><span className="nb-task-eyebrow">LỊCH #{String(a.id).padStart(4,'0')} <span className="nb-task-dot"/> {a.pet_name}</span><h3>{a.service_name}</h3><span className={`pc-staff-pay-tag pc-staff-pay-tag--${a.payment_status||'unpaid'}`}>{a.payment_status==='paid'?'Đã thanh toán':a.payment_status==='awaiting_payment'?'Chờ thanh toán':a.payment_status==='pending_review'?'Chờ Admin xác nhận':a.payment_status==='refunded'?'Đã hoàn tiền':a.payment_status==='refund_required'?'Cần hoàn tiền':'Chưa thanh toán'}</span><p>{a.customer_name} · {a.duration_minutes_snapshot??a.duration_minutes??Math.max(0,Math.round((new Date(a.ends_at).getTime()-new Date(a.starts_at).getTime())/60000))} phút</p></div><div className="nb-task-action"><Badge status={a.status}/><Link to="/staff/appointments" aria-label={`Xem lịch ${a.service_name}`} className="nb-task-arrow"><ChevronRight size={19}/></Link></div></article>)}</div>}
    <div className="nb-queue-foot"><span><CalendarCheck2 size={16}/> Staff chỉ tiếp nhận lịch do Admin chỉ định.</span><Link to="/staff/appointments">Xem toàn bộ <ArrowRight size={15}/></Link></div>
   </section>
   <aside className="nb-staff-schedule nb-enter"><div className="nb-staff-schedule-head"><span className="nb-section-kicker">02 / THỜI GIAN</span><h2>{today.length?'Lịch làm việc hôm nay':'Lịch sắp tới'}</h2><p>{new Date().toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'long',timeZone:'Asia/Ho_Chi_Minh'})}</p></div><div className="nb-staff-timeline">{!schedule.length?<div className="nb-schedule-empty"><CalendarCheck2 size={35}/><strong>Chưa có lịch cần xử lý</strong><span>Admin sẽ phân công công việc phù hợp cho bạn.</span></div>:schedule.map((a,index)=><Link className="nb-schedule-slot" key={a.id} to="/staff/appointments"><div className="nb-slot-time"><strong>{timeLabel(a.starts_at)}</strong><small>{dayLabel(a.starts_at)}</small></div><span className={`nb-slot-point ${index===0?'first':''}`}/><div className="nb-slot-detail"><strong>{a.pet_name}</strong><span>{a.service_name}</span><small>{a.status==='in_progress'?'Đang chăm sóc':a.status==='pending'?'Chờ bạn tiếp nhận':'Đã xác nhận'}</small></div><ArrowUpRight size={15}/></Link>)}</div><div className="nb-schedule-foot"><Clock3 size={16}/> Mỗi lịch một bước chăm sóc trọn vẹn.</div></aside>
  </div>
  <div className="nb-staff-bottom-note nb-enter"><div className="nb-note-mark"><HandHeart size={23}/></div><div><strong>Trách nhiệm bắt đầu từ một lần tiếp nhận.</strong><p>Admin phân công lịch, bạn tiếp nhận, cập nhật trạng thái và lưu kết quả chăm sóc tại trang Lịch được giao.</p></div><Link to="/staff/appointments">Quản lý lịch <ArrowUpRight size={17}/></Link></div>
 </div>;
}
