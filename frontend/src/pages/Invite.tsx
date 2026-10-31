import {useState} from 'react';
import {Link,useNavigate,useParams} from 'react-router-dom';
import {api,json,errorMessage,type User} from '../lib/api';
import {useAuth} from '../lib/auth';
export function Invite(){const {token}=useParams();const {user,updateUser}=useAuth(),navigate=useNavigate();const [error,setError]=useState(''),[pending,setPending]=useState(false);
 const accept=async()=>{if(!token)return;setPending(true);setError('');try{const r=await api<{user:User}>('/auth/accept-invitation',json('POST',{token}));updateUser(r.user);navigate(r.user.role==='customer'?'/overview':r.user.role==='staff'?'/staff/dashboard':'/admin/dashboard');}catch(e){setError(errorMessage(e));}finally{setPending(false);}};
 return <div className="pc-invite-page"><div className="pc-invite-panel"><h1>PawCare · Lời mời tham gia cửa hàng</h1><p>Lời mời chỉ dùng một lần và gắn với một địa chỉ email. Bạn cần đăng nhập bằng đúng email được mời.</p>{error&&<p role="alert">{error}</p>}{user?<><p>Đang đăng nhập: <strong>{user.email}</strong></p><button className="button button-primary" disabled={pending} onClick={accept}>Chấp nhận lời mời</button><p>Nếu sai email, hãy đăng xuất và truy cập lại link mời.</p></>:<div className="row-actions"><Link to="/login" className="button button-primary">Đăng nhập</Link><Link to="/register" className="button button-secondary">Tạo tài khoản</Link><p>Đăng nhập hoặc tạo tài khoản xong, mở lại link mời này để xác nhận.</p></div>}</div></div>;
}
