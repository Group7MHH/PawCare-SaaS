import {Link} from 'react-router-dom';
import {ArrowRight,ArrowUpRight,BookHeart,CalendarDays,CalendarPlus,CreditCard,PawPrint,Scissors} from 'lucide-react';
import {useAuth} from '../lib/auth';
import {CompanionCover,PawcareMark} from '../components/BrandArtwork';
import {greeting} from '../lib/greeting';

/**
 * Customer dashboard is intentionally action-focused.
 * Pet cards, upcoming appointment previews and the activity journal belong
 * on their dedicated pages instead of being repeated on this landing screen.
 */
const shortcuts=[
 {to:'/pets',title:'Hồ sơ thú cưng',description:'Xem và cập nhật thông tin của bé.',icon:PawPrint},
 {to:'/my-appointments',title:'Lịch hẹn của tôi',description:'Theo dõi trạng thái các lịch đã đặt.',icon:CalendarDays},
 {to:'/payments',title:'Thanh toán',description:'Kiểm tra và xử lý khoản thanh toán.',icon:CreditCard}
] as const;

export function Overview(){
 const {user}=useAuth();
 const firstName=user?.full_name.trim().split(/\s+/).slice(-1)[0]||'bạn';
 return <div className="nb-dashboard nb-customer-dashboard pc-customer-home">
  <header className="nb-intro nb-enter">
   <div><span className="nb-overline"><span className="nb-overline-dot"/> TỔNG QUAN KHÁCH HÀNG</span>
    <h1>{greeting()}, {firstName}<span className="nb-hello-mark">.</span></h1>
    <p>Chào mừng trở lại PawCare. Bạn muốn chăm sóc bé như thế nào hôm nay?</p>
   </div>
   
  </header>

  <section className="nb-customer-cover nb-enter" aria-label="Bắt đầu chăm sóc thú cưng">
   <div className="nb-cover-copy">
    <div className="nb-cover-label"><span className="nb-cover-label-mark"><PawcareMark size={18}/></span> PAWCARE <span className="nb-cover-line"/></div>
    <h2>Mỗi dấu chân,<em> một câu chuyện.</em></h2>
    <p>Chọn dịch vụ phù hợp và đặt lịch chăm sóc cho thú cưng chỉ với vài thao tác.</p>
    <div className="nb-cover-buttons">
     <Link to="/book" className="nb-action-primary"><CalendarPlus size={18}/> Đặt lịch chăm sóc <ArrowUpRight size={17}/></Link>
     <Link to="/services" className="nb-action-quiet"><Scissors size={17}/> Xem dịch vụ <ArrowRight size={17}/></Link>
    </div>
   </div>
   <div className="nb-cover-art nb-cover-illustration" aria-hidden="true"><CompanionCover/></div>
  </section>

  <section className="pc-home-shortcuts nb-enter" aria-labelledby="pc-home-shortcuts-title">
   <div className="pc-home-shortcuts-heading">
    <div><h2 id="pc-home-shortcuts-title">Hôm nay, bạn muốn làm gì?</h2></div>
    
   </div>
   <nav className="pc-home-shortcuts-grid" aria-label="Các chức năng chăm sóc">
    {shortcuts.map(({to,title,description,icon:Icon},index)=>
     <Link key={to} to={to} className="pc-home-shortcut">
      <span className="pc-home-shortcut-icon"><Icon size={21} strokeWidth={1.8}/></span>
      <span className="pc-home-shortcut-content"><strong>{title}</strong><span>{description}</span></span>
      <ArrowUpRight className="pc-home-shortcut-arrow" size={18} aria-hidden="true"/>
     </Link>
    )}
   </nav>
  </section>
 </div>;
}
