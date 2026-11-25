import {useQuery} from '@tanstack/react-query';
import type {CSSProperties} from 'react';
import {Link} from 'react-router-dom';
import {Activity,ArrowRight,ArrowUpRight,CalendarDays,ChartNoAxesCombined,CheckCircle2,ClipboardList,TrendingUp,Wallet} from 'lucide-react';
import {api,dateTime,money,type Stats} from '../lib/api';
import {Loading,Badge,Empty,ErrorNotice} from '../components/UI';
import {AdminLedger} from '../components/BrandArtwork';

function RevenueGraph({series,field='revenue'}:{series:Stats['series'];field?:'revenue'|'collected'}){
 const now=new Date();
 const last6=Array.from({length:6},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;});
 const vals=last6.map(month=>series?.find(s=>s.month===month)?.[field]||0);
 const max=Math.max(...vals,1);
 const compact=(v:number)=>new Intl.NumberFormat('vi-VN',{notation:'compact',maximumFractionDigits:1}).format(v);
 return <div className="nb-revenue-graph"><div className="nb-chart-guides" aria-hidden="true"><span/><span/><span/><span/></div><div className="nb-chart-bars" role="group" aria-label={field==='collected'?'Thực thu theo tháng xác nhận thanh toán':'Doanh thu dự tính theo tháng đặt lịch'}>{last6.map((m,i)=><div className={`nb-chart-col ${i===5?'current':''}`} key={m} title={`Tháng ${m.slice(-2)}/${m.slice(0,4)}: ${money(vals[i])}`} aria-label={`Tháng ${m.slice(-2)}: ${money(vals[i])}`}><span className="nb-chart-value">{vals[i]>0?compact(vals[i]):'—'}</span><div className="nb-chart-column-rail"><span className="nb-chart-column" style={{height:`${vals[i]>0?Math.max(vals[i]/max*100,5):0}%`,animationDelay:`${i*70}ms`}}/></div><span className="nb-chart-label">Thg {m.slice(-2)}</span></div>)}</div></div>;
}
export function AdminDashboard(){
 const q=useQuery({queryKey:['dashboard'],queryFn:()=>api<Stats>('/dashboard'),refetchInterval:15000,refetchOnWindowFocus:'always',staleTime:0});
 const exceptions=useQuery({queryKey:['admin-overdue-appointments'],queryFn:()=>api<{total:number}>('/appointments?overdue=true&limit=1'),refetchInterval:30000});
 if(q.isLoading)return <Loading/>;
 if(q.error||!q.data)return <ErrorNotice message="Không thể tải thống kê từ hệ thống"/>;
 const {stats,recent,series,statuses,recent_completed:recentCompleted=[]}=q.data;
 const allStatuses=statuses?.reduce((a,x)=>a+x.value,0)||0;
 const confirmed=statuses?.filter(s=>['confirmed','completed','in_progress'].includes(s.status)).reduce((a,x)=>a+x.value,0)||0;
 const percent=allStatuses?Math.round(confirmed/allStatuses*100):0;
 return <div className="nb-dashboard nb-admin-dashboard">
  <header className="nb-admin-intro nb-enter"><div><span className="nb-overline"><span className="nb-overline-dot"/> PHÒNG ĐIỀU HÀNH · PAWCARE</span><h1>Toàn cảnh <em>vận hành.</em></h1><p>Số liệu thực tế, công việc rõ ràng và mọi quyết định trong tầm tay.</p></div><div className="nb-admin-intro-art" aria-hidden="true"><AdminLedger/></div><Link className="nb-action-primary" to="/admin/appointments"><CalendarDays size={18}/> Quản lý lịch hẹn <ArrowUpRight size={17}/></Link></header>
  {(exceptions.data?.total||0)>0&&<section className="nb-admin-alert nb-enter" role="status"><span className="nb-admin-alert-icon"><ClipboardList size={22}/></span><div><strong>{exceptions.data!.total} lịch quá hẹn chưa xử lý</strong><p>Các lịch chưa bắt đầu dù đã qua giờ hẹn. Hãy kiểm tra và xử lý.</p></div><Link to="/admin/appointments?overdue=true">Xem lịch quá hẹn <ArrowRight size={17}/></Link></section>}
  <div className="nb-admin-mosaic" style={{gridTemplateColumns:"minmax(0,1fr)"}}>
   <section className="nb-admin-revenue nb-enter"><div className="nb-admin-revenue-header"><div><span className="nb-section-kicker">01 / DOANH THU</span><h2>Doanh thu dự tính</h2></div><span className="nb-revenue-period"><ChartNoAxesCombined size={16}/> 6 THÁNG</span></div><div className="nb-revenue-total"><strong>{money(stats.revenue||0)}</strong><span>Giá trị lịch không bị hủy, chưa đồng nghĩa đã thu tiền.</span></div><div className="pc-finance-ledger" aria-label="Dòng tiền thanh toán">
    <span><small>Đã thu, chưa hoàn</small><strong>{money(stats.collected||0)}</strong></span>
    <span><small>Chưa thanh toán / Chờ thanh toán</small><strong>{money((Number(stats.unpaid)||0)+(Number(stats.awaiting_payment)||0))}</strong></span>
    <span><small>Chờ đối soát</small><strong>{money(stats.pending_review||0)}</strong></span>
   </div><RevenueGraph series={series}/><h2 style={{marginTop:24}}>Doanh thu thực thu</h2><div className="nb-revenue-total"><strong>{money(stats.collected||0)}</strong><span>Chỉ giao dịch được xác nhận đã thanh toán.</span></div><RevenueGraph series={series} field="collected"/><div className="nb-revenue-foot"><span>PAWCARE / FINANCIAL JOURNAL</span><span>Đơn vị: VNĐ</span></div></section>
   
  </div>
  <div className="nb-admin-lower">
   <section className="nb-paper-panel nb-admin-recent nb-enter"><div className="nb-section-heading"><div><span className="nb-section-kicker">02 / DÒNG CÔNG VIỆC</span><h2>Lịch hẹn gần đây</h2><p>Các lượt đặt được đồng bộ từ hệ thống.</p></div><Link className="nb-section-link" to="/admin/appointments">Xem tất cả <ArrowUpRight size={16}/></Link></div>{!recent.length?<Empty title="Chưa có lịch hẹn" description="Khi khách hàng đặt lịch, thông tin sẽ xuất hiện ở đây."/>:<div className="nb-admin-appointment-list">{recent.slice(0,6).map((a,index)=><div className="nb-admin-appointment" key={a.id} style={{animationDelay:`${index*55}ms`}}><span className="nb-admin-appointment-index" aria-hidden="true">{String(index+1).padStart(2,'0')}</span><div className="nb-admin-appointment-main"><strong>{a.pet_name} <span>· {a.service_name}</span></strong><small>{a.customer_name} · {dateTime(a.starts_at)}</small></div><Badge status={a.status}/></div>)}</div>}</section>
   <div className="nb-admin-sidebar-panels">
    <section className="nb-paper-panel nb-admin-progress nb-enter"><div className="nb-section-heading"><div><span className="nb-section-kicker">03 / TRẠNG THÁI</span><h2>Tiến trình chăm sóc</h2></div><Activity size={18}/></div><div className="nb-admin-progress-figure"><div className="nb-progress-ring" style={{'--progress':`${percent}%`} as CSSProperties} role="img" aria-label={`${percent}% lịch đã được tiếp nhận`}><div><strong>{percent}%</strong><small>Đã tiếp nhận</small></div></div><div className="nb-progress-count"><strong>{confirmed}<span> / {allStatuses}</span></strong><small>Lịch đã được tiếp nhận hoặc hoàn thành</small></div></div><div className="nb-progress-statuses">{(statuses||[]).map(s=><div key={s.status}><Badge status={s.status}/><strong>{s.value}</strong></div>)}</div></section>
    
   </div>
  </div>
  <section className="nb-paper-panel nb-admin-completed nb-enter"><div className="nb-section-heading"><div><span className="nb-section-kicker">05 / ĐÃ HOÀN THÀNH</span><h2>Các lịch vừa hoàn thành</h2><p>Ghi nhận theo ngày Staff hoàn thành dịch vụ, không phải ngày đặt lịch.</p></div><span className="nb-verified"><TrendingUp size={16}/> DỮ LIỆU THỰC</span></div>{recentCompleted.length===0?<Empty title="Chưa có lịch hoàn thành"/>:<div className="nb-completed-grid">{recentCompleted.slice(0,6).map(a=><article className="nb-completed-card" key={a.id}><div><span className="nb-completed-check"><CheckCircle2 size={17}/></span><span><strong>{a.pet_name}</strong><small>{a.service_name}</small></span></div><div><span>{a.customer_name} · {dateTime(a.completed_at)}</span><strong>{money(a.price_snapshot)} · {a.payment_status==='paid'?'Đã thanh toán':'Chưa xác nhận thanh toán'}</strong></div></article>)}</div>}</section>
  <p className="nb-admin-provenance"><Wallet size={15}/> Số liệu lấy trực tiếp từ dữ liệu đặt lịch và hoàn thành của PawCare, không phải số liệu mẫu.</p>
 </div>;
}
