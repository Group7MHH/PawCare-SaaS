import {NavLink,Outlet,useLocation} from 'react-router-dom';
import {LayoutDashboard,PawPrint,CalendarPlus,CalendarDays,Users,Scissors,UserRound,LogOut,Menu,X,ChevronRight,Bell,UserCog,ShieldCheck,type LucideIcon} from 'lucide-react';
import {useEffect,useState} from 'react';
import {useAuth} from '../lib/auth';
import {toast} from 'react-hot-toast';
type NavItem={to:string;title:string;icon:LucideIcon};
const customerLinks:NavItem[]=[{to:'/overview',title:'Tổng quan',icon:LayoutDashboard},{to:'/pets',title:'Thú cưng của tôi',icon:PawPrint},{to:'/services',title:'Dịch vụ',icon:Scissors},{to:'/book',title:'Đặt lịch chăm sóc',icon:CalendarPlus},{to:'/my-appointments',title:'Lịch hẹn của tôi',icon:CalendarDays}];
const adminLinks:NavItem[]=[{to:'/admin/dashboard',title:'Tổng quan',icon:LayoutDashboard},{to:'/admin/appointments',title:'Quản lý lịch hẹn',icon:CalendarDays},{to:'/admin/customers',title:'Khách hàng & thú cưng',icon:Users},{to:'/admin/catalog',title:'Dịch vụ & nhân viên',icon:Scissors}];
const staffLinks:NavItem[]=[{to:'/staff/dashboard',title:'Công việc của tôi',icon:LayoutDashboard},{to:'/staff/appointments',title:'Lịch được giao',icon:CalendarDays}];
const adminOnlyLinks:NavItem[]=[{to:'/admin/team',title:'Thành viên cửa hàng',icon:UserCog},{to:'/admin/accounts',title:'Quản lý tài khoản',icon:ShieldCheck}];
const roleName={admin:'Quản trị cửa hàng',staff:'Nhân viên',customer:'Khách hàng'} as const;
export function Layout(){
 const {user,logout}=useAuth();const [open,setOpen]=useState(false);const location=useLocation();
 useEffect(()=>{setOpen(false);},[location.pathname]);
 useEffect(()=>{if(!open)return;const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false);};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[open]);
 if(!user)return null;
 const staff=user.role==='staff',admin=user.role!=='customer';
 const links:NavItem[]=admin?[...(staff?staffLinks:adminLinks),...(user.role==='admin'?adminOnlyLinks:[])]:customerLinks;
 const active=location.pathname.startsWith('/profile')?'Hồ sơ cá nhân':links.find(link=>location.pathname.startsWith(link.to))?.title||'Hồ sơ cá nhân';
 const initial=(user.full_name||'?').charAt(0).toUpperCase();
 const linkClass=({isActive}:{isActive:boolean})=>`sb-link ${isActive?'active':''}`;
 return <div className="app-layout">
  <aside className={`sb ${open?'sidebar-open':''}`} aria-label="Thanh bên">
   <div className="sb-brand"><div className="sb-mark"><PawPrint size={20} fill="currentColor"/></div><div><b>PawCare</b><small>Sổ khám thú cưng</small></div><button type="button" className="icon-button mobile-only sb-close" onClick={()=>setOpen(false)} aria-label="Đóng menu"><X size={20}/></button></div>
   <nav className="sb-nav" aria-label="Điều hướng chính">
    <div className="sb-label">{admin?'Quản lý':'Dành cho bạn'}</div>
    {links.map(({to,title,icon:Icon})=><NavLink key={to} to={to} className={linkClass}><Icon size={18} strokeWidth={1.8}/>{title}</NavLink>)}
    <div className="sb-label sb-gap">Tài khoản</div>
    <NavLink to="/profile" className={linkClass}><UserRound size={18} strokeWidth={1.8}/>Thông tin cá nhân</NavLink>
   </nav>
   <div className="sb-foot"><button type="button" className="sb-user" title="Đăng xuất" aria-label={`Đăng xuất tài khoản ${user.full_name}`} onClick={()=>{setOpen(false);logout().catch(()=>toast.error('Không thể đăng xuất'));}}><span className="avatar">{initial}</span><span className="who"><strong>{user.full_name}</strong><small>{roleName[user.role as keyof typeof roleName]||'Người dùng'}</small></span><span className="out"><LogOut size={17}/></span></button></div>
  </aside>
  {open&&<button type="button" className="sb-scrim mobile-only" onClick={()=>setOpen(false)} aria-label="Đóng menu"/>}
  <div className="main-area">
   <header className="tb">
    <div className="tb-crumb"><button type="button" className="icon-button mobile-only" onClick={()=>setOpen(true)} aria-label="Mở menu"><Menu size={20}/></button><span>{admin?'Quản trị':'Khách hàng'}</span><ChevronRight size={14}/><b>{active}</b></div>
    <div className="tb-right"><span className="tb-date">{new Date().toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span><span className="tb-sep"/><button type="button" className="tb-btn" title="Thông báo" aria-label="Thông báo" onClick={()=>toast('Thông báo mới sẽ được hiển thị tại đây')}><Bell size={18}/></button><NavLink to="/profile" className="tb-profile" title="Thông tin cá nhân" aria-label="Mở hồ sơ tài khoản"><span className="avatar">{initial}</span><span className="n">{user.full_name}</span></NavLink></div>
   </header>
   <main className="page-content"><Outlet/></main>
   <footer className="footer"><span>© {new Date().getFullYear()} PawCare · Sổ khám thú cưng</span><span>Phiên bản 1.0</span></footer>
  </div>
 </div>;
}
