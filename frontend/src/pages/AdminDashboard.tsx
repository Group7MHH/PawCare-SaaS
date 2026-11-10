import {useQuery} from '@tanstack/react-query';
import type {CSSProperties} from 'react';
import {Link} from 'react-router-dom';
import {Activity,ArrowRight,ArrowUpRight,CalendarDays,ChartNoAxesCombined,CheckCircle2,ChevronRight,ClipboardList,TrendingUp,Wallet} from 'lucide-react';
import {api,dateTime,money,type Stats} from '../lib/api';
import {Loading,Badge,Empty,ErrorNotice} from '../components/UI';
import {AdminLedger} from '../components/BrandArtwork';

function RevenueGraph({series}:{series:Stats['series']}){
 const now=new Date();
 const last6=Array.from({length:6},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;});
 const vals=last6.map(month=>series?.find(s=>s.month===month)?.revenue||0);
 const max=Math.max(...vals,1);
 const compact=(v:number)=>new Intl.NumberFormat('vi-VN',{notation:'compact',maximumFractionDigits:1}).format(v);
 return <div className="nb-revenue-graph"><div className="nb-chart-guides" aria-hidden="true"><span/><span/><span/><span/></div><div className="nb-chart-bars" role="group" aria-label="Doanh thu theo tháng, tính từ các lịch hoàn thành">{last6.map((m,i)=><div className={`nb-chart-col ${i===5?'current':''}`} key={m} title={`Tháng ${m.slice(-2)}/${m.slice(0,4)}: ${money(vals[i])}`} aria-label={`Tháng ${m.slice(-2)}: ${money(vals[i])}`}><span className="nb-chart-value">{vals[i]>0?compact(vals[i]):'—'}</span><div className="nb-chart-column-rail"><span className="nb-chart-column" style={{height:`${vals[i]>0?Math.max(vals[i]/max*100,5):0}%`,animationDelay:`${i*70}ms`}}/></div><span className="nb-chart-label">Thg {m.slice(-2)}</span></div>)}</div></div>;
}
export function AdminDashboard(){
 const q=useQuery({queryKey:['dashboard'],queryFn:()=>api<Stats>('/dashboard'),refetchInterval:15000,refetchOnWindowFocus:'always',staleTime:0});
 const exceptions=useQuery({queryKey:['admin-assignment-exceptions'],queryFn:()=>api<{total:number}>('/appointments?needs_attention=true&status=pending&limit=1'),refetchInterval:30000});
 if(q.isLoading)return <Loading/>;
 if(q.error||!q.data)return <ErrorNotice message="Không thể tải thống kê từ hệ thống"/>;
 const {stats,recent,series,statuses,recent_completed:recentCompleted=[]}=q.data;
 const allStatuses=statuses?.reduce((a,x)=>a+x.value,0)||0;
 const confirmed=statuses?.filter(s=>['confirmed','completed','in_progress'].includes(s.status)).reduce((a,x)=>a+x.value,0)||0;
 const percent=allStatuses?Math.round(confirmed/allStatuses*100):0;
 const completedCount=stats.completed||0;
 return <div className="nb-dashboard nb-admin-dashboard">
  <header className="nb-admin-intro nb-enter"><div><span className="nb-overline"><span className="nb-overline-dot"/> PHÒNG ĐIỀU HÀNH · PAWCARE</span><h1>Toàn cảnh <em>vận hành.</em></h1><p>Số liệu thực tế, công việc rõ ràng và mọi quyết định trong tầm tay.</p></div><div className="nb-admin-intro-art" aria-hidden="true"><AdminLedger/></div><Link className="nb-action-primary" to="/admin/appointments"><CalendarDays size={18}/> Quản lý lịch hẹn <ArrowUpRight size={17}/></Link></header>
  {(exceptions.data?.total||0)>0&&<section className="nb-admin-alert nb-enter" role="status"><span className="nb-admin-alert-icon"><ClipboardList size={22}/></span><div><strong>{exceptions.data!.total} lịch cần Admin điều phối</strong><p>Nhân viên chưa thể tiếp nhận hoặc có thay đổi trong lịch. Hãy xem và phân công lại.</p></div><Link to="/admin/appointments">Giải quyết ngay <ArrowRight size={17}/></Link></section>}
  <div className="nb-admin-mosaic">
   <section className="nb-admin-revenue nb-enter"><div className="nb-admin-revenue-header"><div><span className="nb-section-kicker">01 / DOANH THU</span><h2>Doanh thu đã hoàn thành</h2></div><span className="nb-revenue-period"><ChartNoAxesCombined size={16}/> 6 THÁNG</span></div><div className="nb-revenue-total"><strong>{money(stats.revenue||0)}</strong><span><span className="nb-revenue-completed"><CheckCircle2 size={15}/> {completedCount} lịch hoàn thành</span>Doanh thu chỉ ghi nhận khi lịch được hoàn tất.</span></div><RevenueGraph series={series}/><div className="nb-revenue-foot"><span>PAWCARE / FINANCIAL JOURNAL</span><span>Đơn vị: VNĐ</span></div></section>
   <aside className="nb-admin-figures nb-enter"><div className="nb-admin-stat nb-admin-stat-a"><span className="nb-stat-enumeral">01 / 03</span><span className="nb-section-kicker">LỊCH HẸN</span><strong>{stats.appointments||0}</strong><div><span>Tổng lượt đặt</span><ArrowUpRight size={17}/></div></div><div className="nb-admin-stat nb-admin-stat-b"><span className="nb-stat-enumeral">02 / 03</span><span className="nb-section-kicker">KHÁCH HÀNG</span><strong>{stats.customers||0}</strong><div><span>Khách hàng đã đặt lịch</span><ArrowUpRight size={17}/></div></div><div className="nb-admin-stat nb-admin-stat-c"><span className="nb-stat-enumeral">03 / 03</span><span className="nb-section-kicker">THÚ CƯNG</span><strong>{stats.pets||0}</strong><div><span>Hồ sơ đang quản lý</span><ArrowUpRight size={17}/></div></div></aside>
  </div>
  <div className="nb-admin-lower">
   <section className="nb-paper-panel nb-admin-recent nb-enter"><div className="nb-section-heading"><div><span className="nb-section-kicker">02 / DÒNG CÔNG VIỆC</span><h2>Lịch hẹn gần đây</h2><p>Các lượt đặt được đồng bộ từ hệ thống.</p></div><Link className="nb-section-link" to="/admin/appointments">Xem tất cả <ArrowUpRight size={16}/></Link></div>{!recent.length?<Empty title="Chưa có lịch hẹn" description="Khi khách hàng đặt lịch, thông tin sẽ xuất hiện ở đây."/>:<div className="nb-admin-appointment-list">{recent.slice(0,6).map((a,index)=><div className="nb-admin-appointment" key={a.id} style={{animationDelay:`${index*55}ms`}}><span className="nb-admin-appointment-index" aria-hidden="true">{String(index+1).padStart(2,'0')}</span><div className="nb-admin-appointment-main"><strong>{a.pet_name} <span>· {a.service_name}</span></strong><small>{a.customer_name} · {dateTime(a.starts_at)}</small></div><Badge status={a.status}/></div>)}</div>}</section>
   <div className="nb-admin-sidebar-panels">
    <section className="nb-paper-panel nb-admin-progress nb-enter"><div className="nb-section-heading"><div><span className="nb-section-kicker">03 / TRẠNG THÁI</span><h2>Tiến trình chăm sóc</h2></div><Activity size={18}/></div><div className="nb-admin-progress-figure"><div className="nb-progress-ring" style={{'--progress':`${percent}%`} as CSSProperties} role="img" aria-label={`${percent}% lịch đã được tiếp nhận`}><div><strong>{percent}%</strong><small>Đã tiếp nhận</small></div></div><div className="nb-progress-count"><strong>{confirmed}<span> / {allStatuses}</span></strong><small>Lịch đã được tiếp nhận hoặc hoàn thành</small></div></div><div className="nb-progress-statuses">{(statuses||[]).map(s=><div key={s.status}><Badge status={s.status}/><strong>{s.value}</strong></div>)}</div></section>
    <section className="nb-admin-shortcuts nb-enter"><span className="nb-section-kicker">04 / LỐI TẮT</span><h2>Đến nơi bạn cần.</h2><Link to="/admin/appointments"><ClipboardList size={18}/> Lịch hẹn & điều phối <ChevronRight size={17}/></Link><Link to="/admin/customers"><Users size={18}/> Khách hàng & thú cưng <ChevronRight size={17}/></Link><Link to="/admin/catalog"><PawPrint size={18}/> Dịch vụ & nhân viên <ChevronRight size={17}/></Link></section>
   </div>
  </div>
  <section className="nb-paper-panel nb-admin-completed nb-enter"><div className="nb-section-heading"><div><span className="nb-section-kicker">05 / ĐÃ HOÀN THÀNH</span><h2>Những cuộc hẹn vừa kết thúc</h2><p>Ghi nhận theo ngày Staff hoàn thành dịch vụ, không phải ngày đặt lịch.</p></div><span className="nb-verified"><TrendingUp size={16}/> DỮ LIỆU THỰC</span></div>{recentCompleted.length===0?<Empty title="Chưa có lịch hoàn thành"/>:<div className="nb-completed-grid">{recentCompleted.slice(0,6).map(a=><article className="nb-completed-card" key={a.id}><div><span className="nb-completed-check"><CheckCircle2 size={17}/></span><span><strong>{a.pet_name}</strong><small>{a.service_name}</small></span></div><div><span>{a.customer_name} · {dateTime(a.completed_at)}</span><strong>{money(a.price_snapshot)}</strong></div></article>)}</div>}</section>
  <p className="nb-admin-provenance"><Wallet size={15}/> Số liệu lấy trực tiếp từ dữ liệu đặt lịch và hoàn thành của PawCare, không phải số liệu mẫu.</p>
 </div>;
}
