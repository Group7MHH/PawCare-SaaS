import {useState} from 'react';
import {Link} from 'react-router-dom';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {toast} from 'react-hot-toast';
import {api,errorMessage,json,type Appointment} from '../lib/api';
import {Badge,Loading,ErrorNotice,Empty} from '../components/UI';
import {ArrowRight,ArrowUpRight,CalendarCheck2,CalendarDays,Check,CheckCircle2,ChevronRight,ClipboardCheck,Clock3,HandHeart,Inbox,PlayCircle,Sparkles} from 'lucide-react';

const dayLabel=(iso:string)=>new Date(iso).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',timeZone:'Asia/Ho_Chi_Minh'});
const timeLabel=(iso:string)=>new Date(iso).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Ho_Chi_Minh'});
function sameLocalDay(iso:string){const fmt=(v:Date)=>v.toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'});return fmt(new Date(iso))===fmt(new Date());}
export function StaffDashboard(){
 const qc=useQueryClient();
 const [tab,setTab]=useState<'waiting'|'mine'>('waiting');
 const q=useQuery({queryKey:['staff-work'],queryFn:()=>api<{items:Appointment[];total:number}>('/appointments?limit=50'),refetchInterval:15000});
 const pool=useQuery({queryKey:['staff-pool'],queryFn:()=>api<{items:Appointment[];total:number}>('/appointments?pool=true&limit=5'),refetchInterval:30000});
 const accept=useMutation({mutationFn:(id:number)=>api<{message:string}>(`/appointments/${id}/accept`,json('POST',{})),onSuccess:result=>{qc.invalidateQueries({queryKey:['staff-work']});qc.invalidateQueries({queryKey:['staff-pool']});qc.invalidateQueries({queryKey:['admin-appointments']});qc.invalidateQueries({queryKey:['dashboard']});toast.success(result.message||'Đã nhận lịch thành công');},onError:(e)=>toast.error(errorMessage(e))});
 if(q.isLoading)return <Loading/>;
 if(q.error||!q.data)return <ErrorNotice message="Không thể tải lịch được phân công"/>;
 const items=q.data.items;
 const active=items.filter(x=>['pending','confirmed','in_progress'].includes(x.status));
 const inProgress=items.filter(x=>x.status==='in_progress').length;
 const upcoming=active.filter(x=>new Date(x.starts_at).getTime()>=Date.now()).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
 const today=active.filter(x=>sameLocalDay(x.starts_at)).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
 const schedule=today.length?today:upcoming.slice(0,4);
 const queue=pool.data?.items||[];
 const shown=tab==='waiting'?queue:upcoming.slice(0,5);
 return <div className="nb-dashboard nb-staff-dashboard">
  <header className="nb-staff-header nb-enter"><div className="nb-staff-header-copy"><span className="nb-overline"><span className="nb-overline-dot"/> SỔ TRỰC · HÔM NAY</span><h1>Cùng nhau chăm sóc<br/><em>những người bạn nhỏ.</em></h1><p>Nhận lịch phù hợp, theo dõi công việc và lưu lại từng lần chăm sóc tận tâm.</p><Link className="nb-action-primary" to="/staff/appointments">Mở bàn công việc <ArrowUpRight size={18}/></Link></div><div className="nb-staff-header-art" aria-hidden="true"><div className="nb-staff-art-back"><HandHeart size={96} strokeWidth={1.25}/></div><span className="nb-staff-art-label"><Sparkles size={16}/> MADE WITH CARE</span></div></header>
  <div className="nb-staff-figures nb-enter" aria-label="Tổng quan công việc"><div><span className="nb-staff-num-icon"><ClipboardCheck size={19}/></span><strong>{q.data.total}</strong><small>Lịch của tôi</small></div><div><span className="nb-staff-num-icon amber"><Inbox size={19}/></span><strong>{pool.data?.total||0}</strong><small>Chờ nhận</small></div><div><span className="nb-staff-num-icon blue"><CalendarDays size={19}/></span><strong>{upcoming.length}</strong><small>Sắp tới</small></div><div><span className="nb-staff-num-icon green"><PlayCircle size={19}/></span><strong>{inProgress}</strong><small>Đang chăm sóc</small></div></div>
  <div className="nb-staff-workspace">
   <section className="nb-paper-panel nb-staff-inbox nb-enter"><div className="nb-section-heading"><div><span className="nb-section-kicker">01 / HÀNG ĐỢI</span><h2>Hộp thư công việc</h2><p>Chọn một lịch để nhận và chăm sóc bé.</p></div><Link className="nb-section-link" to="/staff/appointments">Tất cả <ArrowUpRight size={16}/></Link></div>
    <div className="nb-staff-tabs" role="group" aria-label="Lọc danh sách công việc"><button type="button" className={tab==='waiting'?'selected':''} aria-pressed={tab==='waiting'} onClick={()=>setTab('waiting')}>Chờ nhận <span>{pool.data?.total||0}</span></button><button type="button" className={tab==='mine'?'selected':''} aria-pressed={tab==='mine'} onClick={()=>setTab('mine')}>Lịch sắp tới <span>{upcoming.length}</span></button></div>
    {tab==='waiting'&&pool.isLoading?<Loading/>:tab==='waiting'&&pool.error?<ErrorNotice message="Không thể tải hàng đợi chung"/>:!shown.length?<Empty title={tab==='waiting'?'Hàng đợi đang trống':'Không có lịch sắp tới'} description={tab==='waiting'?'Lịch chưa được nhận sẽ xuất hiện tại đây.':'Những lịch mới sẽ xuất hiện khi bạn nhận công việc.'}/>:<div className="nb-staff-queue" aria-live="polite">{shown.map((a,index)=><article className="nb-staff-task" key={a.id} style={{animationDelay:`${index*55}ms`}}><span className="nb-task-date"><strong>{timeLabel(a.starts_at)}</strong><small>{dayLabel(a.starts_at)}</small></span><div className="nb-task-details"><span className="nb-task-eyebrow">LỊCH #{String(a.id).padStart(4,'0')} <span className="nb-task-dot"/> {a.pet_name}</span><h3>{a.service_name}</h3><p>{a.customer_name} · {a.duration_minutes_snapshot??a.duration_minutes??Math.max(0,Math.round((new Date(a.ends_at).getTime()-new Date(a.starts_at).getTime())/60000))} phút</p></div><div className="nb-task-action">{tab==='waiting'?<button className="nb-task-accept" type="button" disabled={accept.isPending} onClick={()=>accept.mutate(a.id)} aria-label={`Nhận lịch ${a.service_name} cho ${a.pet_name}`}>{accept.isPending&&accept.variables===a.id?'Đang nhận...':<>Nhận lịch <Check size={16}/></>}</button>:<><Badge status={a.status}/><Link to="/staff/appointments" aria-label={`Xem lịch ${a.service_name}`} className="nb-task-arrow"><ChevronRight size={19}/></Link></>}</div></article>)}</div>}
    <div className="nb-queue-foot"><span><CheckCircle2 size={16}/> Chỉ nhận những lịch bạn có thể thực hiện đúng giờ.</span><Link to="/staff/appointments">Xem toàn bộ <ArrowRight size={15}/></Link></div>
   </section>
   <aside className="nb-staff-schedule nb-enter"><div className="nb-staff-schedule-head"><span className="nb-section-kicker">02 / THỜI GIAN</span><h2>{today.length?'Lịch làm việc hôm nay':'Lịch sắp tới'}</h2><p>{new Date().toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'long',timeZone:'Asia/Ho_Chi_Minh'})}</p></div><div className="nb-staff-timeline">{!schedule.length?<div className="nb-schedule-empty"><CalendarCheck2 size={35}/><strong>Chưa có lịch cần xử lý</strong><span>Bạn có thể nhận thêm lịch từ hàng đợi.</span></div>:schedule.map((a,index)=><Link className="nb-schedule-slot" key={a.id} to="/staff/appointments"><div className="nb-slot-time"><strong>{timeLabel(a.starts_at)}</strong><small>{dayLabel(a.starts_at)}</small></div><span className={`nb-slot-point ${index===0?'first':''}`}/><div className="nb-slot-detail"><strong>{a.pet_name}</strong><span>{a.service_name}</span><small>{a.status==='in_progress'?'Đang chăm sóc':a.status==='pending'?'Chờ xác nhận':'Đã xác nhận'}</small></div><ArrowUpRight size={15}/></Link>)}</div><div className="nb-schedule-foot"><Clock3 size={16}/> Mỗi lịch một bước chăm sóc trọn vẹn.</div></aside>
  </div>
  <div className="nb-staff-bottom-note nb-enter"><div className="nb-note-mark"><HandHeart size={23}/></div><div><strong>Trách nhiệm bắt đầu từ một lần nhận lịch.</strong><p>Thay đổi trạng thái và lưu kết quả chăm sóc tại trang Lịch được giao. Những lịch khách chọn Staff riêng chỉ hiển thị cho đúng người.</p></div><Link to="/staff/appointments">Quản lý lịch <ArrowUpRight size={17}/></Link></div>
 </div>;
}
