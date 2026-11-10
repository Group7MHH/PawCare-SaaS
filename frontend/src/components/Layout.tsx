import {NavLink,Outlet,useLocation} from 'react-router-dom';
import {LayoutDashboard,PawPrint,CalendarPlus,CalendarDays,Users,Scissors,UserRound,LogOut,Menu,X,ChevronRight,Bell,UserCog,ShieldCheck,BookHeart,PanelLeftClose,PanelLeftOpen,Bookmark,ArrowUpRight,type LucideIcon} from 'lucide-react';
import {useEffect,useState} from 'react';
import {useAuth} from '../lib/auth';
import {toast} from 'react-hot-toast';

type NavItem={to:string;title:string;icon:LucideIcon};
const customerLinks:NavItem[]=[{to:'/overview',title:'Tổng quan',icon:LayoutDashboard},{to:'/pets',title:'Thú cưng của tôi',icon:PawPrint},{to:'/services',title:'Dịch vụ',icon:Scissors},{to:'/book',title:'Đặt lịch chăm sóc',icon:CalendarPlus},{to:'/my-appointments',title:'Lịch hẹn của tôi',icon:CalendarDays}];
const adminLinks:NavItem[]=[{to:'/admin/dashboard',title:'Tổng quan',icon:LayoutDashboard},{to:'/admin/appointments',title:'Quản lý lịch hẹn',icon:CalendarDays},{to:'/admin/customers',title:'Khách hàng & thú cưng',icon:Users},{to:'/admin/catalog',title:'Dịch vụ & nhân viên',icon:Scissors}];
const staffLinks:NavItem[]=[{to:'/staff/dashboard',title:'Công việc của tôi',icon:LayoutDashboard},{to:'/staff/appointments',title:'Lịch được giao',icon:CalendarDays}];
const adminOnlyLinks:NavItem[]=[{to:'/admin/team',title:'Thành viên cửa hàng',icon:UserCog},{to:'/admin/accounts',title:'Quản lý tài khoản',icon:ShieldCheck}];
const roleName={admin:'Quản trị viên',staff:'Nhân viên',customer:'Khách hàng'} as const;
const roleTab={admin:'QUẢN TRỊ',staff:'NHÂN VIÊN',customer:'CHĂM SÓC'} as const;
const roleLabel={admin:'Điều hành cửa hàng',staff:'Góc làm việc',customer:'Sổ sức khỏe'} as const;

