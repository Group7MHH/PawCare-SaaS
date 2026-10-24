import {useState,type FormEvent} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {toast} from 'react-hot-toast';
import {Building2,Plus,ShieldCheck,UserPlus,Link2} from 'lucide-react';
import {api,json,errorMessage,type Organization} from '../lib/api';
import {useAuth} from '../lib/auth';
import {PageTitle,Panel,Loading,ErrorNotice,Empty,Field,TableWrap} from '../components/UI';
type Member={user_id:number;full_name:string;email:string;role:'admin'|'staff';is_active:boolean};
const error=(e:unknown)=>toast.error(errorMessage(e));
export function OwnerConsole(){
 const {user,selectOrganization}=useAuth(),qc=useQueryClient();
 const [name,setName]=useState(''),[slug,setSlug]=useState(''),[selected,setSelected]=useState<number|null>(null);
 const [email,setEmail]=useState(''),[role,setRole]=useState<'admin'|'staff'>('admin'),[invite,setInvite]=useState('');
 const [ownerEmail,setOwnerEmail]=useState(''),[ownerPassword,setOwnerPassword]=useState('');
 const orgs=useQuery({queryKey:['organizations'],queryFn:()=>api<{items:Organization[]}>('/organizations')});
 const activeId=selected??user?.organization_id??null;
 const members=useQuery({queryKey:['members',activeId],queryFn:()=>api<{items:Member[]}>(`/organizations/${activeId}/members`),enabled:!!activeId});
 const create=useMutation({mutationFn:()=>api('/owner/organizations',json('POST',{name,slug})),onSuccess:()=>{toast.success('Đã tạo cửa hàng');setName('');setSlug('');qc.invalidateQueries({queryKey:['organizations']});},onError:error});
 const inviteUser=useMutation({mutationFn:()=>api<{invite_url:string}>(`/organizations/${activeId}/invitations`,json('POST',{email,role})),onSuccess:r=>{setInvite(r.invite_url);toast.success('Đã tạo link mời');setEmail('');},onError:error});
 const toggle=useMutation({mutationFn:({id,enabled}:{id:number;enabled:boolean})=>api(`/owner/organizations/${id}`,json('PATCH',{is_active:enabled})),onSuccess:()=>qc.invalidateQueries({queryKey:['organizations']}),onError:error});
 const modify=useMutation({mutationFn:({userId,changes}:{userId:number;changes:{role?:'admin'|'staff';is_active?:boolean}})=>api(`/organizations/${activeId}/members/${userId}`,json('PATCH',changes)),onSuccess:()=>{qc.invalidateQueries({queryKey:['members',activeId]});toast.success('Đã cập nhật phân quyền');},onError:error});
 const promote=useMutation({mutationFn:()=>api('/owner/owners',json('POST',{email:ownerEmail,current_password:ownerPassword})),onSuccess:()=>{toast.success('Đã cấp quyền Owner');setOwnerEmail('');setOwnerPassword('');},onError:error});
 return <><PageTitle eyebrow="CHỦ NỀN TẢNG" title="Owner · Quản trị PawCare SaaS" description="Tạo cửa hàng, cấp Admin hoặc Staff theo từng cửa hàng; Owner có quyền toàn nền tảng."/>
 <div className="content-grid bottom-grid">
  <Panel title="Tạo cửa hàng mới" sub="Mỗi cửa hàng có dịch vụ, nhân viên và lịch hẹn riêng trên cùng PostgreSQL">
   <form className="form-stack" onSubmit={(e:FormEvent)=>{e.preventDefault();create.mutate();}}><Field label="Tên cửa hàng"><input required minLength={2} maxLength={160} value={name} placeholder="PawCare Hà Nội" onChange={e=>{setName(e.target.value);setSlug(e.target.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''));}}/></Field><Field label="Mã cửa hàng (URL-friendly)"><input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={e=>setSlug(e.target.value)}/></Field><button className="button button-primary" disabled={create.isPending}><Plus size={16}/> Tạo cửa hàng</button></form>
  </Panel>
  <Panel title="Danh sách cửa hàng" sub="Chọn một cửa hàng để quản lý thành viên và dịch vụ">
   {orgs.isLoading?<Loading/>:orgs.error?<ErrorNotice message={errorMessage(orgs.error)}/>:!orgs.data?.items.length?<Empty title="Chưa có cửa hàng"/>:<div className="form-stack">{orgs.data.items.map(o=><div key={o.id} className="pc-owner-shop"><div><strong>{o.name}</strong><small> {o.slug} · {o.is_active?'Đang hoạt động':'Đã tạm khóa'}</small></div><div className="row-actions"><button className="table-action" type="button" onClick={()=>setSelected(o.id)}><Building2 size={15}/> Thành viên</button><button className="table-action" disabled={!o.is_active} onClick={()=>selectOrganization(o.id).catch(error)}>Vào cửa hàng</button><button className="table-action" onClick={()=>toggle.mutate({id:o.id,enabled:!o.is_active})}>{o.is_active?'Tạm khóa':'Mở lại'}</button></div></div>)}</div>}
  </Panel>
 </div>
 {activeId&&<Panel title="Thành viên của cửa hàng" sub="Owner có thể nâng Staff thành Admin, hạ quyền hoặc khóa thành viên trong đúng cửa hàng">
  {members.isLoading?<Loading/>:members.error?<ErrorNotice message={errorMessage(members.error)}/>:<TableWrap><thead><tr><th>THÀNH VIÊN</th><th>VAI TRÒ</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead><tbody>{members.data?.items.map(m=><tr key={m.user_id}><td><strong>{m.full_name}</strong><small className="sub-cell">{m.email}</small></td><td>{m.role}</td><td>{m.is_active?'Đang hoạt động':'Đã khóa'}</td><td><div className="row-actions"><button className="table-action" onClick={()=>modify.mutate({userId:m.user_id,changes:{role:m.role==='admin'?'staff':'admin'}})}>{m.role==='admin'?'Hạ Staff':'Cấp Admin'}</button><button className="table-action" onClick={()=>modify.mutate({userId:m.user_id,changes:{is_active:!m.is_active}})}>{m.is_active?'Khóa':'Mở khóa'}</button></div></td></tr>)}</tbody></TableWrap>}
 </Panel>}
 {activeId&&<Panel title="Mời Admin hoặc Staff" sub="Người nhận tự đăng ký bằng email được mời và chấp nhận link; không cần chia sẻ mật khẩu">
  <form className="form-stack" onSubmit={(e:FormEvent)=>{e.preventDefault();setInvite('');inviteUser.mutate();}}><div className="form-grid"><Field label="Email người được mời"><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="nhanvien@example.com"/></Field><Field label="Vai trò"><select value={role} onChange={e=>setRole(e.target.value as 'admin'|'staff')}><option value="admin">Admin cửa hàng</option><option value="staff">Staff</option></select></Field></div><button className="button button-primary" disabled={inviteUser.isPending}><UserPlus size={16}/> Tạo lời mời</button>{invite&&<div className="pc-invite"><div><Link2 size={16}/> Link mời (hiệu lực 7 ngày, dùng một lần):</div><input readOnly aria-label="Link mời" value={invite}/><button type="button" className="button button-secondary" onClick={()=>navigator.clipboard.writeText(invite).then(()=>toast.success('Đã sao chép')).catch(error)}>Sao chép link</button></div>}</form>
 </Panel>}
 <Panel title="Ủy quyền Owner khác" sub="Chỉ Owner hiện tại có thể cấp Owner nền tảng; cần nhập lại mật khẩu để xác nhận">
 <form className="form-stack" onSubmit={(e:FormEvent)=>{e.preventDefault();if(confirm('Cấp quyền OWNER toàn hệ thống cho tài khoản này?'))promote.mutate();}}><div className="form-grid"><Field label="Email tài khoản đã đăng ký"><input type="email" required value={ownerEmail} onChange={e=>setOwnerEmail(e.target.value)}/></Field><Field label="Mật khẩu Owner hiện tại"><input type="password" required value={ownerPassword} onChange={e=>setOwnerPassword(e.target.value)}/></Field></div><button className="button button-primary" disabled={promote.isPending}><ShieldCheck size={16}/> Cấp quyền Owner</button></form>
 </Panel>
 </>;
}
