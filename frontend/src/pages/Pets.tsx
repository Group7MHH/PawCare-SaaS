import {useState,type FormEvent} from 'react';
import {PetAvatar} from '../components/PetAvatar';
import {CareArtwork} from '../components/CareArtwork';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {ArrowLeft,CalendarDays,ClipboardList,HeartPulse,Plus,PawPrint,Trash2,Edit3,ArrowUpRight} from 'lucide-react';
import {toast} from 'react-hot-toast';
import {api,dateOnly,errorMessage,json,speciesName,type Pet,type CareRecord} from '../lib/api';
import {PageTitle,Panel,Modal,Field,SearchBox,Loading,Empty,ErrorNotice} from '../components/UI';
type PetForm={name:string;species:string;breed:string;gender:string;birthday:string;weight_kg:string;color:string;notes:string};
const initial:PetForm={name:'',species:'dog',breed:'',gender:'unknown',birthday:'',weight_kg:'',color:'',notes:''};
function PetEditor({pet,onClose}:{pet?:Pet;onClose:()=>void}){const qc=useQueryClient();const [form,setForm]=useState<PetForm>(pet?{name:pet.name,species:pet.species,breed:pet.breed||'',gender:pet.gender,birthday:pet.birthday?.slice(0,10)||'',weight_kg:String(pet.weight_kg||''),color:pet.color||'',notes:pet.notes||''}:initial);
 const save=useMutation({mutationFn:()=>api(pet?`/pets/${pet.id}`:'/pets',json(pet?'PATCH':'POST',{...form,weight_kg:form.weight_kg?Number(form.weight_kg):null,birthday:form.birthday||null})),onSuccess:()=>{qc.invalidateQueries({queryKey:['pets']});qc.invalidateQueries({queryKey:['pet',String(pet?.id)]});qc.invalidateQueries({queryKey:['dashboard']});toast.success('Đã lưu hồ sơ thú cưng');onClose();},onError:e=>toast.error(errorMessage(e))});
 return <Modal title={pet?'Chỉnh sửa hồ sơ thú cưng':'Thêm thành viên'} onClose={onClose}><form className="form-stack" onSubmit={(e:FormEvent)=>{e.preventDefault();save.mutate();}}><div className="form-grid"><Field label="Tên thú cưng *"><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ví dụ: Milo"/></Field><Field label="Loài *"><select value={form.species} onChange={e=>setForm({...form,species:e.target.value})}><option value="dog">Chó</option><option value="cat">Mèo</option><option value="other">Khác</option></select></Field><Field label="Giống"><input value={form.breed} onChange={e=>setForm({...form,breed:e.target.value})} placeholder="Poodle, Anh lông ngắn..."/></Field><Field label="Giới tính"><select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}><option value="unknown">Chưa rõ</option><option value="male">Đực</option><option value="female">Cái</option></select></Field><Field label="Ngày sinh"><input type="date" value={form.birthday} onChange={e=>setForm({...form,birthday:e.target.value})}/></Field><Field label="Cân nặng (kg)"><input min="0.1" max="500" step="0.1" type="number" value={form.weight_kg} onChange={e=>setForm({...form,weight_kg:e.target.value})}/></Field><Field label="Màu lông"><input value={form.color} onChange={e=>setForm({...form,color:e.target.value})} placeholder="Nâu, trắng..."/></Field></div><Field label="Ghi chú"><textarea rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Tính cách, sở thích, lưu ý sức khỏe..."/></Field><div className="modal-actions"><button type="button" className="button button-secondary" onClick={onClose}>Hủy bỏ</button><button type="submit" disabled={save.isPending} className="button button-primary">{save.isPending?'Đang lưu...':'Lưu hồ sơ'}</button></div></form></Modal>;
}
export function PetsPage(){
 const [search,setSearch]=useState('');
 const [adding,setAdding]=useState(false);
 const [filter,setFilter]=useState<'all'|'dog'|'cat'|'other'>('all');
 const [sort,setSort]=useState<'recent'|'name'|'records'>('recent');
 const pets=useQuery({queryKey:['pets'],queryFn:()=>api<{items:Pet[]}>('/pets')});
 const all=pets.data?.items||[];
 const counts={all:all.length,dog:all.filter(p=>p.species==='dog').length,cat:all.filter(p=>p.species==='cat').length,other:all.filter(p=>p.species!=='dog'&&p.species!=='cat').length};
 const cleaned=search.trim().toLocaleLowerCase('vi-VN');
 const list=all.filter(p=>(filter==='all'||(filter==='other'?p.species!=='dog'&&p.species!=='cat':p.species===filter))&&
  (!cleaned||(p.name+' '+(p.breed||'')).toLocaleLowerCase('vi-VN').includes(cleaned)))
  .slice().sort((a,b)=>sort==='name'?a.name.localeCompare(b.name,'vi-VN'):sort==='records'?(b.record_count||0)-(a.record_count||0):0);
 const records=all.reduce((sum,p)=>sum+(p.record_count||0),0);
 const tabs=[{key:'all',label:'Tất cả'},{key:'dog',label:'Chó'},{key:'cat',label:'Mèo'},{key:'other',label:'Khác'}] as const;
 return <div className="pc-pets-page">
  <PageTitle eyebrow="QUẢN LÝ THÚ CƯNG" title="Thú cưng của tôi" description="Mỗi hồ sơ là một cuốn nhật ký chăm sóc riêng, được lưu giữ ngăn nắp tại PawCare." action={<button type="button" className="button button-primary" onClick={()=>setAdding(true)}><Plus size={17}/> Thêm thú cưng</button>}/>
  <div className="pc-pets-overview-strip" aria-label="Tổng quan hồ sơ">
   <div className="pc-pets-overview-label"><span className="pc-pets-record-index">CARE / INDEX</span><strong>Danh mục chăm sóc</strong><small>Những thông tin quan trọng, luôn trong tầm tay.</small></div>
   <div className="pc-pets-overview-stat"><strong>{all.length}</strong><span>Hồ sơ thú cưng</span></div>
   <div className="pc-pets-overview-stat"><strong>{records}</strong><span>Lượt ghi nhận chăm sóc</span></div>
   <div className="pc-pets-overview-art" aria-hidden="true"><CareArtwork variant="record"/></div>
  </div>
  <div className="pc-pets-list-head"><div><span className="pc-pets-list-kicker">01 / BỘ SƯU TẬP HỒ SƠ</span><h2>Gia đình nhỏ của bạn</h2><p>Chọn một thẻ để mở nhật ký và xem lịch sử chăm sóc.</p></div><span className="pc-pets-visible-count" aria-live="polite">Hiển thị {list.length} / {all.length}</span></div>
  <div className="pc-pets-tools">
   <SearchBox value={search} onChange={setSearch} placeholder="Tìm theo tên, giống..."/>
   <div className="pc-pets-filter" role="group" aria-label="Lọc theo loài">
    {tabs.map(t=><button key={t.key} type="button" aria-pressed={filter===t.key} className={filter===t.key?'selected':''} onClick={()=>setFilter(t.key)}>{t.label}<span>{counts[t.key]}</span></button>)}
   </div>
   <label className="pc-pets-sort">Sắp xếp <select value={sort} onChange={e=>setSort(e.target.value as typeof sort)}><option value="recent">Mặc định</option><option value="name">Theo tên</option><option value="records">Nhiều hồ sơ nhất</option></select></label>
  </div>
  {pets.isLoading?<Loading/>:pets.error?<ErrorNotice message={errorMessage(pets.error)}/>:!list.length?<Panel><Empty title={all.length?'Không có hồ sơ phù hợp':'Chưa có thú cưng'} description={all.length?'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.':'Hãy tạo hồ sơ đầu tiên để bắt đầu lưu giữ hành trình chăm sóc.'} action={<button type="button" className="button button-primary" onClick={()=>setAdding(true)}><Plus size={16}/> Thêm thú cưng</button>}/></Panel>:
  <div className="pc-record-collection" aria-live="polite">
   {list.map((p,index)=><Link to={'/pets/'+p.id} key={p.id} className={'pc-record-card pc-record-card--'+(index%3)} aria-label={'Mở hồ sơ chăm sóc của '+p.name}>
    <div className="pc-record-card-cover">
     <span className="pc-record-card-number">HỒ SƠ / {String(index+1).padStart(2,'0')}</span>
     <CareArtwork variant="record"/>
     <span className="pc-record-card-avatar" aria-hidden="true"><PetAvatar species={p.species} size={56}/></span>
     <span className="pc-record-card-species">{speciesName(p.species)}</span>
    </div>
    <div className="pc-record-card-body">
     <span className="pc-record-card-eyebrow">SỔ CHĂM SÓC CÁ NHÂN</span>
     <h3>{p.name}</h3>
     <p>{p.breed||'Chưa cập nhật giống'}</p>
     <div className="pc-record-card-facts"><span><small>GIỚI TÍNH</small><strong>{p.gender==='male'?'Đực':p.gender==='female'?'Cái':'Chưa rõ'}</strong></span><span><small>CÂN NẶNG</small><strong>{p.weight_kg?String(p.weight_kg)+' kg':'Chưa cập nhật'}</strong></span></div>
     <div className="pc-record-card-footer"><span><ClipboardList size={15}/><strong>{p.record_count||0}</strong> lần chăm sóc</span><span className="pc-record-card-open">Mở hồ sơ <ArrowUpRight size={17}/></span></div>
    </div>
   </Link>)}
  </div>}
  <div className="pc-pets-bottom-note"><HeartPulse size={18}/><span>Hồ sơ được đồng bộ từ dữ liệu của bạn; thông tin sức khỏe chỉ mang tính ghi nhận, không thay thế tư vấn thú y.</span></div>
  {adding&&<PetEditor onClose={()=>setAdding(false)}/>}
 </div>;
}
export function PetDetail(){const {id}=useParams(),nav=useNavigate(),qc=useQueryClient();const [editing,setEditing]=useState(false),[addRecord,setAddRecord]=useState(false),[recordTab,setRecordTab]=useState<'all'|'vaccination'|'other'>('all'),[record,setRecord]=useState({title:'',record_type:'vaccination',care_date:new Date().toISOString().slice(0,10),description:'',next_due_date:''});
 const data=useQuery({queryKey:['pet',id],queryFn:()=>api<{pet:Pet;records:CareRecord[]}>(`/pets/${id}`)});
 const add=useMutation({mutationFn:()=>api(`/pets/${id}/records`,json('POST',{...record,next_due_date:record.next_due_date||null})),onSuccess:()=>{qc.invalidateQueries({queryKey:['pet',id]});qc.invalidateQueries({queryKey:['pets']});setAddRecord(false);toast.success('Đã thêm hồ sơ chăm sóc');},onError:e=>toast.error(errorMessage(e))});
 const remove=useMutation({mutationFn:()=>api(`/pets/${id}`,json('DELETE')),onSuccess:()=>{qc.invalidateQueries({queryKey:['pets']});nav('/pets');toast.success('Đã xóa hồ sơ thú cưng');},onError:e=>toast.error(errorMessage(e))});
 const removeRecord=useMutation({mutationFn:(recordId:number)=>api(`/pets/${id}/records/${recordId}`,json('DELETE')),onSuccess:()=>{qc.invalidateQueries({queryKey:['pet',id]});toast.success('Đã xóa mục chăm sóc');},onError:e=>toast.error(errorMessage(e))});
 if(data.isLoading)return <Loading/>;if(!data.data)return <ErrorNotice message={errorMessage(data.error)}/>;const {pet,records}=data.data;const filteredRecords=records.filter(r=>recordTab==='all'||(recordTab==='vaccination'?r.record_type==='vaccination':r.record_type!=='vaccination'));
 return <><button className="back-link" onClick={()=>nav('/pets')}><ArrowLeft size={16}/> Trở về danh sách thú cưng</button><PageTitle eyebrow="HỒ SƠ THÚ CƯNG" title={`Hồ sơ của ${pet.name}`} description="Thông tin, sức khỏe và lịch sử chăm sóc trong một nơi." action={<><button className="button button-secondary" onClick={()=>setEditing(true)}><Edit3 size={16}/> Chỉnh sửa</button><button className="button button-outline-danger" onClick={()=>{if(confirm(`Xóa hồ sơ ${pet.name}? Thao tác không thể hoàn tác.`))remove.mutate();}}><Trash2 size={16}/> Xóa</button></>}/>
 <div className="pet-detail-layout"><div><Panel><div className={`pet-profile-cover ${pet.species}`}><span><PetAvatar species={pet.species} size={52}/></span><h2>{pet.name}</h2><p>{pet.breed||speciesName(pet.species)}</p></div><div className="info-list"><div><span>Loài</span><strong>{speciesName(pet.species)}</strong></div><div><span>Giới tính</span><strong>{pet.gender==='male'?'Đực':pet.gender==='female'?'Cái':'Chưa rõ'}</strong></div><div><span>Ngày sinh</span><strong>{dateOnly(pet.birthday)}</strong></div><div><span>Cân nặng</span><strong>{pet.weight_kg?`${pet.weight_kg} kg`:'—'}</strong></div><div><span>Màu lông</span><strong>{pet.color||'—'}</strong></div></div>{pet.notes&&<div className="note-block"><strong>Ghi chú</strong><p>{pet.notes}</p></div>}</Panel></div><div><div className="pc-pet-section-tabs" role="group" aria-label="Lọc hồ sơ chăm sóc">{[{key:'all',label:'Tất cả hồ sơ'},{key:'vaccination',label:'Tiêm phòng'},{key:'other',label:'Khám & chăm sóc'}].map(tab=><button type="button" key={tab.key} aria-pressed={recordTab===tab.key} className={recordTab===tab.key?'active':''} onClick={()=>setRecordTab(tab.key as typeof recordTab)}>{tab.label}</button>)}</div><Panel title="Hồ sơ chăm sóc" sub="Lịch sử sức khỏe và các lần chăm sóc" action={<button className="button button-primary button-sm" onClick={()=>setAddRecord(true)}><Plus size={15}/> Thêm hồ sơ</button>}>{!filteredRecords.length?<Empty title="Chưa có hồ sơ chăm sóc phù hợp" description="Thêm lịch tiêm, khám bệnh hoặc lần spa gần nhất."/>:<div className="care-timeline">{filteredRecords.map(r=><div key={r.id} className="care-item"><div className="care-item-icon">{r.record_type==='vaccination'?<HeartPulse size={19}/>:<ClipboardList size={19}/>}</div><div><div className="care-item-title"><strong>{r.title}</strong><button className="icon-button" aria-label="Xóa hồ sơ" onClick={()=>{if(confirm('Xóa hồ sơ chăm sóc này?'))removeRecord.mutate(r.id);}}><Trash2 size={15}/></button></div><span className="muted-text"><CalendarDays size={13}/> {dateOnly(r.care_date)}</span>{r.description&&<p>{r.description}</p>}{r.next_due_date&&<small className="due-date">Nhắc lại: {dateOnly(r.next_due_date)}</small>}</div></div>)}</div>}</Panel><div className="cta-strip"><PawPrint size={26}/><div><strong>Đã đến lúc làm đẹp cho {pet.name}?</strong><span>Đặt lịch chăm sóc ngay để bé luôn khỏe và thơm tho.</span></div><Link className="button button-primary" to="/book">Đặt lịch ngay</Link></div></div></div>
 {editing&&<PetEditor pet={pet} onClose={()=>setEditing(false)}/ >}{addRecord&&<Modal title="Thêm hồ sơ chăm sóc" onClose={()=>setAddRecord(false)}><form className="form-stack" onSubmit={e=>{e.preventDefault();add.mutate();}}><Field label="Tên hồ sơ *"><input required minLength={2} value={record.title} onChange={e=>setRecord({...record,title:e.target.value})} placeholder="Ví dụ: Tiêm phòng dại"/></Field><div className="form-grid"><Field label="Loại hồ sơ"><select value={record.record_type} onChange={e=>setRecord({...record,record_type:e.target.value})}><option value="vaccination">Tiêm phòng</option><option value="medical">Khám sức khỏe</option><option value="grooming">Spa / cắt tỉa</option><option value="other">Khác</option></select></Field><Field label="Ngày chăm sóc"><input type="date" required value={record.care_date} onChange={e=>setRecord({...record,care_date:e.target.value})}/></Field></div><Field label="Ngày nhắc lại (nếu có)"><input type="date" value={record.next_due_date} onChange={e=>setRecord({...record,next_due_date:e.target.value})}/></Field><Field label="Mô tả"><textarea rows={3} value={record.description} onChange={e=>setRecord({...record,description:e.target.value})}/></Field><div className="modal-actions"><button type="button" className="button button-secondary" onClick={()=>setAddRecord(false)}>Hủy</button><button className="button button-primary" disabled={add.isPending}>{add.isPending?'Đang lưu...':'Lưu hồ sơ'}</button></div></form></Modal>}</>;
}
