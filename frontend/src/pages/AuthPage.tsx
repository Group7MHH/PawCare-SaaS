import {useState,type FormEvent} from 'react';
import {Link,Navigate} from 'react-router-dom';
import {ArrowRight,Eye,EyeOff,PawPrint,ShieldCheck,CalendarCheck2,ClipboardList,Stethoscope,LoaderCircle} from 'lucide-react';
import {toast} from 'react-hot-toast';
import {useAuth} from '../lib/auth';
import {errorMessage} from '../lib/api';
export function AuthPage({mode}:{mode:'login'|'register'}){
 const {user,loading,login,register}=useAuth();
 const [busy,setBusy]=useState(false),[visible,setVisible]=useState(false);
 const [form,setForm]=useState({full_name:'',email:'',password:'',phone:''});
 if(loading)return <div className="auth-loading" role="status"><LoaderCircle size={24} className="spin"/>Đang tải...</div>;
 if(user)return <Navigate to={user.role==='customer'?'/overview':user.role==='staff'?'/staff/dashboard':'/admin/dashboard'} replace/>;
 const isLogin=mode==='login';
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);try{if(isLogin)await login(form.email,form.password);else await register(form);toast.success(isLogin?'Đăng nhập thành công':'Tạo tài khoản thành công');}catch(err){toast.error(errorMessage(err));}finally{setBusy(false);}}
 return <div className="auth-shell">
  <section className="au-story" aria-label="Giới thiệu PawCare">
   <div className="au-logo"><span className="sb-mark"><PawPrint size={21} fill="currentColor"/></span>PawCare</div>
   <div>
    <h1>Sổ khám của bé, <em>luôn trong tầm tay.</em></h1>
    <p className="lead">Lưu hồ sơ thú cưng, theo dõi hành trình chăm sóc và đặt lịch với cửa hàng chỉ trong vài bước.</p>
    <div className="au-book">
     <div><ClipboardList size={20}/><span>Hồ sơ từng bé được ghi chép rõ ràng</span></div>
     <div><CalendarCheck2 size={20}/><span>Đặt lịch nhiều dịch vụ trong một lần</span></div>
     <div><Stethoscope size={20}/><span>Nhân viên cập nhật kết quả chăm sóc</span></div>
    </div>
   </div>
   <small>© {new Date().getFullYear()} PawCare · Sổ khám thú cưng</small>
  </section>
  <div className="auth-form-area"><div className="auth-card">
   <div className="au-mbrand"><span className="sb-mark"><PawPrint size={20} fill="currentColor"/></span>PawCare</div>
   <span className="eyebrow">{isLogin?'Đăng nhập':'Tạo tài khoản'}</span>
   <h2>{isLogin?'Chào mừng Phương Anh quay lại':'Bắt đầu cuốn sổ của bé'}</h2>
   <p>{isLogin?'Đăng nhập để tiếp tục quản lý lịch chăm sóc.':'Tạo tài khoản để lưu hồ sơ và đặt lịch cho thú cưng.'}</p>
   <form onSubmit={submit} className="form-stack">
    {!isLogin&&<label className="field"><span>Họ và tên</span><input autoComplete="name" required minLength={2} placeholder="Nguyễn Văn A" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></label>}
    <label className="field"><span>Địa chỉ email</span><input type="email" autoComplete="email" required placeholder="ban@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
    {!isLogin&&<label className="field"><span>Số điện thoại (tùy chọn)</span><input type="tel" autoComplete="tel" placeholder="09xxxxxxxx" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>}
    <label className="field"><span>Mật khẩu</span><span className="password-wrap"><input minLength={8} required type={visible?'text':'password'} autoComplete={isLogin?'current-password':'new-password'} placeholder="Ít nhất 8 ký tự" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/><button type="button" aria-label={visible?'Ẩn mật khẩu':'Hiện mật khẩu'} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={17}/>:<Eye size={17}/>}</button></span></label>
    <button className="button button-primary btn-full" type="submit" disabled={busy}>{busy?'Đang xử lý...':isLogin?'Đăng nhập':'Tạo tài khoản'}{!busy&&<ArrowRight size={17}/>}</button>
   </form>
   <div className="auth-switch">{isLogin?'Chưa có tài khoản?':'Đã có tài khoản?'} <Link to={isLogin?'/register':'/login'}>{isLogin?'Đăng ký ngay':'Đăng nhập'}</Link></div>
   <div className="auth-security"><ShieldCheck size={15}/>Thông tin được bảo vệ bằng phiên đăng nhập an toàn</div>
  </div></div>
 </div>;
}
