import {useQuery} from '@tanstack/react-query';
import {Link,useNavigate} from 'react-router-dom';
import {ArrowRight,ArrowUpRight,BookHeart,CalendarDays,CalendarPlus,Cat,ChevronRight,Clock3,Dog,Heart,HeartPulse,PawPrint,Plus,Sparkles} from 'lucide-react';
import {api,speciesName,type Pet,type Stats} from '../lib/api';
import {useAuth} from '../lib/auth';
import {PetAvatar} from '../components/PetAvatar';
import {Loading,Empty,Badge,ErrorNotice} from '../components/UI';

const VN='Asia/Ho_Chi_Minh';
function greeting(){const h=Number(new Intl.DateTimeFormat('vi-VN',{hour:'numeric',hourCycle:'h23',timeZone:VN}).format(new Date()));return h<11?'Chào buổi sáng':h<14?'Chào buổi trưa':h<18?'Chào buổi chiều':'Chào buổi tối';}
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
 const list=pets.data?.items||[],dashboard=stats.data,recent=dashboard?.recent||[];
 const next=recent.filter(a=>['pending','confirmed','in_progress'].includes(a.status)&&(a.status==='in_progress'||new Date(a.starts_at).getTime()>=Date.now())).sort((a,b)=>String(a.starts_at).localeCompare(String(b.starts_at)))[0];
 const firstName=user?.full_name.split(' ').slice(-1)[0]||'bạn';
 return <div className="nb-dashboard nb-customer-dashboard">
  <div className="nb-intro nb-enter"><div><span className="nb-overline"><span className="nb-overline-dot"/> TRANG 01 · HỒ SƠ CÁ NHÂN</span><h1>{greeting()}, {firstName}<span className="nb-hello-mark">.</span></h1><p>Những điều tốt đẹp bắt đầu từ việc chăm sóc bé mỗi ngày.</p></div><span className="nb-date-stamp"><BookHeart size={17}/> SỔ TAY PAWCARE</span></div>
  <section className="nb-customer-cover nb-enter" aria-label="Bắt đầu chăm sóc thú cưng">
   <div className="nb-cover-copy"><div className="nb-cover-label"><span className="nb-cover-label-mark"><PawPrint size={15}/></span> YOUR PET, OUR STORY <span className="nb-cover-line"/></div><h2>Mỗi dấu chân,<br/><em>một câu chuyện.</em></h2><p>Lưu giữ hồ sơ chăm sóc, theo dõi hành trình và đặt những buổi hẹn trọn vẹn cho bạn nhỏ bốn chân.</p><div className="nb-cover-buttons"><Link to="/book" className="nb-action-primary"><CalendarPlus size={18}/> Đặt lịch chăm sóc <ArrowUpRight size={17}/></Link><Link to="/pets" className="nb-action-quiet">Mở sổ thú cưng <ArrowRight size={17}/></Link></div><div className="nb-cover-foot"><span className="nb-cover-foot-line"/><span>PAWCARE · THE CARE EDITION</span></div></div>
   <div className="nb-cover-art" aria-hidden="true"><div className="nb-orbit nb-orbit-one"/><div className="nb-orbit nb-orbit-two"/><div className="nb-cover-pet nb-cover-dog"><span className="nb-pet-print"><Dog size={102} strokeWidth={1.15}/></span><small>01 / FRIENDS</small></div><div className="nb-cover-pet nb-cover-cat"><Cat size={72} strokeWidth={1.25}/></div><div className="nb-art-sticker"><Heart size={16} fill="currentColor"/> LITTLE JOYS</div><Sparkles className="nb-cover-sparkle" size={36} strokeWidth={1.1}/></div>
  </section>
  <div className="nb-index-strip nb-enter" aria-label="Số liệu của tôi"><span><PawPrint size={16}/> <strong>{dashboard?.stats.pets||0}</strong> hồ sơ thú cưng</span><span><CalendarDays size={16}/> <strong>{dashboard?.stats.upcoming||0}</strong> lịch sắp tới</span><span><HeartPulse size={16}/> <strong>{dashboard?.stats.appointments||0}</strong> lượt đặt chăm sóc</span><Link to="/my-appointments">Xem hành trình <ArrowUpRight size={16}/></Link></div>
  <div className="nb-customer-layout">
   <section className="nb-paper-panel nb-pet-album nb-enter"><div className="nb-section-heading"><div><span className="nb-section-kicker">01 / HỒ SƠ</span><h2>Gia đình nhỏ của bạn</h2><p>Mỗi bạn nhỏ đều có một cuốn sổ riêng.</p></div><Link className="nb-section-link" to="/pets">Xem tất cả <ArrowUpRight size={16}/></Link></div>
    {!list.length?<Empty title="Chưa có thú cưng" description="Hãy thêm người bạn đầu tiên vào sổ chăm sóc." action={<Link className="button button-primary" to="/pets"><Plus size={16}/> Thêm thú cưng</Link>}/>:<div className="nb-pet-album-grid">{list.slice(0,3).map((p,index)=><Link to={`/pets/${p.id}`} key={p.id} className={`nb-pet-polaroid nb-polaroid-${index%3}`}><span className="nb-pet-polaroid-portrait"><span className="nb-pet-photo-ornament"/><PetAvatar species={p.species} size={60}/></span><span className="nb-pet-polaroid-body"><strong>{p.name}</strong><small>{p.breed||speciesName(p.species)}</small><span>{typeof p.record_count==='number'?`${p.record_count} lần chăm sóc`:'Mở hồ sơ'} <ArrowUpRight size={14}/></span></span></Link>)}</div>}
    <button type="button" className="nb-add-pet" onClick={()=>nav('/pets')}><Plus size={17}/> Thêm hoặc cập nhật hồ sơ <ChevronRight size={16}/></button>
   </section>
   <section className="nb-paper-panel nb-appointment-section nb-enter"><div className="nb-section-heading"><div><span className="nb-section-kicker">02 / LỊCH HẸN</span><h2>Lịch sắp tới</h2><p>Một tấm vé cho mỗi lần chăm sóc.</p></div><Link className="nb-section-link" to="/my-appointments">Tất cả <ArrowUpRight size={16}/></Link></div>
    {next?<details className="nb-ticket" open><summary className="nb-ticket-summary"><span className="nb-ticket-date"><strong>{dayOf(next.starts_at)}</strong><small>{monthOf(next.starts_at)}</small></span><span className="nb-ticket-primary"><small>CUỘC HẸN TIẾP THEO</small><strong>{next.service_name}</strong><span>{next.pet_name} · {timeOf(next.starts_at)}</span></span><ChevronRight className="nb-ticket-chevron" size={20}/></summary><div className="nb-ticket-details"><Badge status={next.status}/><span><Clock3 size={15}/> {dateTimeVN(next.starts_at)}</span><Link to="/my-appointments">Mở chi tiết <ArrowUpRight size={15}/></Link></div></details>:<div className="nb-ticket-empty"><CalendarDays size={29}/><strong>Chưa có buổi hẹn nào sắp tới</strong><span>Cuốn sổ đang chờ trang đầu tiên.</span><Link to="/book">Đặt lịch ngay <ArrowRight size={16}/></Link></div>}
    <div className="nb-care-note"><div className="nb-care-note-icon"><Heart size={22}/></div><div><strong>Một chút yêu thương mỗi ngày</strong><p>Hãy dành thời gian chơi đùa, vận động và quan sát thay đổi sức khỏe của bé.</p><small>Lời khuyên chung · Không phải nhắc lịch y tế cá nhân</small></div></div>
   </section>
  </div>
  <div className="nb-customer-bottom">
   <section className="nb-paper-panel nb-journey nb-enter"><div className="nb-section-heading"><div><span className="nb-section-kicker">03 / NHẬT KÝ</span><h2>Những trang vừa viết</h2><p>Lịch sử chăm sóc từ các cuộc hẹn thực tế.</p></div><Link className="nb-section-link" to="/my-appointments">Xem lịch sử <ArrowUpRight size={16}/></Link></div>{!recent.length?<Empty title="Chưa có hoạt động" description="Nhật ký sẽ xuất hiện khi bạn đặt lịch chăm sóc."/>:<div className="nb-timeline">{recent.slice(0,5).map((a,index)=><div className="nb-timeline-item" key={a.id}><div className={`nb-timeline-marker ${index===0?'latest':''}`}><CalendarDays size={17}/></div><div className="nb-timeline-main"><strong>{a.service_name}</strong><small>{a.pet_name} · {dateTimeVN(a.starts_at)}</small></div><Badge status={a.status}/></div>)}</div>}</section>
   <aside className="nb-quick-notes nb-enter"><div className="nb-quick-deco"><PawPrint size={32} strokeWidth={1.1}/></div><span className="nb-section-kicker">LỐI TẮT</span><h2>Hôm nay, bạn muốn làm gì?</h2><div className="nb-quick-list"><Link to="/book"><CalendarPlus size={19}/> Đặt một lịch mới <ArrowRight size={16}/></Link><Link to="/pets"><PawPrint size={19}/> Cập nhật sổ thú cưng <ArrowRight size={16}/></Link><Link to="/my-appointments"><CalendarDays size={19}/> Xem lại các cuộc hẹn <ArrowRight size={16}/></Link></div><span className="nb-quick-signature">WITH LOVE, PAWCARE <Heart size={13}/></span></aside>
  </div>
 </div>;
}
