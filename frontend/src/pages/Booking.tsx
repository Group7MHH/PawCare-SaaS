import {useMemo,useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {ArrowLeft,ArrowRight,CalendarCheck,Check,Clock3,Plus,ShieldCheck,ShoppingBag} from 'lucide-react';
import {toast} from 'react-hot-toast';
import {api,errorMessage,json,money,type Pet,type Service,type Staff,type User} from '../lib/api';
import {useAuth} from '../lib/auth';
import {CuteIllustration,cuteAssetForService} from '../components/CuteIllustration';
import {serviceArtworkKind} from '../components/PetArtwork';
import {PageTitle,Panel,Loading,Empty,ErrorNotice,Field} from '../components/UI';

function dates(days=8){
 const out:{date:string;day:string;weekday:string}[]=[];
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const [y,m,d]=today.split('-').map(Number);
 for(let i=0;i<days+4;i++){
  const current=new Date(Date.UTC(y,m-1,d+i));
  if(current.getUTCDay()===0)continue;
  out.push({date:current.toISOString().slice(0,10),day:String(current.getUTCDate()).padStart(2,'0'),weekday:current.toLocaleDateString('vi-VN',{weekday:'short',timeZone:'UTC'})});
  if(out.length===days)break;
 }
 return out;
}
const allTimes=Array.from({length:20},(_,i)=>`${String(8+Math.floor(i/2)).padStart(2,'0')}:${i%2?'30':'00'}`);
export function Booking(){
 const {user}=useAuth(),nav=useNavigate(),qc=useQueryClient();
 const pets=useQuery({queryKey:['pets'],queryFn:()=>api<{items:Pet[]}>('/pets')});
 const services=useQuery({queryKey:['services'],queryFn:()=>api<{items:Service[]}>('/services')});
 const staff=useQuery({queryKey:['staff'],queryFn:()=>api<{items:Staff[]}>('/staff')});
 const [step,setStep]=useState(1),[petId,setPetId]=useState(''),[serviceIds,setServiceIds]=useState<number[]>([]);
 const [staffId,setStaffId]=useState(''),[day,setDay]=useState(''),[time,setTime]=useState(''),[notes,setNotes]=useState('');
 const availableDates=useMemo(()=>dates(8),[]);
 const selected=serviceIds.map(id=>services.data?.items.find(s=>s.id===id)).filter((s):s is Service=>!!s);
 const totalPrice=selected.reduce((sum,s)=>sum+Number(s.price),0);
 const duration=selected.reduce((sum,s)=>sum+s.duration_minutes,0);
 const pet=pets.data?.items.find(p=>String(p.id)===petId);
 const member=staff.data?.items.find(s=>String(s.id)===staffId);
 const todayDate=availableDates[0]?.date;
 const availability=useQuery({
  queryKey:['availability',day,serviceIds.join(','),staffId],
  enabled:!!day&&!!selected.length&&duration<=600,
  queryFn:()=>api<{date:string;duration_minutes:number;slots:{time:string;available:boolean}[]}>(`/appointments/availability?date=${day}&service_ids=${serviceIds.join(',')}${staffId?`&staff_id=${staffId}`:''}`)
 });
 const blockedSlots=new Set(availability.data?.slots.filter(s=>!s.available).map(s=>s.time)||[]);
 const timeSlots=allTimes.filter(t=>{
  const [h,m]=t.split(':').map(Number);
  if(h*60+m+duration>18*60)return false;
  return new Date(`${day||todayDate}T${t}:00+07:00`).getTime()>Date.now()+30*60000;
 });
 const toggleService=(id:number)=>{
  setServiceIds(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id].slice(0,8));
  setTime('');
 };
 const submit=useMutation({
  mutationFn:async()=>{
   const session=await api<{user:User}>('/auth/me');
   if(session.user.role!=='customer'||session.user.id!==user?.id)
    throw new Error('Phiên đăng nhập đã thay đổi. Hãy tải lại trang và đăng nhập đúng tài khoản Khách hàng.');
   if(!petId||!selected.length||!day||!time||duration>600)
    throw new Error('Vui lòng chọn thú cưng, dịch vụ và khung giờ hợp lệ.');
   return api('/appointments',json('POST',{
    pet_id:Number(petId),service_ids:serviceIds,
    staff_id:staffId?Number(staffId):null,
    starts_at:new Date(`${day}T${time}:00+07:00`).toISOString(),notes
   }));
  },
  onSuccess:()=>{
   qc.invalidateQueries({queryKey:['appointments']});
   qc.invalidateQueries({queryKey:['dashboard']});
   toast.success('Đặt lịch thành công!');
   nav('/my-appointments');
  },
  onError:e=>toast.error(errorMessage(e))
 });
 if(pets.isLoading||services.isLoading||staff.isLoading)return <Loading/>;
 if(pets.error||services.error||staff.error)return <ErrorNotice message="Không thể lấy dữ liệu đặt lịch. Vui lòng thử lại."/>;
 return <>
  <PageTitle eyebrow="ĐẶT LỊCH TRỰC TUYẾN" title="Đặt lịch chăm sóc" description="Chọn một hoặc nhiều dịch vụ cho bé, PawCare sẽ sắp xếp trong cùng một lịch hẹn."/>
  <div className="booking-steps">
   {['Thú cưng & dịch vụ','Chọn thời gian','Xác nhận'].map((label,index)=><div key={label} className={step>=index+1?'booking-step active':'booking-step'}>
    <span>{step>index+1?<Check size={15}/>:index+1}</span>{label}
   </div>)}
  </div>
  <div className="booking-grid refreshed-booking">
   <div>
    {step===1&&<>
     <Panel title="1. Chọn thú cưng" sub="Bạn muốn đặt lịch chăm sóc cho bé nào?">
      <div className="selection-grid">
       {pets.data?.items.map(p=><button key={p.id} className={`selection-card ${petId===String(p.id)?'selected':''}`} onClick={()=>setPetId(String(p.id))}>
        <span className="selection-icon pc-mini-pet"><CuteIllustration kind={p.species==='cat'?'cat':'dog'} asset={p.species==='cat'?'ears':'banner-play'}/></span><div><strong>{p.name}</strong><small>{p.breed||'Thú cưng'}</small></div>
        {petId===String(p.id)&&<Check size={18} className="check-mark"/>}
       </button>)}
      </div>
      {!pets.data?.items.length&&<Empty title="Bạn chưa có thú cưng" description="Thêm thú cưng trước khi đặt lịch." action={<button className="button button-secondary" onClick={()=>nav('/pets')}><Plus size={16}/> Thêm thú cưng</button>}/>}
     </Panel>
     <Panel title="2. Chọn các dịch vụ" sub="Có thể chọn tối đa 8 dịch vụ trong cùng một lịch hẹn.">
      <div className="multi-service-grid">
       {services.data?.items.map(s=>{
        const checked=serviceIds.includes(s.id);
        const exceeds=duration+s.duration_minutes>600&&!checked;
        return <button type="button" key={s.id} aria-pressed={checked} disabled={exceeds||(!checked&&serviceIds.length>=8)}
         onClick={()=>toggleService(s.id)} className={`multi-service-card ${checked?'selected':''}`}>
         <CuteIllustration className="multi-service-art" kind={serviceArtworkKind(s.name,s.category)} asset={cuteAssetForService(s.name,s.category)}/>
         <span className="multi-service-content"><strong>{s.name}</strong><small>{s.description||s.category}</small>
          <span className="service-meta"><Clock3 size={13}/>{s.duration_minutes} phút</span><b>{money(s.price)}</b></span>
         <span className="multi-service-check">{checked?<Check size={15}/>:null}</span>
        </button>;
       })}
      </div>
      <div className="selection-summary"><ShoppingBag size={17}/> Đã chọn <strong>{serviceIds.length} dịch vụ</strong><span>· {duration} phút · {money(totalPrice)}</span></div>
     </Panel>
    </>}
    {step===2&&<>
     <Panel title="3. Chọn ngày" sub={`Lịch hẹn gồm ${selected.length} dịch vụ, tổng ${duration} phút. Hoạt động thứ Hai–Bảy, 08:00–18:00.`}>
      <div className="date-choices">{availableDates.map(d=><button key={d.date} className={`date-choice ${day===d.date?'selected':''}`} onClick={()=>{setDay(d.date);setTime('');}}><span>{d.weekday}</span><strong>{d.day}</strong><small>{d.date.slice(5,7)}/{d.date.slice(0,4)}</small></button>)}</div>
      <Field label="Hoặc chọn ngày khác trong 90 ngày"><input type="date" min={todayDate} max={new Date(Date.now()+90*86400000).toISOString().slice(0,10)} value={day} onChange={e=>{setDay(e.target.value);setTime('');}}/></Field>
     </Panel>
     <Panel title="4. Chọn giờ bắt đầu" sub="Giờ trống được tính theo tổng thời gian của tất cả dịch vụ đã chọn.">
      <div className="times-grid">{timeSlots.map(t=><button key={t} className={`time-choice ${time===t?'selected':''}`} disabled={!day||blockedSlots.has(t)||availability.isFetching||!availability.data||!!availability.error} onClick={()=>setTime(t)}><Clock3 size={15}/>{t}</button>)}</div>
      {!day&&<p className="form-hint">Vui lòng chọn ngày trước.</p>}
      {availability.isFetching&&<p className="form-hint">Đang kiểm tra lịch trống...</p>}
      {availability.error&&<p className="form-hint">Không thể tải khung giờ. Vui lòng thử lại.</p>}
      {day&&!timeSlots.length&&<p className="form-hint">Không còn khung giờ đủ dài cho các dịch vụ này.</p>}
     </Panel>
     <Panel title="5. Nhân viên chăm sóc" sub="Có thể chọn nhân viên hoặc để PawCare sắp xếp.">
      <div className="staff-choice-grid">
       <button className={`staff-choice ${!staffId?'selected':''}`} onClick={()=>{setStaffId('');setTime('');}}><span className="staff-photo">🐾</span><strong>PawCare sắp xếp</strong><small>Nhân viên còn trống</small></button>
       {staff.data?.items.filter(s=>s.is_active).map(s=><button key={s.id} className={`staff-choice ${staffId===String(s.id)?'selected':''}`} onClick={()=>{setStaffId(String(s.id));setTime('');}}><span className="staff-photo">{s.full_name[0]}</span><strong>{s.full_name}</strong><small>{s.specialty||'Chăm sóc thú cưng'}</small></button>)}
      </div>
     </Panel>
    </>}
    {step===3&&<>
     <Panel title="Kiểm tra thông tin đặt lịch" sub="Vui lòng kiểm tra tổng thời gian và đơn giá trước khi xác nhận.">
      <div className="confirm-list">
       <div><span>Thú cưng</span><strong>{pet?.name}</strong></div>
       <div><span>Dịch vụ ({selected.length})</span><strong>{selected.map(s=>s.name).join(' · ')}</strong></div>
       <div><span>Ngày và giờ</span><strong>{day.split('-').reverse().join('/')} lúc {time}</strong></div>
       <div><span>Nhân viên</span><strong>{member?.full_name||'PawCare sắp xếp'}</strong></div>
       <div><span>Tổng thời lượng</span><strong>{duration} phút</strong></div>
       <div><span>Tổng tiền</span><strong className="color-teal">{money(totalPrice)}</strong></div>
      </div>
      <div className="form-stack"><Field label="Ghi chú cho nhân viên (tùy chọn)"><textarea rows={4} maxLength={1000} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Các lưu ý khi chăm sóc bé..."/></Field></div>
     </Panel>
     <div className="notice-soft"><ShieldCheck size={19}/> Các dịch vụ được tạo thành một lịch hẹn, có chung nhân viên và trạng thái xử lý.</div>
    </>}
    <div className="booking-actions">
     {step>1?<button className="button button-secondary" onClick={()=>setStep(step-1)}><ArrowLeft size={16}/> Quay lại</button>:<span/>}
     {step<3?<button className="button button-primary" disabled={step===1?(!petId||!selected.length||duration>600):(!day||!time||new Date(`${day}T${time}:00+07:00`).getUTCDay()===0||blockedSlots.has(time)||availability.isFetching||!availability.data)} onClick={()=>setStep(step+1)}>Tiếp tục <ArrowRight size={16}/></button>
       :<button className="button button-primary" disabled={submit.isPending} onClick={()=>submit.mutate()}><CalendarCheck size={17}/>{submit.isPending?'Đang đặt lịch...':'Xác nhận đặt lịch'}</button>}
    </div>
   </div>
   <aside className="booking-aside">
    <Panel title="Tóm tắt đặt lịch">
     <div className="summary-pet"><span className="summary-pet-icon pc-mini-pet"><CuteIllustration kind={pet?.species==='cat'?'cat':'dog'} asset={pet?.species==='cat'?'ears':'banner-play'}/></span><div><small>THÚ CƯNG</small><strong>{pet?.name||'Chưa chọn thú cưng'}</strong><span>{pet?.breed||'Người bạn nhỏ của bạn'}</span></div></div>
     <div className="cart-service-list">{selected.map(s=><div key={s.id}><span>{s.name}</span><strong>{money(s.price)}</strong></div>)}{!selected.length&&<p className="form-hint">Chưa có dịch vụ được chọn.</p>}</div>
     <div className="summary-list">
      <div><span>Ngày</span><strong>{day?day.split('-').reverse().join('/'):'—'}</strong></div>
      <div><span>Giờ bắt đầu</span><strong>{time||'—'}</strong></div>
      <div><span>Thời lượng</span><strong>{duration} phút</strong></div>
      <div><span>Nhân viên</span><strong>{member?.full_name||'Bất kỳ'}</strong></div>
     </div>
     <div className="summary-total"><span>Tổng cộng</span><strong>{money(totalPrice)}</strong></div>
     <p className="form-hint">Thanh toán tại cửa hàng, chưa thu trực tuyến.</p>
    </Panel>
    <div className="booking-help"><ShieldCheck size={20}/><div><strong>Yên tâm khi đặt lịch</strong><span>Bạn có thể theo dõi hoặc hủy lịch trong mục Lịch hẹn của tôi.</span></div></div>
   </aside>
  </div>
 </>;
}
