import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {api,dateTime,type Appointment} from '../lib/api';
import {PageTitle,Panel,TableWrap,Badge,Loading,ErrorNotice,Empty} from '../components/UI';
export function StaffDashboard(){
 const q=useQuery({queryKey:['staff-work'],queryFn:()=>api<{items:Appointment[];total:number}>('/appointments?limit=50')});
 if(q.isLoading)return <Loading/>;
 if(q.error||!q.data)return <ErrorNotice message="Không thể tải lịch được phân công"/>;
 const items=q.data.items;
 const active=items.filter(x=>['pending','confirmed','in_progress'].includes(x.status));
 const upcoming=active.filter(x=>new Date(x.starts_at).getTime()>=Date.now()).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
 return <>
  <PageTitle eyebrow="CÔNG VIỆC CỦA TÔI" title="Lịch chăm sóc được giao" description="Xem lịch, bắt đầu công việc và cập nhật kết quả chăm sóc." action={<Link className="button button-primary" to="/staff/appointments">Xử lý lịch hẹn</Link>}/>
  <div className="metrics-grid three">
   <Panel title="Lịch được giao"><strong>{q.data.total}</strong></Panel>
   <Panel title="Chưa hoàn thành"><strong>{active.length}</strong></Panel>
   <Panel title="Lịch sắp tới"><strong>{upcoming.length}</strong></Panel>
  </div>
  <Panel title="Công việc sắp tới">
   {!upcoming.length?<Empty title="Chưa có công việc sắp tới"/>:<TableWrap>
    <thead><tr><th>Thời gian</th><th>Thú cưng</th><th>Dịch vụ</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
    <tbody>{upcoming.map(a=><tr key={a.id}><td>{dateTime(a.starts_at)}</td><td>{a.pet_name}</td><td>{a.service_name}</td><td><Badge status={a.status}/></td><td><Link to="/staff/appointments">Mở lịch</Link></td></tr>)}</tbody>
   </TableWrap>}
  </Panel>
 </>;
}
