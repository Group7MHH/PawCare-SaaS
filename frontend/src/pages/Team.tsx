import {Link} from 'react-router-dom';
import {useQuery,useMutation,useQueryClient} from '@tanstack/react-query';
import {toast} from 'react-hot-toast';
import {api,errorMessage,json} from '../lib/api';
import {useAuth} from '../lib/auth';
import {PageTitle,Panel,TableWrap,Loading,ErrorNotice,Empty} from '../components/UI';

type Member={user_id:number;full_name:string;email:string;role:string;is_active:boolean};
export function Team(){
 const {user}=useAuth(),qc=useQueryClient();const id=user?.organization_id;
 const q=useQuery({queryKey:['members',id],queryFn:()=>api<{items:Member[]}>(`/organizations/${id}/members`),enabled:!!id});
 const toggle=useMutation({
  mutationFn:(m:Member)=>api(`/organizations/${id}/members/${m.user_id}`,json('PATCH',{is_active:!m.is_active})),
  onSuccess:()=>{qc.invalidateQueries({queryKey:['members',id]});qc.invalidateQueries({queryKey:['staff']});qc.invalidateQueries({queryKey:['admin-accounts']});toast.success('Đã cập nhật trạng thái nhân viên');},
  onError:e=>toast.error(errorMessage(e))
 });
 return <><PageTitle eyebrow="NHÂN SỰ" title="Thành viên cửa hàng"
  description="Danh sách Staff và Admin. Cấp hoặc thu hồi quyền Staff trực tiếp trong Quản lý tài khoản."
  action={<Link className="button button-primary" to="/admin/accounts">Quản lý tài khoản</Link>}/>
  {!id?<ErrorNotice message="Cửa hàng chưa được cấu hình"/>:
   <Panel title="Nhân sự & vai trò" sub="Không sử dụng lời mời bằng liên kết.">
    {q.isLoading?<Loading/>:q.error?<ErrorNotice message={errorMessage(q.error)}/>:
     !q.data?.items.length?<Empty title="Chưa có thành viên"/>:
     <TableWrap><thead><tr><th>HỌ TÊN</th><th>EMAIL</th><th>VAI TRÒ</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead>
      <tbody>{q.data.items.map(m=><tr key={m.user_id}>
       <td><strong>{m.full_name}</strong></td><td>{m.email}</td><td>{m.role.toUpperCase()}</td>
       <td>{m.is_active?'Hoạt động':'Đã khóa'}</td>
       <td>{m.role==='staff'?
         <button type="button" className="table-action" disabled={toggle.isPending} onClick={()=>toggle.mutate(m)}>
          {m.is_active?'Khóa nhân viên':'Mở khóa nhân viên'}
         </button>:<span className="muted-text">Admin</span>}</td>
      </tr>)}</tbody></TableWrap>}
   </Panel>}
 </>;
}