export function Layout(){
 const {user,logout}=useAuth();
 const [open,setOpen]=useState(false);
 const [collapsed,setCollapsed]=useState(()=>{try{return window.localStorage.getItem('pawcare:notebook-collapsed')==='true';}catch{return false;}});
 const location=useLocation();
 useEffect(()=>{setOpen(false);},[location.pathname]);
 useEffect(()=>{try{window.localStorage.setItem('pawcare:notebook-collapsed',String(collapsed));}catch{/* Private browsing / storage disabled */}},[collapsed]);
 useEffect(()=>{
  if(!open)return;
  const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false);};
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  window.addEventListener('keydown',onKey);
  return()=>{document.body.style.overflow=previousOverflow;window.removeEventListener('keydown',onKey);};
 },[open]);
 if(!user)return null;
 const staff=user.role==='staff',admin=user.role!=='customer';
 const links:NavItem[]=admin?[...(staff?staffLinks:adminLinks),...(user.role==='admin'?adminOnlyLinks:[])]:customerLinks;
 const active=location.pathname.startsWith('/profile')?'Hồ sơ cá nhân':links.find(link=>location.pathname===link.to||location.pathname.startsWith(link.to+'/'))?.title||'Sổ chăm sóc';
 const initial=(user.full_name||'?').charAt(0).toUpperCase();
 const linkClass=({isActive}:{isActive:boolean})=>`sb-link nb-nav-link ${isActive?'active':''}`;
 return <div className={`app-layout nb-app nb-role-${user.role} ${collapsed?'nb-collapsed':''}`}>
  <a className="nb-skip-link" href="#main-content">Bỏ qua menu, tới nội dung chính</a>
  <aside id="pawcare-notebook-sidebar" className={`sb nb-sidebar ${open?'sidebar-open':''}`} aria-label="Thanh điều hướng PawCare">
   <div className="nb-spine" aria-hidden="true"><i/><i/><i/><i/><i/></div>
   <div className="sb-brand nb-brand">
    <div className="sb-mark nb-logo"><PawPrint size={23} fill="currentColor"/></div>
    <div className="nb-brand-words"><b>PawCare</b><small>THE PET CARE JOURNAL</small></div>
    <button type="button" className="icon-button mobile-only sb-close" onClick={()=>setOpen(false)} aria-label="Đóng menu"><X size={21}/></button>
   </div>
   <div className="nb-book-identity"><BookHeart size={16}/><span>{roleLabel[user.role]}</span><span className="nb-book-identity-mark" aria-hidden="true">✳</span></div>
   <nav className="sb-nav nb-nav" aria-label="Điều hướng chính">
    <div className="sb-label nb-nav-heading">MỤC LỤC <span>01 / 02</span></div>
    {links.map(({to,title,icon:Icon},index)=><NavLink key={to} to={to} className={linkClass} title={collapsed?title:undefined} aria-label={title}>
      <span className="nb-link-icon"><Icon size={19} strokeWidth={1.85}/></span>
      <span className="nb-link-text">{title}</span>
      <span className="nb-link-index" aria-hidden="true">{String(index+1).padStart(2,'0')}</span>
     </NavLink>)}
    <div className="sb-label sb-gap nb-nav-heading">TÀI KHOẢN <span>02 / 02</span></div>
    <NavLink to="/profile" className={linkClass} title={collapsed?'Thông tin cá nhân':undefined} aria-label="Thông tin cá nhân"><span className="nb-link-icon"><UserRound size={19}/></span><span className="nb-link-text">Thông tin cá nhân</span><span className="nb-link-index" aria-hidden="true"><ChevronRight size={15}/></span></NavLink>
   </nav>
   <div className="nb-sidebar-stamp" aria-hidden="true"><Bookmark size={17}/><span>CHĂM SÓC TỪ NHỮNG ĐIỀU NHỎ NHẤT</span></div>
   <div className="sb-foot nb-foot">
    <button type="button" className="nb-collapse-toggle" onClick={()=>setCollapsed(c=>!c)} aria-label={collapsed?'Mở rộng thanh điều hướng':'Thu gọn thanh điều hướng'} aria-expanded={!collapsed} aria-controls="pawcare-notebook-sidebar" title={collapsed?'Mở rộng sidebar':'Thu gọn sidebar'}>{collapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}<span>Thu gọn sổ</span></button>
    <button type="button" className="sb-user" title="Đăng xuất" aria-label={`Đăng xuất tài khoản ${user.full_name}`} onClick={()=>{setOpen(false);logout().catch(()=>toast.error('Không thể đăng xuất'));}}><span className="avatar nb-user-avatar">{initial}</span><span className="who"><strong>{user.full_name}</strong><small>{roleName[user.role]}</small></span><span className="out"><LogOut size={17}/></span></button>
   </div>
   <div className="nb-edge-tab" aria-hidden="true"><Bookmark size={14} fill="currentColor"/><span>{roleTab[user.role]}</span></div>
  </aside>
  {open&&<button type="button" className="sb-scrim mobile-only" onClick={()=>setOpen(false)} aria-label="Đóng menu"/>}
  <div className="main-area nb-main-area">
   <header className="tb nb-toolbar">
    <div className="tb-crumb nb-breadcrumb"><button type="button" className="icon-button mobile-only nb-mobile-toggle" onClick={()=>setOpen(true)} aria-label="Mở menu" aria-expanded={open} aria-controls="pawcare-notebook-sidebar"><Menu size={22}/></button><span className="nb-toolbar-overline">PAWCARE JOURNAL</span><ChevronRight size={14}/><b>{active}</b></div>
    <div className="tb-right nb-toolbar-actions"><span className="tb-date">{new Date().toLocaleDateString('vi-VN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</span><span className="tb-sep"/><span className="nb-toolbar-role">{roleTab[user.role]}</span><button type="button" className="tb-btn" aria-label="Thông báo" title="Thông báo" onClick={()=>toast('Thông báo mới sẽ được hiển thị tại đây')}><Bell size={18}/></button><NavLink to="/profile" className="tb-profile" aria-label="Mở hồ sơ tài khoản"><span className="avatar">{initial}</span><span className="n">{user.full_name}</span><ArrowUpRight size={14}/></NavLink></div>
   </header>
   <main id="main-content" className="page-content nb-page-content"><Outlet/></main>
   <footer className="footer nb-footer"><span>© {new Date().getFullYear()} PawCare <span aria-hidden="true">✳</span> Chăm sóc từ những điều nhỏ nhất</span><span>Pet Care Journal · 01</span></footer>
  </div>
 </div>;
}
