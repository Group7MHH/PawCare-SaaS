import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {api,dateTime,type Appointment} from '../lib/api';
import {PageTitle,Panel,TableWrap,Badge,Loading,ErrorNotice,Empty,Metric} from '../components/UI';
import {CalendarDays,Clock3,ClipboardCheck} from 'lucide-react';
export function StaffDashboard(){
 const q=useQuery({queryKey:['staff-work'],queryFn:()=>api<{items:Appointment[];total:number}>('/appointments?limit=50'),refetchInterval:30000});
 const pool=useQuery({queryKey:['staff-pool'],queryFn:()=>api<{items:Appointment[];total:number}>('/appointments?pool=true&limit=1'),refetchInterval:30000});
 if(q.isLoading)return <Loading/>;
 if(q.error||!q.data)return <ErrorNotice message="Không thể tải lịch được phân công"/>;
 const items=q.data.items;
 const active=items.filter(x=>['pending','confirmed','in_progress'].includes(x.status));
 const upcoming=active.filter(x=>new Date(x.starts_at).getTime()>=Date.now()).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
 return <>
  <PageTitle eyebrow="CÔNG VIỆC CỦA TÔI" title="Chủ động nhận lịch chăm sóc" description="Xem hàng đợi chung, tự nhận lịch phù hợp, thực hiện dịch vụ và cập nhật kết quả." action={<Link className="button button-primary" to="/staff/appointments">Xử lý lịch hẹn</Link>}/>
  <div className="metrics-grid three">
   <Metric icon={<ClipboardCheck/>} title="Lịch của tôi" value={q.data.total} foot="Đã nhận hoặc được yêu cầu"/>
   <Metric icon={<Clock3/>} title="Lịch đang chờ nhận" value={pool.data?.total||0} foot="Hàng đợi chung, chọn để nhận" tone="amber"/>
   <Metric icon={<CalendarDays/>} title="Lịch sắp tới" value={upcoming.length} foot="Lịch được giao từ hiện tại" tone="blue"/>
  </div>
  <Panel title="Lịch đang chờ nhân viên" action={<Link className="button button-secondary" to="/staff/appointments">Mở hàng đợi và nhận lịch</Link>}><p className="form-hint">Bạn có thể chủ động nhận lịch chưa có người phụ trách. Lịch đã được khách chọn nhân viên sẽ hiển thị riêng cho người đó.</p></Panel><Panel title="Công việc sắp tới">
   {!upcoming.length?<Empty title="Chưa có công việc sắp tới"/>:<TableWrap>
    <thead><tr><th>Thời gian</th><th>Thú cưng</th><th>Dịch vụ</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
    <tbody>{upcoming.map(a=><tr key={a.id}><td>{dateTime(a.starts_at)}</td><td>{a.pet_name}</td><td>{a.service_name}</td><td><Badge status={a.status}/></td><td><Link to="/staff/appointments">Mở lịch</Link></td></tr>)}</tbody>
   </TableWrap>}
  </Panel>
 </>;
}
