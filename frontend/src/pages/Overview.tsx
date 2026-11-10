import {useQuery} from '@tanstack/react-query';
import {Link,useNavigate} from 'react-router-dom';
import {ArrowRight,CalendarDays,CalendarPlus,ChevronRight,Clock3,HeartPulse,PawPrint,Plus,ShieldCheck} from 'lucide-react';
import {api,speciesName,type Pet,type Stats} from '../lib/api';
import {useAuth} from '../lib/auth';
import {PetAvatar} from '../components/PetAvatar';
import {PageTitle,Panel,Metric,Loading,Empty,Badge,ErrorNotice} from '../components/UI';
const VN='Asia/Ho_Chi_Minh';
function greeting(){const h=new Date().getHours();return h<11?'Chào buổi sáng':h<14?'Chào buổi trưa':h<18?'Chào buổi chiều':'Chào buổi tối';}
const dayOf=(iso:string)=>new Date(iso).toLocaleDateString('vi-VN',{day:'2-digit',timeZone:VN});
const monthOf=(iso:string)=>new Date(iso).toLocaleDateString('vi-VN',{month:'short',timeZone:VN});
const timeOf=(iso:string)=>new Date(iso).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit',timeZone:VN});
const dateTimeVN=(iso:string)=>new Date(iso).toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:VN});
export function Overview(){
 const {user}=useAuth(),nav=useNavigate();
 const pets=useQuery({queryKey:['pets'],queryFn:()=>api<{items:Pet[]}>('/pets')});
 const stats=useQuery({queryKey:['dashboard'],queryFn:()=>api<Stats>('/dashboard'),refetchInterval:15000,refetchOnWindowFocus:'always',staleTime:0});
 if(pets.isLoading||stats.isLoading)return <Loading/>;
 if(pets.error||stats.error)return <ErrorNotice message="Không thể tải trang tổng quan. Vui lòng kiểm tra kết nối."/>;
 const list=pets.data?.items||[];const dashboard=stats.data;
 const recent=dashboard?.recent||[];
 const next=recent.filter(a=>['pending','confirmed','in_progress'].includes(a.status)&&(a.status==='in_progress'||new Date(a.starts_at).getTime()>=Date.now())).sort((a,b)=>String(a.starts_at).localeCompare(String(b.starts_at)))[0];
 const firstName=user?.full_name.split(' ').slice(-1)[0]||'';
 return <>
  <PageTitle eyebrow="TỔNG QUAN CÁ NHÂN" title={`${greeting()}, ${firstName}!`} description="Theo dõi hồ sơ và lịch chăm sóc của các bé cưng trong một nơi." action={<button type="button" className="button button-primary" onClick={()=>nav('/book')}><CalendarPlus size={17}/> Đặt lịch chăm sóc</button>}/>
  <div className="metrics-grid three"><Metric icon={<PawPrint/>} title="Bé cưng của tôi" value={dashboard?.stats.pets||0} foot="Hồ sơ thú cưng"/><Metric icon={<CalendarDays/>} title="Lịch sắp tới" value={dashboard?.stats.upcoming||0} foot="Đang chờ chăm sóc" tone="blue"/><Metric icon={<HeartPulse/>} title="Tổng lịch hẹn" value={dashboard?.stats.appointments||0} foot="Đã tạo trên PawCare" tone="amber"/></div>
  <section className="pc-next-visit" aria-label="Lịch hẹn gần nhất">
   {next?<>
    <div className="pc-next-date" aria-hidden="true"><strong>{dayOf(next.starts_at)}</strong><span>{monthOf(next.starts_at)}</span></div>
    <div className="pc-next-body"><small>Lịch hẹn gần nhất</small><h3>{next.service_name}</h3><p><PawPrint size={15}/> {next.pet_name}<span className="dot-sep"/><Clock3 size={15}/> {timeOf(next.starts_at)}</p></div>
    <div className="pc-next-side"><Badge status={next.status}/><Link className="text-link" to="/my-appointments">Xem chi tiết <ChevronRight size={15}/></Link></div>
   </>:<>
    <div className="pc-next-date empty" aria-hidden="true"><CalendarDays size={26}/></div>
    <div className="pc-next-body"><small>Lịch hẹn gần nhất</small><h3>Chưa có lịch sắp tới</h3><p>Đặt lịch để PawCare chăm sóc bé trong thời gian tới.</p></div>
    <div className="pc-next-side"><button type="button" className="button button-secondary" onClick={()=>nav('/book')}>Đặt lịch ngay <ArrowRight size={16}/></button></div>
   </>}
  </section>
  <div className="content-grid">
   <Panel title="Sổ khám thú cưng" sub="Hồ sơ các bé trong gia đình" action={<Link className="text-link" to="/pets">Xem tất cả <ChevronRight size={16}/></Link>}>
    {!list.length?<Empty title="Chưa có thú cưng" description="Hãy thêm hồ sơ đầu tiên cho bé yêu." action={<Link className="button button-primary" to="/pets"><Plus size={16}/> Thêm thú cưng</Link>}/>:
    <div className="pet-card-grid small">{list.slice(0,3).map(p=><Link to={`/pets/${p.id}`} className="pet-mini" key={p.id}><span className="pet-emoji"><PetAvatar species={p.species} size={24}/></span><div><strong>{p.name}</strong><small>{p.breed||'Chưa xác định giống'}</small><span className="mini-tag">{speciesName(p.species)}{typeof p.record_count==='number'?` · ${p.record_count} hồ sơ`:''}</span></div><ArrowRight size={16}/></Link>)}</div>}
   </Panel>
   <Panel title="Gợi ý chăm sóc" sub="Kiến thức tham khảo, không phải lịch nhắc cá nhân"><div className="tip-list"><div><span className="tip-icon green"><HeartPulse size={18}/></span><span><strong>Kiểm tra sức khỏe định kỳ</strong><small>Khám tổng quát giúp bé luôn khỏe mạnh.</small></span></div><div><span className="tip-icon amber"><ShieldCheck size={18}/></span><span><strong>Đừng quên tiêm phòng</strong><small>Theo dõi các mũi tiêm trong hồ sơ chăm sóc.</small></span></div><div><span className="tip-icon blue"><CalendarDays size={18}/></span><span><strong>Spa đều đặn cho bé</strong><small>Giữ lông sạch, da khỏe và tinh thần vui.</small></span></div></div></Panel>
  </div>
  <div className="content-grid bottom-grid">
   <Panel title="Hành trình chăm sóc gần đây" action={<Link className="text-link" to="/my-appointments">Xem lịch hẹn <ChevronRight size={16}/></Link>}>
    {!recent.length?<Empty title="Chưa có lịch hẹn" description="Đặt lịch đầu tiên để PawCare chăm sóc bé."/>:
    <div className="activity-list">{recent.map(a=><div key={a.id} className="activity-row"><span className="activity-symbol"><CalendarDays size={19}/></span><span><strong>{a.service_name} · {a.pet_name}</strong><small>{dateTimeVN(a.starts_at)}</small></span><Badge status={a.status}/></div>)}</div>}
   </Panel>
   <Panel title="Thao tác nhanh"><div className="quick-actions"><button type="button" onClick={()=>nav('/pets')}><PawPrint size={19}/> Quản lý thú cưng <ArrowRight size={17}/></button><button type="button" onClick={()=>nav('/book')}><CalendarPlus size={19}/> Đặt lịch mới <ArrowRight size={17}/></button><button type="button" onClick={()=>nav('/my-appointments')}><CalendarDays size={19}/> Theo dõi lịch hẹn <ArrowRight size={17}/></button></div></Panel>
  </div>
 </>;
}
