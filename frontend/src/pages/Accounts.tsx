import {useEffect,useState,type FormEvent} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {toast} from 'react-hot-toast';
import {Check,ChevronLeft,ChevronRight,ClipboardCopy,KeyRound,Pencil,ShieldAlert,UserCheck} from 'lucide-react';
import {api,errorMessage,json} from '../lib/api';
import {useAuth} from '../lib/auth';
import {Empty,ErrorNotice,Field,Loading,Modal,PageTitle,Panel,SearchBox,TableWrap} from '../components/UI';

type Account={
 id:number;full_name:string;email:string;phone:string|null;address:string|null;
 role:'customer'|'staff'|'admin';is_active:boolean;created_at:string
};
type AccountForm={full_name:string;email:string;phone:string;address:string};
const roles={admin:'Admin',staff:'Staff',customer:'Customer'};
type AccountDeletionImpact={
 id:number;full_name:string;email:string;role:string;pets:number;
 appointments:number;active_appointments:number;completed_appointments:number;
 completed_revenue:number;care_records:number
};
const initial=(a:Account):AccountForm=>({
 full_name:a.full_name,email:a.email,phone:a.phone||'',address:a.address||''
});

export function Accounts(){
 const {user}=useAuth();
 const qc=useQueryClient();
 const [search,setSearch]=useState(''),[page,setPage]=useState(1);
 const [selected,setSelected]=useState<Account|null>(null);
 const [form,setForm]=useState<AccountForm>({full_name:'',email:'',phone:'',address:''});
 const [adminPassword,setAdminPassword]=useState('');
 const [temporaryPassword,setTemporaryPassword]=useState('');
 const [confirmReset,setConfirmReset]=useState(false);
 const [confirmRole,setConfirmRole]=useState(false);
 const [confirmDelete,setConfirmDelete]=useState(false);
 const [confirmationEmail,setConfirmationEmail]=useState('');
 const [showTemporary,setShowTemporary]=useState(false);
 const [copied,setCopied]=useState(false);
 const list=useQuery({
  queryKey:['admin-accounts',page,search],
  queryFn:()=>api<{items:Account[];total:number}>(`/accounts?page=${page}&limit=15&search=${encodeURIComponent(search)}`)
 });
 const open=(a:Account)=>{
  setSelected(a);setForm(initial(a));setAdminPassword('');
  setTemporaryPassword('');setShowTemporary(false);setConfirmReset(false);setConfirmRole(false);setConfirmDelete(false);setConfirmationEmail('');setCopied(false);
 };
 const close=()=>{
  setSelected(null);setAdminPassword('');setTemporaryPassword('');
  setShowTemporary(false);setConfirmReset(false);setConfirmRole(false);setConfirmDelete(false);setConfirmationEmail('');setCopied(false);
 };
 useEffect(()=>()=>{setTemporaryPassword('');setAdminPassword('');},[]);
 const edit=useMutation({
  mutationFn:()=>api('/accounts/'+selected!.id,json('PATCH',{
   ...form,phone:form.phone||null,address:form.address||null,admin_password:adminPassword
  })),
  onSuccess:()=>{
   toast.success('Đã cập nhật thông tin tài khoản');
   qc.invalidateQueries({queryKey:['admin-accounts']});
   setAdminPassword('');
   close();
  },
  onError:e=>{toast.error(errorMessage(e));setAdminPassword('');}
 });
 const reset=useMutation({
  mutationFn:()=>api<{temporary_password:string}>('/accounts/'+selected!.id+'/reset-password',json('POST',{admin_password:adminPassword})),
  onSuccess:data=>{
   setTemporaryPassword(data.temporary_password);
   setShowTemporary(false);
   setCopied(false);
   setAdminPassword('');
   setConfirmReset(false);
   toast.success('Đã tạo mật khẩu mới và thu hồi các phiên đăng nhập cũ');
  },
  onError:e=>{toast.error(errorMessage(e));setAdminPassword('');setConfirmReset(false);}
 });
 const roleChange=useMutation({
  mutationFn:()=>api<{message:string}>('/accounts/'+selected!.id+'/role',json('PATCH',{
   role:selected!.role==='customer'?'staff':'customer',admin_password:adminPassword
  })),
  onSuccess:data=>{
   toast.success(data.message);
   qc.invalidateQueries({queryKey:['admin-accounts']});
   qc.invalidateQueries({queryKey:['members']});
   qc.invalidateQueries({queryKey:['staff']});
   qc.invalidateQueries({queryKey:['dashboard']});
   setAdminPassword('');
   close();
  },
  onError:e=>{toast.error(errorMessage(e));setAdminPassword('');setConfirmRole(false);}
 });

 const deletePreview=useQuery({
  queryKey:['account-delete-preview',selected?.id],
  queryFn:()=>api<AccountDeletionImpact>('/accounts/'+selected!.id+'/delete-preview'),
  enabled:!!selected&&confirmDelete,
  staleTime:0,
  refetchOnWindowFocus:false
 });
 const deleteAccount=useMutation({
  mutationFn:()=>api<{message:string}>('/accounts/'+selected!.id,json('DELETE',{
   admin_password:adminPassword,
   confirmation_email:confirmationEmail,
   expected_pets:deletePreview.data!.pets,
   expected_appointments:deletePreview.data!.appointments,
   expected_care_records:deletePreview.data!.care_records
  })),
  onSuccess:data=>{
   toast.success(data.message);
   qc.invalidateQueries({queryKey:['admin-accounts']});
   qc.invalidateQueries({queryKey:['members']});
   qc.invalidateQueries({queryKey:['staff']});
   qc.invalidateQueries({queryKey:['dashboard']});
   qc.invalidateQueries({queryKey:['appointments']});
   setPage(1);
   close();
  },
  onError:e=>{toast.error(errorMessage(e));setAdminPassword('');deletePreview.refetch();}
 });
 const copyPassword=async()=>{
  try{await navigator.clipboard.writeText(temporaryPassword);setCopied(true);toast.success('Đã sao chép mật khẩu mới');}
  catch{toast.error('Không thể sao chép. Bạn có thể hiển thị mật khẩu để chép thủ công.');}
 };
 const canManage=selected&&selected.id!==user?.id&&selected.role!=='admin';
 const isBusy=edit.isPending||reset.isPending||roleChange.isPending||deleteAccount.isPending;
 return <>
  <PageTitle eyebrow="QUẢN TRỊ TÀI KHOẢN" title="Quản lý tài khoản" description="Xem Admin, Staff và Customer; cập nhật thông tin, cấp quyền Staff trực tiếp hoặc cấp lại mật khẩu cho tài khoản cần hỗ trợ."/>
  <Panel title="Danh sách tài khoản" sub="Mật khẩu cũ không thể xem lại vì chỉ lưu hash bcrypt. Admin có thể cấp lại mật khẩu mới khi cần.">
   <div className="table-toolbar"><SearchBox value={search} onChange={value=>{setSearch(value);setPage(1);}} placeholder="Tìm theo họ tên hoặc email"/><span className="muted-text" title="Ưu tiên Admin, Staff, Customer; trong từng nhóm sắp theo tên và số tăng dần">{list.data?.total||0} tài khoản · Admin → Staff → Customer</span></div>
   {list.isLoading?<Loading/>:list.error?<ErrorNotice message={errorMessage(list.error)}/>:
    !list.data?.items.length?<Empty title="Không tìm thấy tài khoản"/>:
    <TableWrap><thead><tr><th>HỌ TÊN</th><th>EMAIL ĐĂNG NHẬP</th><th>VAI TRÒ</th><th>TRẠNG THÁI</th><th>MẬT KHẨU</th><th>THAO TÁC</th></tr></thead>
     <tbody>{list.data.items.map(account=><tr key={account.id}>
      <td><strong>{account.full_name}</strong></td><td>{account.email}</td>
      <td>{roles[account.role]}</td><td>{account.is_active?'Hoạt động':'Bị khóa'}</td>
      <td><span className="pc-account-secured" title="Mật khẩu đã được bảo vệ bằng mã băm. Đây không phải trạng thái khóa tài khoản."><KeyRound size={13}/> Đã khóa</span></td>
      <td>{account.id===user?.id||account.role==='admin'?<span className="muted-text">Tự quản lý</span>:
       <button type="button" className="table-action" onClick={()=>open(account)}>Quản lý <Pencil size={13}/></button>}</td>
     </tr>)}</tbody></TableWrap>}
   <div className="pagination"><span>Trang {page} / {Math.max(1,Math.ceil((list.data?.total||0)/15))}</span><div>
    <button className="icon-button" aria-label="Trang trước" disabled={page<=1} onClick={()=>setPage(page-1)}><ChevronLeft size={17}/></button>
    <button className="icon-button" aria-label="Trang sau" disabled={page*15>=(list.data?.total||0)} onClick={()=>setPage(page+1)}><ChevronRight size={17}/></button>
   </div></div>
  </Panel>
  {selected&&<Modal title={temporaryPassword?'Mật khẩu mới đã được cấp':'Quản lý tài khoản'} wide onClose={close}>
   <div className="pc-account-detail">
    <div className="pc-account-summary"><strong>{selected.full_name}</strong><span>{selected.email} · {roles[selected.role]}</span></div>
    {temporaryPassword?<div className="pc-password-result" role="status">
     <p><strong>Chỉ hiển thị lần này.</strong> Sao chép mật khẩu và gửi riêng cho chủ tài khoản qua kênh an toàn. Mật khẩu cũ đã bị vô hiệu hóa.</p>
     <div className="pc-generated-password">
      <code>{showTemporary?temporaryPassword:'•••• •••• •••• •••• •••• ••••'}</code>
      <button type="button" className="button button-secondary" onClick={()=>setShowTemporary(x=>!x)}>{showTemporary?'Ẩn':'Hiện'}</button>
      <button type="button" className="button button-primary" onClick={copyPassword}>{copied?<Check size={15}/>:<ClipboardCopy size={15}/>} Sao chép</button>
     </div>
     <p>Đóng cửa sổ này sẽ xóa mật khẩu tạm khỏi giao diện. Người dùng nên đổi mật khẩu ngay sau khi đăng nhập.</p>
    </div>:<>
     <form className="form-stack" autoComplete="off" onSubmit={(e:FormEvent)=>{e.preventDefault();if(canManage&&!isBusy)edit.mutate();}}>
      <h3 className="pc-account-section">Cập nhật thông tin</h3>
      <Field label="Họ tên"><input required minLength={2} maxLength={120} value={form.full_name} onChange={e=>setForm(f=>({...f,full_name:e.target.value}))}/></Field>
      <Field label="Email đăng nhập"><input type="email" required maxLength={190} value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></Field>
      <div className="form-grid"><Field label="Số điện thoại"><input maxLength={25} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></Field><Field label="Địa chỉ"><input maxLength={255} value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))}/></Field></div>
      <Field label="Mật khẩu hiện tại của Admin (xác minh quyền)"><input type="password" autoComplete="off" required maxLength={100} value={adminPassword} onChange={e=>setAdminPassword(e.target.value)}/></Field>
      <div className="pc-account-actions"><button type="submit" className="button button-primary" disabled={!canManage||isBusy}><Pencil size={15}/> Lưu thay đổi</button></div>
     </form>
     <div className="pc-account-reset pc-account-role">
      <div className="pc-account-reset-title"><UserCheck size={20}/><div>
       <strong>Phân quyền nhân viên</strong>
       <p>{selected.role==='customer'
        ?'Cấp quyền Staff trực tiếp cho Customer đang hoạt động. Không cần link mời.'
        :'Thu hồi quyền Staff, đưa tài khoản về Customer. Không thể thu hồi nếu còn lịch chưa hoàn thành.'}</p>
      </div></div>
      {!confirmRole?
       <button type="button" className="button button-secondary" disabled={!canManage||isBusy||!selected.is_active}
        onClick={()=>{setConfirmRole(true);setConfirmReset(false);}}>
        {selected.role==='customer'?'Cấp quyền Staff':'Thu hồi quyền Staff'}
       </button>:
       <div className="pc-account-confirm">
        <p>Xác nhận <strong>{selected.role==='customer'?'cấp quyền Staff':'thu hồi quyền Staff'}</strong> cho <strong>{selected.full_name}</strong>. Hệ thống sẽ yêu cầu người dùng đăng nhập lại.</p>
        <div className="pc-account-actions">
         <button type="button" className="button button-secondary" onClick={()=>setConfirmRole(false)}>Hủy</button>
         <button type="button" className="button button-primary" disabled={!adminPassword||isBusy}
          onClick={()=>roleChange.mutate()}>Xác nhận đổi quyền</button>
        </div>
       </div>}
     </div>

     <div className="pc-account-reset pc-account-delete">
      <div className="pc-account-reset-title"><ShieldAlert size={20}/><div>
       <strong>Xóa tài khoản vĩnh viễn</strong>
       <p>Xóa toàn bộ dữ liệu liên quan trong PostgreSQL, bao gồm hồ sơ thú cưng, lịch hẹn, hồ sơ chăm sóc và phiên đăng nhập. Không thể hoàn tác.</p>
      </div></div>
      {!confirmDelete?
       <button type="button" className="button button-outline-danger" disabled={!canManage||isBusy}
        onClick={()=>{setConfirmDelete(true);setConfirmRole(false);setConfirmReset(false);setConfirmationEmail('');}}>
        Xem dữ liệu và xóa tài khoản
       </button>:
       <div className="pc-account-confirm">
        {deletePreview.isLoading?<Loading/>:deletePreview.error?<ErrorNotice message={errorMessage(deletePreview.error)}/>:
         deletePreview.data&&<>
          <p><strong>Dữ liệu sẽ bị xóa vĩnh viễn:</strong></p>
          <ul>
           <li>{deletePreview.data.pets} hồ sơ thú cưng</li>
           <li>{deletePreview.data.appointments} lịch hẹn ({deletePreview.data.active_appointments} lịch chưa hoàn tất, {deletePreview.data.completed_appointments} lịch hoàn thành)</li>
           <li>{deletePreview.data.care_records} hồ sơ chăm sóc</li>
           <li>Doanh thu lịch hoàn thành bị xóa: {Number(deletePreview.data.completed_revenue).toLocaleString('vi-VN')} ₫</li>
          </ul>
          <p><strong>Cảnh báo:</strong> Nếu xóa Staff, lịch hẹn của những Customer được Staff đó phục vụ cũng bị xóa. Tài khoản và dữ liệu đã xóa sẽ không thể khôi phục từ giao diện.</p>
          <Field label={`Nhập chính xác email ${selected.email} để xác nhận`}>
           <input type="text" autoComplete="off" spellCheck={false} value={confirmationEmail}
            onChange={e=>setConfirmationEmail(e.target.value)} placeholder={selected.email}/>
          </Field>
          <Field label="Mật khẩu hiện tại của Admin">
           <input type="password" autoComplete="off" value={adminPassword}
            onChange={e=>setAdminPassword(e.target.value)} placeholder="Xác minh quyền xóa"/>
          </Field>
         </>}
        <div className="pc-account-actions">
         <button type="button" className="button button-secondary" onClick={()=>{setConfirmDelete(false);setConfirmationEmail('');}}>Hủy</button>
         <button type="button" className="button button-outline-danger"
          disabled={!deletePreview.data||confirmationEmail.trim().toLowerCase()!==selected.email||!adminPassword||isBusy}
          onClick={()=>deleteAccount.mutate()}>Xác nhận xóa vĩnh viễn</button>
        </div>
       </div>}
     </div>
     <div className="pc-account-reset">
      <div className="pc-account-reset-title"><ShieldAlert size={20}/><div><strong>Đặt lại mật khẩu</strong><p>Cấp mật khẩu ngẫu nhiên mới cho người dùng. Các phiên đăng nhập hiện tại sẽ bị thu hồi.</p></div></div>
      {!confirmReset?<button type="button" className="button button-secondary" disabled={!canManage||isBusy} onClick={()=>{setConfirmReset(true);setConfirmRole(false);}}>Bắt đầu đặt lại mật khẩu</button>:
       <div className="pc-account-confirm"><p>Bạn chắc chắn muốn đặt lại mật khẩu của <strong>{selected.full_name}</strong>?</p><div className="pc-account-actions">
        <button className="button button-secondary" type="button" onClick={()=>setConfirmReset(false)}>Hủy</button>
        <button className="button button-primary" type="button" disabled={!adminPassword||isBusy} onClick={()=>reset.mutate()}>Xác nhận cấp mật khẩu mới</button>
       </div></div>}
     </div>
    </>}
    <div className="modal-actions"><button type="button" className="button button-secondary" onClick={close}>Đóng</button></div>
   </div>
  </Modal>}
 </>;
}
