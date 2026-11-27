import {useEffect,useState,type FormEvent} from 'react';
import {useSearchParams} from 'react-router-dom';
import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {CalendarDays,ChevronLeft,ChevronRight,ArrowRight,AlertTriangle} from 'lucide-react';
import {toast} from 'react-hot-toast';
import {PaymentPanel} from '../components/PaymentPanel';
import {AppointmentPetProfile} from '../components/AppointmentPetProfile';
import {api,dateTime,errorMessage,json,money,type Appointment,type Staff} from '../lib/api';
import {useAuth} from '../lib/auth';
import {PageTitle,Panel,TableWrap,Loading,Empty,ErrorNotice,Modal,Field,SearchBox} from '../components/UI';
const states=[{v:'pending',t:'Chờ xử lý'},{v:'confirmed',t:'Đã xác nhận'},{v:'in_progress',t:'Đang thực hiện'},{v:'completed',t:'Hoàn thành'},{v:'cancelled',t:'Đã hủy'}];
const adminChoices:Record<string,string[]>={pending:['pending','cancelled'],confirmed:['confirmed','cancelled'],in_progress:['in_progress','cancelled'],completed:['completed'],cancelled:['cancelled']};
const paymentLabels:Record<string,string>={unpaid:'Chưa thanh toán',awaiting_payment:'Chờ thanh toán',pending_review:'Chờ đối soát',paid:'Đã thanh toán',refund_required:'Cần hoàn tiền',refunded:'Đã hoàn tiền',void:'Đã hủy thanh toán'};
const staffChoices:Record<string,string[]>={pending:['pending'],confirmed:['confirmed','in_progress'],in_progress:['in_progress','completed'],completed:['completed'],cancelled:['cancelled']};

/** Pending has two phases: unassigned and assigned but not accepted. */
const steps=[
 {name:'Chờ phân công',actor:'Admin',task:'Chọn nhân viên phụ trách'},
 {name:'Chờ tiếp nhận',actor:'Staff',task:'Nhận hoặc từ chối lịch'},
 {name:'Đã xác nhận',actor:'Staff',task:'Chuẩn bị chăm sóc'},
 {name:'Đang thực hiện',actor:'Staff',task:'Ghi nhận kết quả'},
 {name:'Hoàn thành',actor:'Hệ thống',task:'Lưu lịch sử chăm sóc'}
] as const;
function progressIndex(a:Appointment):number{
 if(a.status==='cancelled')return -1;
 if(a.status==='pending')return a.staff_id?1:0;
 if(a.status==='confirmed')return 2;
 if(a.status==='in_progress')return 3;
 return 4;
}
function AppointmentProgress({appointment:a}:{appointment:Appointment}){
 const index=progressIndex(a);
 if(index<0)return <div className="pc-aw-state pc-aw-state-cancelled"><span className="pc-aw-state-title"><span className="pc-aw-dot"/><strong>Đã hủy</strong></span></div>;
 const name=['Chờ Admin phân công','Chờ Staff tiếp nhận','Đã xác nhận','Đang thực hiện','Hoàn thành'][index];
 const detail=a.needs_admin_attention?'Admin cần điều phối':
   index===0?'Admin cần phân công':
   index===4?'Đã hoàn thành chăm sóc':
   a.staff_name?'NV: '+a.staff_name:'Staff phụ trách';
 return <div className={'pc-aw-state pc-aw-state-'+index} aria-label={'Bước '+(index+1)+'/5: '+name}>
  <div className="pc-aw-state-title"><span className="pc-aw-dot"/><strong>{name}</strong><span className="pc-aw-step-count">{index+1}/5</span></div>
  <small>{detail}</small>
 </div>;
}
function WorkflowGuide(){
 const labels=['Admin phân công','Staff tiếp nhận','Đã xác nhận','Đang thực hiện','Hoàn thành'];
 return <section className="pc-aw-guide" aria-labelledby="pc-aw-heading">
  <div className="pc-aw-guide-head"><h2 id="pc-aw-heading">Quy trình xử lý lịch hẹn</h2><span>5 bước · từ phân công đến hoàn thành</span></div>
  <ol className="pc-aw-steps">{steps.map((s,i)=><li key={s.name}>
   <span className="pc-aw-step-no">{i+1}</span><strong>{labels[i]}</strong>
   {i<steps.length-1&&<ArrowRight className="pc-aw-step-arrow" size={14} aria-hidden="true"/>}
  </li>)}</ol>
 </section>;
}

