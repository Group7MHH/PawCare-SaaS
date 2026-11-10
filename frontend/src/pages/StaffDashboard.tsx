import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {api,dateTime,type Appointment} from '../lib/api';
import {PageTitle,Panel,TableWrap,Badge,Loading,ErrorNotice,Empty,Metric} from '../components/UI';
import {CalendarDays,Clock3,ClipboardCheck,PlayCircle,ArrowRight} from 'lucide-react';
export function StaffDashboard(){
 const q=useQuery({queryKey:['staff-work'],queryFn:()=>api<{items:Appointment[];total:number}>('/appointments?limit=50'),refetchInterval:15000});
 const pool=useQuery({queryKey:['staff-pool'],queryFn:()=>api<{items:Appointment[];total:number}>('/appointments?pool=true&limit=5'),refetchInterval:30000});
 if(q.isLoading)return <Loading/>;
 if(q.error||!q.data)return <ErrorNotice message="Không thể tải lịch được phân công"/>;
 const items=q.data.items;
 const active=items.filter(x=>['pending','confirmed','in_progress'].includes(x.status));
 const inProgress=items.filter(x=>x.status==='in_progress').length;
 const upcoming=active.filter(x=>new Date(x.starts_at).getTime()>=Date.now()).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
 const queue=pool.data?.items||[];
 return <>
  <PageTitle eyebrow="CÔNG VIỆC CỦA TÔI" title="Chủ động nhận lịch chăm sóc" description="Xem hàng đợi chung, tự nhận lịch phù hợp, thực hiện dịch vụ và cập nhật kết quả." action={<Link className="button button-primary" to="/staff/appointments">Xử lý lịch hẹn</Link>}/>
  <div className="metrics-grid four">
   <Metric icon={<ClipboardCheck/>} title="Lịch của tôi" value={q.data.total} foot="Đã nhận hoặc được yêu cầu"/>
   <Metric icon={<Clock3/>} title="Lịch đang chờ nhận" value={pool.data?.total||0} foot="Hàng đợi chung, chọn để nhận" tone="amber"/>
   <Metric icon={<CalendarDays/>} title="Lịch sắp tới" value={upcoming.length} foot="Lịch được giao từ hiện tại" tone="blue"/>
   <Metric icon={<PlayCircle/>} title="Đang thực hiện" value={inProgress} foot="Lịch đã bắt đầu chăm sóc" tone="green"/>
  </div>
  <Panel title="Hàng đợi chung" sub="Lịch chưa có người phụ trách. Bạn có thể chủ động nhận nếu không trùng giờ." action={<Link className="button button-secondary button-sm" to="/staff/appointments">Mở hàng đợi và nhận lịch <ArrowRight size={14}/></Link>}>
   {pool.isLoading?<Loading/>:pool.error?<ErrorNotice message="Không thể tải hàng đợi chung"/>:!queue.length?<Empty title="Hàng đợi đang trống" description="Khi khách đặt lịch chưa chọn nhân viên, lịch sẽ xuất hiện tại đây."/>:
   <><TableWrap><thead><tr><th>Thời gian</th><th>Khách hàng</th><th>Thú cưng</th><th>Dịch vụ</th><th>Thời lượng</th></tr></thead><tbody>{queue.map(a=><tr key={a.id}><td>{dateTime(a.starts_at)}</td><td><strong>{a.customer_name}</strong></td><td>{a.pet_name}</td><td>{a.service_name}</td><td>{a.duration_minutes_snapshot ?? a.duration_minutes ?? Math.round((new Date(a.ends_at).getTime()-new Date(a.starts_at).getTime())/60000)} phút</td></tr>)}</tbody></TableWrap>{(pool.data?.total||0)>queue.length&&<p className="form-hint">Đang hiển thị {queue.length} trên {pool.data?.total} lịch. Mở hàng đợi để xem đầy đủ.</p>}</>}
   <p className="form-hint">Lịch đã được khách chọn nhân viên sẽ hiển thị riêng cho người đó.</p>
  </Panel>
  <Panel title="Công việc sắp tới" sub="Lịch được giao cho bạn từ hiện tại">
   {!upcoming.length?<Empty title="Chưa có công việc sắp tới"/>:<TableWrap>
    <thead><tr><th>Thời gian</th><th>Thú cưng</th><th>Dịch vụ</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
    <tbody>{upcoming.map(a=><tr key={a.id}><td>{dateTime(a.starts_at)}</td><td><strong>{a.pet_name}</strong></td><td>{a.service_name}</td><td><Badge status={a.status}/></td><td><Link className="button button-secondary button-sm" to="/staff/appointments">Mở lịch</Link></td></tr>)}</tbody>
   </TableWrap>}
  </Panel>
 </>;
}
