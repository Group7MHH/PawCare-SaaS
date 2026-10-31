import {useState,type FormEvent} from 'react';
import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {toast} from 'react-hot-toast';
import {api,errorMessage,json} from '../lib/api';
import {useAuth} from '../lib/auth';
import {PageTitle,Panel,Field,TableWrap,Loading,ErrorNotice,Empty} from '../components/UI';
type Member={user_id:number;full_name:string;email:string;role:string;is_active:boolean};
export function Team(){const {user}=useAuth(),qc=useQueryClient();const [email,setEmail]=useState(''),[invite,setInvite]=useState('');const id=user?.organization_id;
 const q=useQuery({queryKey:['members',id],queryFn:()=>api<{items:Member[]}>(`/organizations/${id}/members`),enabled:!!id});
 const send=useMutation({mutationFn:()=>api<{invite_url:string}>(`/organizations/${id}/invitations`,json('POST',{email,role:'staff'})),onSuccess:r=>{setInvite(r.invite_url);setEmail('');toast.success('Đã tạo lời mời Staff');},onError:e=>toast.error(errorMessage(e))});
 const toggle=useMutation({mutationFn:(m:Member)=>api(`/organizations/${id}/members/${m.user_id}`,json('PATCH',{is_active:!m.is_active})),onSuccess:()=>qc.invalidateQueries({queryKey:['members',id]}),onError:e=>toast.error(errorMessage(e))});
 return <><PageTitle eyebrow="NHÂN SỰ" title="Thành viên cửa hàng" description="Admin chỉ có thể thêm và khóa Staff thuộc cửa hàng mình. Admin quản lý nhân viên của cửa hàng."/>
 {!id?<ErrorNotice message="Vui lòng chọn cửa hàng"/>:<><Panel title="Gửi lời mời nhân viên" sub="Ví dụ: Trần Mạnh Hùng có thể tạo tài khoản bằng email riêng và nhận quyền Staff sau khi chấp nhận lời mời"><form className="form-stack" onSubmit={(e:FormEvent)=>{e.preventDefault();setInvite('');send.mutate();}}><Field label="Email nhân viên"><input type="email" required value={email} placeholder="hung@example.com" onChange={e=>setEmail(e.target.value)}/></Field><button className="button button-primary" disabled={send.isPending}>Tạo link mời Staff</button>{invite&&<div className="pc-invite"><strong>Gửi riêng link dưới đây (dùng một lần, hết hạn sau 7 ngày):</strong><input readOnly value={invite}/><button className="button button-secondary" type="button" onClick={()=>navigator.clipboard.writeText(invite).then(()=>toast.success('Đã sao chép'))}>Sao chép link</button></div>}</form></Panel>
 <Panel title="Nhân sự & vai trò">{q.isLoading?<Loading/>:q.error?<ErrorNotice message={errorMessage(q.error)}/>:!q.data?.items.length?<Empty title="Chưa có thành viên"/>:<TableWrap><thead><tr><th>HỌ TÊN</th><th>EMAIL</th><th>VAI TRÒ</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead><tbody>{q.data.items.map(m=><tr key={m.user_id}><td><strong>{m.full_name}</strong></td><td>{m.email}</td><td>{m.role.toUpperCase()}</td><td>{m.is_active?'Hoạt động':'Đã khóa'}</td><td>{m.role==='staff'?<button className="table-action" onClick={()=>toggle.mutate(m)}>{m.is_active?'Khóa tại cửa hàng':'Mở khóa'}</button>:<span className="muted-text">Owner quản lý</span>}</td></tr>)}</tbody></TableWrap>}</Panel></>}
 </>;
}
