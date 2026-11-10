import {useEffect,useState,type FormEvent} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {toast} from 'react-hot-toast';
import {Banknote,CheckCircle2,Landmark,LockKeyhole,Save,ShieldCheck,Info} from 'lucide-react';
import {api,errorMessage,json} from '../lib/api';
import {PageTitle,Loading,ErrorNotice} from '../components/UI';

type Bank={name:string;account:string;owner:string};
type BankSettings={bank:Bank|null;enabled:boolean;source:'database'|'environment'|'none'};
type FormBank=Bank&{enabled:boolean};
export function AdminBankSettings(){
 const qc=useQueryClient();
 const settings=useQuery({queryKey:['payment-bank-admin'],queryFn:()=>api<{settings:BankSettings}>('/payments/admin-bank')});
 const [form,setForm]=useState<FormBank>({name:'',account:'',owner:'',enabled:true});
 const [dirty,setDirty]=useState(false);
 useEffect(()=>{
  if(dirty||!settings.data)return;
  const existing=settings.data.settings;
  setForm({name:existing.bank?.name??'',account:existing.bank?.account??'',owner:existing.bank?.owner??'',enabled:existing.enabled});
 },[settings.data,dirty]);
 const save=useMutation({
  mutationFn:(payload:FormBank)=>api<{message:string}>('/payments/admin-bank',json('PUT',payload)),
  onSuccess:r=>{
   setDirty(false);toast.success(r.message);
   qc.invalidateQueries({queryKey:['payment-bank-admin']});
   qc.invalidateQueries({queryKey:['payment-config']});
   qc.invalidateQueries({queryKey:['payments']});
  },
  onError:e=>toast.error(errorMessage(e))
 });
 const update=(part:Partial<FormBank>)=>{setDirty(true);setForm(value=>({...value,...part}));};
 const submit=(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  if(!/^\d{6,32}$/.test(form.account.trim())){toast.error('Số tài khoản phải có từ 6 đến 32 chữ số');return;}
  if(form.name.trim().length<2||form.owner.trim().length<2){toast.error('Vui lòng điền đầy đủ tên ngân hàng và chủ tài khoản');return;}
  save.mutate({name:form.name.trim(),account:form.account.trim(),owner:form.owner.trim(),enabled:form.enabled});
 };
 return <div className="pc-admin-bank-page">
  <PageTitle eyebrow="THANH TOÁN / QUẢN TRỊ" title="Tài khoản nhận chuyển khoản"
   description="Thay đổi tài khoản ngân hàng ngay trong PawCare. Chỉ Admin có quyền chỉnh sửa; thông tin mới được dùng cho các giao dịch chuyển khoản mới."/>
  <div className="pc-bank-layout">
   <section className="pc-bank-edit">
    <header className="pc-bank-edit-head"><span className="pc-bank-identity"><Landmark size={25}/></span><div><span className="pc-wallet-overline">CẤU HÌNH CỬA HÀNG</span><h2>Thông tin người thụ hưởng</h2><p>Khách hàng sẽ thấy những thông tin này khi chọn chuyển khoản.</p></div></header>
    {settings.isLoading?<Loading/>:settings.error?<ErrorNotice message={errorMessage(settings.error)}/>:
    <form onSubmit={submit} className="pc-bank-form">
     <label><span>Tên ngân hàng</span><input value={form.name} maxLength={80} required minLength={2} placeholder="Ví dụ: MB Bank" onChange={e=>update({name:e.target.value})}/></label>
     <label><span>Số tài khoản nhận tiền</span><input inputMode="numeric" autoComplete="off" pattern="[0-9]{6,32}" value={form.account} maxLength={32} required placeholder="Nhập số tài khoản" onChange={e=>update({account:e.target.value.replace(/\s/g,'')})}/></label>
     <label><span>Tên chủ tài khoản</span><input value={form.owner} maxLength={100} minLength={2} required placeholder="Tên chủ tài khoản theo ngân hàng" onChange={e=>update({owner:e.target.value})}/></label>
     <label className="pc-bank-toggle"><input type="checkbox" checked={form.enabled} onChange={e=>update({enabled:e.target.checked})}/><span><strong>Cho phép khách chọn chuyển khoản</strong><small>Tắt khi cần tạm ngừng nhận chuyển khoản mới. Thanh toán tại cửa hàng vẫn hoạt động.</small></span></label>
     <div className="pc-bank-actions"><button className="button button-primary" type="submit" disabled={save.isPending}><Save size={16}/>{save.isPending?'Đang lưu...':'Lưu cấu hình ngân hàng'}</button><span>{dirty?'Có thay đổi chưa lưu':'Đang dùng cấu hình đã lưu'}</span></div>
    </form>}
   </section>
   <aside className="pc-bank-aside">
    <section className="pc-bank-preview">
     <div className="pc-bank-preview-head"><Banknote size={21}/><span>PREVIEW / PAYMENT</span><span>PAWCARE</span></div>
     <div className="pc-bank-preview-body"><small>THÔNG TIN NHẬN CHUYỂN KHOẢN</small><strong>{form.name||'Tên ngân hàng'}</strong><b>{form.account||'•••• •••• ••••'}</b><span>{form.owner||'Tên chủ tài khoản'}</span></div>
     <div className="pc-bank-preview-foot"><CheckCircle2 size={16}/>{form.enabled?'Đang cho phép chuyển khoản':'Đang tạm ngừng chuyển khoản'}</div>
    </section>
    <section className="pc-bank-guidance"><div><ShieldCheck size={20}/><strong>Quyền hạn và đối soát</strong></div><p>Staff chỉ xem trạng thái đã thanh toán của lịch được giao. Chỉ Admin được xác nhận tiền thực nhận hoặc hoàn tiền.</p><div><Info size={20}/><strong>Lịch hẹn đã tạo</strong></div><p>Tài khoản ngân hàng được lưu theo từng giao dịch chuyển khoản mới. Việc thay đổi cấu hình không tự chuyển hướng các khoản khách đã được hướng dẫn thanh toán.</p><div><LockKeyhole size={20}/><strong>Nguồn cấu hình</strong></div><p>{settings.data?.settings.source==='environment'?'Đang sử dụng thông tin từ Render. Sau khi lưu tại đây, thiết lập của Admin được ưu tiên.':settings.data?.settings.source==='database'?'Đang sử dụng cấu hình Admin đã lưu trong PostgreSQL.':'Chưa có ngân hàng được cấu hình. Bạn có thể thêm tại đây.'}</p></section>
   </aside>
  </div>
 </div>;
}
