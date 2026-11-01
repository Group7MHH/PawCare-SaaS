import {useMemo,useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight,Check,Clock3,Scissors,ShieldCheck} from 'lucide-react';
import {money,type Service} from '../lib/api';

type Props={
 services:Service[];
 selectedIds?:number[];
 onToggle?:(id:number)=>void;
 totalDuration?:number;
 maxSelected?:number;
};

/** Presentational service selector. Categories, prices and descriptions are supplied by API. */
export function ServiceCards({services,selectedIds=[],onToggle,totalDuration=0,maxSelected=8}:Props){
 const [category,setCategory]=useState('all');
 const categories=useMemo(()=>Array.from(new Set(services.map(s=>s.category?.trim()||'Khác'))),[services]);
 const visible=category==='all'?services:services.filter(s=>(s.category?.trim()||'Khác')===category);
 return <div className="pc-services-catalog">
  <div className="pc-service-tabbar" role="group" aria-label="Lọc dịch vụ theo danh mục">
   <button type="button" onClick={()=>setCategory('all')} aria-pressed={category==='all'} className={category==='all'?'active':''}>Tất cả dịch vụ <span>{services.length}</span></button>
   {categories.map(name=><button key={name} type="button" onClick={()=>setCategory(name)} aria-pressed={category===name} className={category===name?'active':''}>{name} <span>{services.filter(s=>(s.category?.trim()||'Khác')===name).length}</span></button>)}
  </div>
  {!visible.length?<p className="pc-service-empty">Chưa có dịch vụ đang cung cấp trong danh mục này.</p>:
  <div className="pc-service-card-grid">
   {visible.map((service,index)=>{
    const selected=selectedIds.includes(service.id);
    const disabled=!!onToggle&&!selected&&(selectedIds.length>=maxSelected||totalDuration+service.duration_minutes>600);
    return <article key={service.id} className={`pc-service-plan ${selected?'selected':''}`}>
     <div className="pc-service-plan-top">
      <span className="pc-service-serial">{String(index+1).padStart(2,'0')} / {service.category||'Dịch vụ'}</span>
      <span className="pc-service-plan-icon"><Scissors size={19}/></span>
     </div>
     <h3>{service.name}</h3>
     <p className="pc-service-description">{service.description?.trim()||'Dịch vụ chăm sóc thú cưng tại PawCare.'}</p>
     <div className="pc-service-plan-detail"><Clock3 size={16}/><span>Thời lượng: <strong>{service.duration_minutes} phút</strong></span></div>
     <div className="pc-service-plan-detail"><ShieldCheck size={16}/><span>Nhân viên PawCare trực tiếp thực hiện</span></div>
     <div className="pc-service-plan-bottom">
      <div><small>Giá dịch vụ</small><strong>{money(service.price)}</strong></div>
      {onToggle?
       <button type="button" className={`pc-service-select ${selected?'active':''}`} aria-pressed={selected} disabled={disabled} onClick={()=>onToggle(service.id)}>
        {selected?<><Check size={16}/> Đã chọn</>:<>Chọn dịch vụ <ArrowRight size={16}/></>}
       </button>:
       <Link className="pc-service-select" to={`/book?service_ids=${service.id}`}>Đặt lịch <ArrowRight size={16}/></Link>}
     </div>
    </article>;
   })}
  </div>}
 </div>;
}
