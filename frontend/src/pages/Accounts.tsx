import {useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {toast} from 'react-hot-toast';
import {ChevronLeft,ChevronRight,KeyRound,ShieldAlert,UserCheck} from 'lucide-react';
import {api,errorMessage,json} from '../lib/api';
import {useAuth} from '../lib/auth';
import {Empty,ErrorNotice,Field,Loading,Modal,PageTitle,Panel,SearchBox,TableWrap} from '../components/UI';

type Account={
 id:number;full_name:string;email:string;phone:string|null;address:string|null;
 role:'customer'|'staff'|'admin';is_active:boolean;created_at:string
};
const roles={admin:'Admin',staff:'Staff',customer:'Customer'};
type AccountDeletionImpact={
 id:number;full_name:string;email:string;role:string;pets:number;
 appointments:number;active_appointments:number;completed_appointments:number;
 completed_revenue:number;care_records:number
};

export function Accounts(){
 const {user}=useAuth();
 const qc=useQueryClient();
 const [search,setSearch]=useState(''),[page,setPage]=useState(1);
 const [selected,setSelected]=useState<Account|null>(null);
 const [adminPassword,setAdminPassword]=useState('');
 const [confirmRole,setConfirmRole]=useState(false);
 const [confirmDelete,setConfirmDelete]=useState(false);
 const [confirmationEmail,setConfirmationEmail]=useState('');
 const list=useQuery({
  queryKey:['admin-accounts',page,search],
  queryFn:()=>api<{items:Account[];total:number}>(`/accounts?page=${page}&limit=15&search=${encodeURIComponent(search)}`)
 });
 const open=(a:Account)=>{setSelected(a);setAdminPassword('');setConfirmRole(false);setConfirmDelete(false);setConfirmationEmail('');};
 const close=()=>{setSelected(null);setAdminPassword('');setConfirmRole(false);setConfirmDelete(false);setConfirmationEmail('');};
 const roleChange=useMutation({
  mutationFn:()=>api<{message:string}>('/accounts/'+selected!.id+'/role',json('PATCH',{
   role:'customer',admin_password:adminPassword
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
 const canManage=selected&&selected.id!==user?.id&&selected.role!=='admin';
 const isBusy=roleChange.isPending||deleteAccount.isPending;
 return <>
  <PageTitle eyebrow="QUẢN TRỊ TÀI KHOẢN" title="Quản lý tài khoản" description="Xem tài khoản trong cửa hàng. Admin chỉ có thể thu hồi quyền Staff hoặc xóa tài khoản theo quy trình xác nhận."/>
  <Panel title="Danh sách tài khoản" sub="Mật khẩu được lưu an toàn bằng mã băm. Admin không thể truy cập hay thay đổi mật khẩu người dùng.">
   <div className="table-toolbar"><SearchBox value={search} onChange={value=>{setSearch(value);setPage(1);}} placeholder="Tìm theo họ tên hoặc email"/><span className="muted-text" title="Ưu tiên Admin, Staff, Customer; trong từng nhóm sắp theo tên và số tăng dần">{list.data?.total||0} tài khoản · Admin → Staff → Customer</span></div>
   {list.isLoading?<Loading/>:list.error?<ErrorNotice message={errorMessage(list.error)}/>:
    !list.data?.items.length?<Empty title="Không tìm thấy tài khoản"/>:
    <TableWrap><thead><tr><th>HỌ TÊN</th><th>EMAIL ĐĂNG NHẬP</th><th>VAI TRÒ</th><th>TRẠNG THÁI</th><th>MẬT KHẨU</th><th>THAO TÁC</th></tr></thead>
     <tbody>{list.data.items.map(account=><tr key={account.id}>
      <td><strong>{account.full_name}</strong></td><td>{account.email}</td>
      <td>{roles[account.role]}</td><td>{account.is_active?'Hoạt động':'Bị khóa'}</td>
      <td><span className="pc-account-secured" title="Mật khẩu đã được bảo vệ bằng mã băm. Đây không phải trạng thái khóa tài khoản."><KeyRound size={13}/> Đã khóa</span></td>
      <td>{account.id===user?.id||account.role==='admin'?<span className="muted-text">Tự quản lý</span>:
       <button type="button" className="table-action" onClick={()=>open(account)}>Quản lý</button>}</td>
     </tr>)}</tbody></TableWrap>}
   <div className="pagination"><span>Trang {page} / {Math.max(1,Math.ceil((list.data?.total||0)/15))}</span><div>
    <button className="icon-button" aria-label="Trang trước" disabled={page<=1} onClick={()=>setPage(page-1)}><ChevronLeft size={17}/></button>
    <button className="icon-button" aria-label="Trang sau" disabled={page*15>=(list.data?.total||0)} onClick={()=>setPage(page+1)}><ChevronRight size={17}/></button>
   </div></div>
  </Panel>
  {selected&&<Modal title="Quản lý tài khoản" wide onClose={close}>
   <div className="pc-account-detail">
    <div className="pc-account-summary"><strong>{selected.full_name}</strong><span>{selected.email} · {roles[selected.role]}</span></div>
     {selected.role==='staff'&&<div className="pc-account-reset pc-account-role">
      <div className="pc-account-reset-title"><UserCheck size={20}/><div>
       <strong>Thu hồi quyền Staff</strong>
       <p>Đưa tài khoản về Customer. Không thể thu hồi nếu còn lịch chăm sóc chưa hoàn thành.</p>
      </div></div>
      {!confirmRole?<button type="button" className="button button-secondary" disabled={!canManage||isBusy||!selected.is_active} onClick={()=>{setConfirmRole(true);setConfirmDelete(false);setAdminPassword('');}}>Thu hồi quyền Staff</button>:
       <div className="pc-account-confirm">
        <p>Xác nhận <strong>thu hồi quyền Staff</strong> của <strong>{selected.full_name}</strong>. Người dùng sẽ cần đăng nhập lại.</p>
        <Field label="Mật khẩu Admin để xác minh"><input type="password" autoComplete="off" value={adminPassword} onChange={e=>setAdminPassword(e.target.value)}/></Field>
        <div className="pc-account-actions">
         <button type="button" className="button button-secondary" onClick={()=>{setConfirmRole(false);setAdminPassword('');}}>Hủy</button>
         <button type="button" className="button button-primary" disabled={!adminPassword||isBusy} onClick={()=>roleChange.mutate()}>Xác nhận thu hồi quyền</button>
        </div>
       </div>}
     </div>}
     <div className="pc-account-reset pc-account-delete">
      <div className="pc-account-reset-title"><ShieldAlert size={20}/><div>
       <strong>Xóa tài khoản vĩnh viễn</strong>
       <p>Xóa toàn bộ dữ liệu liên quan trong PostgreSQL, bao gồm hồ sơ thú cưng, lịch hẹn, hồ sơ chăm sóc và phiên đăng nhập. Không thể hoàn tác.</p>
      </div></div>
      {!confirmDelete?
       <button type="button" className="button button-outline-danger" disabled={!canManage||isBusy}
        onClick={()=>{setConfirmDelete(true);setConfirmRole(false);setConfirmationEmail('');}}>
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
          <p className="form-hint form-hint-error" role="alert"><strong>Cảnh báo:</strong> Xóa vĩnh viễn sẽ xóa cả lịch hẹn, hồ sơ chăm sóc và bản ghi thanh toán liên quan, kể cả giao dịch đã thanh toán hoặc đang đối soát. Doanh thu thống kê sẽ giảm tương ứng. Không thể hoàn tác.</p>
          {selected.role==='staff'&&deletePreview.data.appointments>0&&<p className="form-hint form-hint-error"><strong>Lưu ý:</strong> Xóa Staff cũng xóa {deletePreview.data.appointments} lịch được giao cho nhân viên này, kể cả lịch của Customer khác.</p>}
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
          disabled={!deletePreview.data||deletePreview.isFetching||confirmationEmail.trim().toLowerCase()!==selected.email||!adminPassword||isBusy}
          onClick={()=>deleteAccount.mutate()}>Xác nhận xóa vĩnh viễn</button>
        </div>
       </div>}
     </div>
    <div className="modal-actions"><button type="button" className="button button-secondary" onClick={close}>Đóng</button></div>
   </div>
  </Modal>}
 </>;
}