export function AdminAppointments(){const {user}=useAuth();const [searchParams,setSearchParams]=useSearchParams();const [page,setPage]=useState(1),[sort,setSort]=useState('id_desc'),[status,setStatus]=useState('all'),[overdueOnly,setOverdueOnly]=useState(user?.role==='admin'&&searchParams.get('overdue')==='true'),[search,setSearch]=useState(''),[selected,setSelected]=useState<Appointment|null>(null),[rescheduleAt,setRescheduleAt]=useState(''),[edit,setEdit]=useState({status:'pending',staff_id:'',notes:'',care_result:''});const [detailTab,setDetailTab]=useState<'manage'|'pet'|'payment'>('manage');const qc=useQueryClient();const list=useQuery({queryKey:['admin-appointments',page,status,search,overdueOnly,sort],queryFn:()=>api<{items:Appointment[];total:number;limit:number}>(`/appointments?page=${page}&limit=15&sort=${sort}&status=${status}&overdue=${overdueOnly?'true':'false'}&search=${encodeURIComponent(search)}`),refetchInterval:15000,refetchOnWindowFocus:'always',staleTime:0});const staff=useQuery({queryKey:['staff'],queryFn:()=>api<{items:Staff[]}>('/staff')});const save=useMutation({mutationFn:()=>api(`/appointments/${selected?.id}`,json('PATCH',{status:edit.status,...(user?.role==='admin'?{staff_id:edit.staff_id?Number(edit.staff_id):null}:{}),notes:edit.notes,...(user?.role==='staff'&&edit.status==='completed'?{care_result:edit.care_result.trim()}:{})})),onSuccess:()=>{qc.invalidateQueries({queryKey:['admin-appointments']});qc.invalidateQueries({queryKey:['appointments']});qc.invalidateQueries({queryKey:['staff-work']});qc.invalidateQueries({queryKey:['pet']});qc.invalidateQueries({queryKey:['dashboard']});setSelected(null);toast.success('Đã cập nhật lịch hẹn');},onError:e=>toast.error(errorMessage(e))});const reschedule=useMutation({mutationFn:()=>{
 const start=new Date(rescheduleAt+':00+07:00');
 if(!rescheduleAt||Number.isNaN(start.getTime())||start.getTime()<Date.now()+30*60000)throw new Error('Ngày giờ mới không hợp lệ');
 return api(`/appointments/${selected!.id}`,json('PATCH',{starts_at:start.toISOString()}));
 },onSuccess:()=>{qc.invalidateQueries({queryKey:['admin-appointments']});qc.invalidateQueries({queryKey:['appointments']});qc.invalidateQueries({queryKey:['staff-work']});qc.invalidateQueries({queryKey:['dashboard']});setSelected(null);toast.success('Đã đổi giờ hẹn; nhân viên được giao không thay đổi.');},onError:e=>toast.error(errorMessage(e))});const decision=useMutation({mutationFn:(action:'accept'|'decline')=>api<{message:string}>(`/appointments/${selected!.id}/${action}`,json('POST',{})),onSuccess:result=>{qc.invalidateQueries({queryKey:['admin-appointments']});qc.invalidateQueries({queryKey:['staff-work']});qc.invalidateQueries({queryKey:['dashboard']});setSelected(null);toast.success(result.message);},onError:e=>toast.error(errorMessage(e))});const open=(a:Appointment)=>{setSelected(a);setDetailTab('manage');setRescheduleAt(new Date(a.starts_at).toLocaleString('sv-SE',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).replace(' ','T'));setEdit({status:a.status,staff_id:String(a.staff_id||''),notes:a.notes||'',care_result:(a as Appointment & {care_result?:string|null}).care_result||''});};

 const requestedId=searchParams.get('appointment');
 const detail=useQuery({queryKey:['appointment-detail',user?.id,requestedId],queryFn:()=>api<{appointment:Appointment}>(`/appointments/${requestedId}`),enabled:!!requestedId&&/^\d+$/.test(requestedId)});
 useEffect(()=>{if(!requestedId)return;if(detail.data){open(detail.data.appointment);setSearchParams(previous=>{const next=new URLSearchParams(previous);next.delete('appointment');return next;},{replace:true});}else if(detail.error){toast.error(errorMessage(detail.error));setSearchParams(previous=>{const next=new URLSearchParams(previous);next.delete('appointment');return next;},{replace:true});}},[requestedId,detail.data,detail.error]);
 return <div className="pc-aw-page">
 <PageTitle eyebrow="VẬN HÀNH & CHĂM SÓC" title={user?.role==='admin'?'Quản lý lịch hẹn và thanh toán':'Quản lý lịch hẹn'} description={user?.role==='staff'?'Theo dõi và cập nhật lịch được giao.':'Phân công nhân viên và theo dõi dịch vụ chăm sóc.'}/>
 <WorkflowGuide/>
 <Panel className="pc-aw-panel" title="Danh sách đặt lịch">
  <div className="pc-aw-controls">
   <div className="pc-aw-filter-row">
    
    <div className="filter-tabs">
     <button type="button" aria-pressed={status==='all'&&!overdueOnly} className={status==='all'&&!overdueOnly?'selected':''} onClick={()=>{setStatus('all');setOverdueOnly(false);setPage(1);}}>Tất cả</button>
     {states.map(s=><button key={s.v} type="button" aria-pressed={status===s.v&&!overdueOnly} className={status===s.v&&!overdueOnly?'selected':''} onClick={()=>{setStatus(s.v);setOverdueOnly(false);setPage(1);}}>{s.t}</button>)}
    </div>
    {user?.role==='admin'&&<button type="button" aria-pressed={overdueOnly} className={'pc-aw-filter-warning '+(overdueOnly?'selected':'')} onClick={()=>{setOverdueOnly(true);setStatus('all');setPage(1);setSelected(null);}}>Lịch quá hẹn</button>}
   </div>
   <div className="pc-aw-tools"><SearchBox value={search} onChange={v=>{setSearch(v);setPage(1);}} placeholder="Tìm khách hàng, thú cưng, dịch vụ..."/>
    <label className="pc-pets-sort">Sắp xếp <select aria-label="Sắp xếp lịch hẹn" value={sort} onChange={e=>{setSort(e.target.value);setPage(1);setSelected(null);}}><option value="id_desc">Mã mới nhất trước</option><option value="id_asc">Mã cũ nhất trước</option><option value="starts_at_asc">Giờ hẹn gần nhất trước</option><option value="starts_at_desc">Giờ hẹn xa nhất trước</option></select></label>
   </div>
  </div>
  {list.isLoading?<Loading/>:list.error?<ErrorNotice message={errorMessage(list.error)}/>:!list.data?.items.length?<Empty title="Chưa có lịch hẹn phù hợp" description="Thử chọn bộ lọc khác hoặc thay đổi từ khóa tìm kiếm."/>:
   <TableWrap><colgroup>{["id","customer","service","time","state","payment","action"].map(name=><col key={name} className={`pc-aw-col-${name}`}/>)}</colgroup><thead><tr><th>MÃ LỊCH</th><th>KHÁCH HÀNG / THÚ CƯNG</th><th>DỊCH VỤ</th><th>THỜI GIAN</th><th>TRẠNG THÁI / NHÂN VIÊN</th><th>THANH TOÁN</th><th>THAO TÁC</th></tr></thead>
    <tbody>{list.data.items.map(a=><tr key={a.id} className={a.is_overdue?'pc-aw-overdue-row':''}>
     <td data-label="Mã lịch" className="strong pc-aw-id">#{String(a.id).padStart(4,'0')}</td>
     <td data-label="Khách hàng / thú cưng"><strong className="pc-aw-primary">{a.customer_name}</strong><small className="pc-aw-secondary">{a.pet_name}</small></td>
     <td data-label="Dịch vụ" className="pc-aw-service">{a.service_name}<small className="pc-aw-secondary">{money(a.price_snapshot)}</small></td>
     <td data-label="Thời gian" className="pc-aw-time">{dateTime(a.starts_at)}{a.is_overdue&&<small className="pc-aw-overdue"><AlertTriangle size={12}/> Quá giờ hẹn</small>}</td>
     <td data-label="Trạng thái / nhân viên"><AppointmentProgress appointment={a}/></td>
     <td data-label="Thanh toán">{user?.role==='staff'&&a.staff_id!==user.id?<span className="muted-text">Sau khi nhận lịch</span>:<span className={'pc-staff-pay-tag pc-staff-pay-tag--'+(a.payment_status||'unpaid')}>{paymentLabels[a.payment_status||'unpaid']||'Chưa thanh toán'}</span>}</td>
     <td className="pc-aw-action-cell"><button type="button" className="table-action pc-aw-details" onClick={()=>open(a)}>Chi tiết</button></td>
    </tr>)}</tbody></TableWrap>}
   <div className="pagination"><span>{list.data?.total||0} lịch hẹn · Trang {page}</span><div><button type="button" className="icon-button" aria-label="Trang trước" disabled={page===1} onClick={()=>setPage(page-1)}><ChevronLeft size={17}/></button><span className="page-number">{page}</span><button type="button" className="icon-button" aria-label="Trang sau" disabled={page*15>=(list.data?.total||0)} onClick={()=>setPage(page+1)}><ChevronRight size={17}/></button></div></div>
 </Panel>
 {selected&&<Modal title={`Chi tiết lịch hẹn #${String(selected.id).padStart(4,'0')}`} wide className="pc-appt-dialog" onClose={()=>setSelected(null)}>
  <div className="pc-appt-detail-view">
   <div className="pc-appt-detail-top">
    <div className="pc-appt-detail-hero">
     <div className="pc-appt-detail-service"><span>DỊCH VỤ ĐÃ ĐẶT</span><h3>{selected.service_name}</h3><p>Thú cưng: <strong>{selected.pet_name}</strong></p></div>
     <AppointmentProgress appointment={selected}/>
    </div>
    <dl className="pc-appt-detail-facts">
     <div><dt>Khách hàng</dt><dd>{selected.customer_name}</dd></div>
     <div><dt>Ngày giờ hẹn</dt><dd>{dateTime(selected.starts_at)}</dd></div>
     <div><dt>Nhân viên</dt><dd>{selected.staff_name||'Chưa phân công'}</dd></div>
     <div><dt>Thành tiền</dt><dd>{money(selected.price_snapshot)}</dd></div>
    </dl>
    {selected.is_overdue&&<div className="pc-attention-note pc-appt-alert">Lịch đã quá giờ hẹn. Admin cần liên hệ khách và nhân viên để xử lý; hệ thống không tự hủy lịch.</div>}
    {selected.needs_admin_attention&&!selected.is_overdue&&<div className="pc-attention-note pc-appt-alert">{selected.assignment_note||'Cần Admin phân công nhân viên khác'}</div>}
   </div>
   <div className="pc-appt-detail-tabs" role="group" aria-label="Nội dung chi tiết lịch hẹn">
    <button type="button" aria-pressed={detailTab==='manage'} className={detailTab==='manage'?'active':''} onClick={()=>setDetailTab('manage')}>Xử lý lịch</button>
    <button type="button" aria-pressed={detailTab==='pet'} className={detailTab==='pet'?'active':''} onClick={()=>setDetailTab('pet')}>Hồ sơ thú cưng</button>
    <button type="button" aria-pressed={detailTab==='payment'} className={detailTab==='payment'?'active':''} onClick={()=>setDetailTab('payment')}>Thanh toán</button>
   </div>
   <div className="pc-appt-detail-content">
    {detailTab==='manage'&&<section aria-label="Xử lý lịch hẹn" className="pc-appt-manage-pane">
     <header className="pc-appt-section-title"><h3>Xử lý lịch hẹn</h3><p>Chỉ cập nhật những thông tin thuộc quyền của bạn.</p></header>
     {user?.role==='admin'&&['pending','confirmed'].includes(selected.status)&&<div className="pc-attention-note"><strong>{selected.is_overdue?'Điều chỉnh lịch quá hẹn':'Đổi ngày giờ hẹn'}</strong><p>Liên hệ khách trước khi đổi. Khung giờ mới phải còn trống và nằm trong giờ làm việc.</p><div className="form-grid"><Field label="Ngày giờ mới"><input type="datetime-local" min={new Date(Date.now()+30*60000).toLocaleString('sv-SE',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).replace(' ','T')} step={1800} value={rescheduleAt} onChange={e=>setRescheduleAt(e.target.value)}/></Field><button type="button" className="button button-secondary" disabled={reschedule.isPending||!rescheduleAt} onClick={()=>{if(confirm('Xác nhận đổi ngày giờ lịch hẹn?'))reschedule.mutate();}}>Lưu giờ hẹn mới</button></div></div>}
     {user?.role==='staff'&&selected.status==='pending'&&<div className="pc-staff-decision"><p>Admin đã chỉ định lịch này cho bạn. Hãy xác nhận tiếp nhận hoặc từ chối để Admin phân công lại.</p><button type="button" className="button button-secondary" disabled={decision.isPending} onClick={()=>{if(confirm('Trả lịch cho Admin phân công lại?'))decision.mutate('decline');}}>Từ chối lịch</button><button type="button" className="button button-primary" disabled={decision.isPending} onClick={()=>decision.mutate('accept')}>Xác nhận nhận lịch</button></div>}{user?.role==='staff'&&selected.status==='confirmed'&&<div className="pc-staff-decision"><p>Không thể thực hiện lịch này? Trả lịch cho Admin phân công lại trước khi bắt đầu chăm sóc.</p><button type="button" className="button button-secondary" disabled={decision.isPending} onClick={()=>{if(confirm('Trả lịch cho Admin phân công lại?'))decision.mutate('decline');}}>Trả lịch</button></div>}
     <form className="form-stack" onSubmit={(e:FormEvent)=>{e.preventDefault();save.mutate();}}><Field label="Trạng thái lịch hẹn"><select disabled={['completed','cancelled'].includes(selected.status)||user?.role==='staff'&&selected.status==='pending'} value={edit.status} onChange={e=>setEdit({...edit,status:e.target.value})}>{states.filter(s=>(user?.role==='staff'?staffChoices:adminChoices)[selected.status]?.includes(s.v)).map(s=><option key={s.v} value={s.v}>{s.t}</option>)}</select></Field><Field label={user?.role==='admin'&&selected.status==='pending'?'Admin phân công nhân viên phụ trách':'Nhân viên phụ trách'}><select disabled={user?.role!=='admin'||['completed','cancelled'].includes(selected.status)} value={edit.staff_id} onChange={e=>setEdit({...edit,staff_id:e.target.value})}><option value="">Chưa phân công</option>{staff.data?.items.filter(s=>s.is_active||String(s.id)===edit.staff_id).map(s=><option key={s.id} value={s.id}>{s.full_name}</option>)}</select></Field>{user?.role==='staff'&&edit.status==='completed'&&<Field label="Kết quả chăm sóc (bắt buộc khi hoàn thành)"><textarea rows={3} required minLength={2} maxLength={3000} value={edit.care_result} onChange={e=>setEdit({...edit,care_result:e.target.value})} placeholder="Ghi kết quả chăm sóc sau khi hoàn thành dịch vụ"/></Field>}<Field label="Ghi chú"><textarea disabled={['completed','cancelled'].includes(selected.status)} rows={3} value={edit.notes} onChange={e=>setEdit({...edit,notes:e.target.value})}/></Field><div className="modal-actions"><button type="button" className="button button-secondary" onClick={()=>setSelected(null)}>Đóng</button><button className="button button-primary" disabled={save.isPending||decision.isPending||['completed','cancelled'].includes(selected.status)||user?.role==='staff'&&selected.status==='pending'}><CalendarDays size={16}/> {user?.role==='admin'&&selected.status==='pending'?'Lưu phân công':'Lưu cập nhật'}</button></div></form>
    </section>}
    {detailTab==='pet'&&<section aria-label="Hồ sơ thú cưng" className="pc-appt-pet-pane">{(user?.role==='admin'||(user?.role==='staff'&&selected.staff_id===user.id&&['confirmed','in_progress','completed'].includes(selected.status)))?<AppointmentPetProfile key={`${user!.id}-${selected.pet_id}`} petId={selected.pet_id} viewerId={user!.id}/>:<section className="pc-appointment-pet" aria-label="Hồ sơ thú cưng"><h3>Hồ sơ thú cưng</h3><p className="pc-appointment-pet-empty">Vui lòng nhận lịch trước khi xem hồ sơ và lịch sử chăm sóc.</p></section>}</section>}
    {detailTab==='payment'&&<section aria-label="Thanh toán lịch hẹn" className="pc-appt-payment-pane">{user?.role==='admin'&&<PaymentPanel key={selected.id} appointmentId={selected.id} admin/>}{user?.role==='staff'&&(selected.staff_id===user.id&&selected.status!=='pending'
 ?<PaymentPanel key={selected.id} appointmentId={selected.id} staff/>
 :<div className="pc-staff-pay-readonly"><strong>Trạng thái thanh toán</strong><span>Chỉ Admin được xác nhận thanh toán.</span></div>)}</section>}
   </div>
  </div>
 </Modal>}</div>;
}
