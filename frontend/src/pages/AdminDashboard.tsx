import {useQuery} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {ArrowRight,CalendarDays,CheckCircle2,Clock3,PawPrint,Users,Wallet} from 'lucide-react';
import {api,dateTime,money,type Service,type Stats} from '../lib/api';
import {useAuth} from '../lib/auth';
import {PetArtwork,serviceArtworkKind} from '../components/PetArtwork';
import {Panel,Loading,Badge,ErrorNotice} from '../components/UI';

function RevenueBars({series}:{series:Stats['series']}){
 const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit'});
 const now=new Date();
 const parts=formatter.formatToParts(now);
 const year=Number(parts.find(p=>p.type==='year')?.value||now.getFullYear());
 const month=Number(parts.find(p=>p.type==='month')?.value||now.getMonth()+1);
 const keys=Array.from({length:6},(_,i)=>{const d=new Date(Date.UTC(year,month-1-5+i,1));return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`;});
 const values=keys.map(key=>Number(series?.find(s=>s.month===key)?.revenue||0));
 const max=Math.max(...values,1);
 return <div className="pc-revenue-plot" role="img" aria-label="Biểu đồ doanh thu thực tế sáu tháng gần nhất">
  <div className="pc-chart-y"><span>{money(max)}</span><span>{money(max/2)}</span><span>0 đ</span></div>
  <div className="pc-bars">{values.map((value,i)=><div className="pc-bar-column" key={keys[i]} title={`${keys[i]}: ${money(value)}`}>
   <div className="pc-bar-track"><div className={`pc-bar ${i===5?'is-current':''}`} style={{height:`${value?Math.max(6,value/max*100):2}%`}}/></div>
   <small>Thg {keys[i].slice(-2)}</small></div>)}</div>
 </div>;
}
export function AdminDashboard(){
 const {user}=useAuth();
 const q=useQuery({queryKey:['dashboard'],queryFn:()=>api<Stats>('/dashboard')});
 const catalog=useQuery({queryKey:['services'],queryFn:()=>api<{items:Service[]}>('/services')});
 if(q.isLoading)return <Loading/>;
 if(!q.data)return <ErrorNotice message="Không thể tải thống kê từ hệ thống"/>;
 const {stats,recent,series,statuses}=q.data;
 const firstName=user?.full_name.trim().split(/\s+/).slice(-1)[0]||'bạn';
 const activeServices=catalog.data?.items.filter(s=>s.is_active).slice(0,4)||[];
 const pending=Number(statuses?.find(s=>s.status==='pending')?.value||0);
 const confirmed=Number(statuses?.find(s=>s.status==='confirmed')?.value||0);
 const inProgress=Number(statuses?.find(s=>s.status==='in_progress')?.value||0);
 return <div className="pc-dashboard">
  <div className="pc-welcome">
   <div className="pc-welcome-copy"><span className="pc-eyebrow">TỔNG QUAN CỬA HÀNG</span>
    <h1>Chào mừng trở lại, {firstName}! <span aria-hidden="true">👋</span></h1>
    <p>Cùng PawCare theo dõi lịch hẹn và chăm sóc các bé mỗi ngày.</p>
   </div>
   <div className="pc-welcome-pets" aria-hidden="true"><PetArtwork kind="pet"/><PetArtwork kind="groom"/></div>
  </div>
  <div className="pc-metrics">
   <div className="pc-kpi pc-kpi-mint"><div className="pc-kpi-label"><CalendarDays size={19}/> Tổng lịch hẹn</div><strong>{stats.appointments||0}</strong><small>Các lịch trong hệ thống</small><PetArtwork kind="bath"/></div>
   <div className="pc-kpi pc-kpi-cream"><div className="pc-kpi-label"><Users size={19}/> Khách hàng</div><strong>{stats.customers||0}</strong><small>Khách đã đặt lịch</small><PetArtwork kind="nails"/></div>
   <div className="pc-kpi pc-kpi-blue"><div className="pc-kpi-label"><PawPrint size={19}/> Thú cưng</div><strong>{stats.pets||0}</strong><small>Hồ sơ đã ghi nhận</small><PetArtwork kind="groom"/></div>
   <div className="pc-kpi pc-kpi-peach"><div className="pc-kpi-label"><Wallet size={19}/> Doanh thu hoàn thành</div><strong className="pc-money">{money(stats.revenue||0)}</strong><small>Từ các lịch đã hoàn tất</small><PetArtwork kind="spa"/></div>
  </div>
  <div className="pc-main-panels">
   <Panel title="Doanh thu theo tháng" sub="Thống kê dựa trên lịch đã hoàn thành trong 6 tháng gần nhất"><RevenueBars series={series}/></Panel>
   <Panel title="Lịch hẹn gần đây" action={<Link to="/admin/appointments" className="text-link">Xem tất cả <ArrowRight size={15}/></Link>}>
    <div className="pc-table-wrap"><table className="pc-table"><thead><tr><th>Khách hàng</th><th>Thú cưng</th><th>Dịch vụ</th><th>Thời gian</th><th>Trạng thái</th></tr></thead><tbody>
     {recent.slice(0,5).map(a=><tr key={a.id}><td><strong>{a.customer_name}</strong></td><td>{a.pet_name}</td><td className="pc-long-cell">{a.service_name}</td><td>{dateTime(a.starts_at)}</td><td><Badge status={a.status}/></td></tr>)}
     {!recent.length&&<tr><td colSpan={5}>Chưa có lịch hẹn nào.</td></tr>}
    </tbody></table></div>
   </Panel>
  </div>
  <div className="pc-bottom-panels">
   <Panel title="Dịch vụ đang cung cấp" action={<Link to="/admin/catalog" className="text-link">Quản lý dịch vụ <ArrowRight size={15}/></Link>}>
    <div className="pc-services-preview">{activeServices.map(s=><div key={s.id} className="pc-service-tile">
     <PetArtwork kind={serviceArtworkKind(s.name,s.category)}/><strong>{s.name}</strong><span>{money(s.price)}</span>
    </div>)}{!activeServices.length&&<p>Chưa có dịch vụ đang cung cấp.</p>}</div>
   </Panel>
   <Panel title="Cần theo dõi hôm nay"><div className="pc-task-list">
    <Link to="/admin/appointments?status=pending"><Clock3 size={20}/><span><strong>{pending} lịch chờ xác nhận</strong><small>Kiểm tra yêu cầu mới</small></span><ArrowRight size={16}/></Link>
    <Link to="/admin/appointments"><CheckCircle2 size={20}/><span><strong>{confirmed} lịch đã xác nhận</strong><small>Sẵn sàng phục vụ</small></span><ArrowRight size={16}/></Link>
    <Link to="/admin/appointments"><PawPrint size={20}/><span><strong>{inProgress} lịch đang chăm sóc</strong><small>Theo dõi tiến độ</small></span><ArrowRight size={16}/></Link>
   </div><div className="pc-task-art"><PetArtwork kind="pet"/><PetArtwork kind="groom"/></div></Panel>
  </div>
 </div>;
}
