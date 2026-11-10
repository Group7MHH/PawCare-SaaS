import {useQuery} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {ArrowRight,CalendarCheck,Clock3,ShieldCheck} from 'lucide-react';
import {api,type Service} from '../lib/api';
import {ServiceCards} from '../components/ServiceCards';
import {ErrorNotice,Loading} from '../components/UI';
import {PageHero} from '../components/PageHero';

/** Customer-facing catalogue. Uses the current active services API; no new backend workflow. */
export function CustomerServices(){
 const services=useQuery({queryKey:['services'],queryFn:()=>api<{items:Service[]}>('/services')});
 return <div className="pc-services-landing">
  <PageHero eyebrow="DỊCH VỤ PAWCARE" title="Chăm sóc chu đáo, trọn vẹn từng khoảnh khắc." description="Khám phá những dịch vụ phù hợp với bé cưng. Xem giá minh bạch và đặt lịch trực tiếp trên PawCare." tone="sage" visual="service" action={<><a className="button button-primary" href="#danh-muc">Khám phá dịch vụ <ArrowRight size={17}/></a><Link className="button button-secondary" to="/book">Đặt lịch chăm sóc</Link></>}/>
  <div className="pc-service-process" aria-label="Các bước đặt lịch">
   <span><b>01</b> Chọn dịch vụ</span><span><b>02</b> Chọn ngày và giờ</span><span><b>03</b> Xác nhận lịch hẹn</span>
  </div>
  <section id="danh-muc" className="pc-services-collection">
   <div className="pc-services-heading"><div><span className="pc-service-kicker">DANH MỤC DỊCH VỤ</span><h2>Bé cần chăm sóc gì?</h2></div><p>Giá và thời lượng được lấy trực tiếp từ danh mục hiện tại của cửa hàng.</p></div>
   {services.isLoading?<Loading/>:services.error?<ErrorNotice message="Không thể tải danh sách dịch vụ. Vui lòng thử lại."/>:
    <ServiceCards services={services.data?.items||[]}/>}
  </section>
  <footer className="pc-service-footer">
   <div><Clock3 size={21}/><span><strong>Khung giờ đặt lịch</strong><small>Thứ Hai–Thứ Bảy, 08:00–18:00</small></span></div>
   <div><ShieldCheck size={21}/><span><strong>Xác nhận minh bạch</strong><small>Theo dõi trạng thái lịch hẹn trong tài khoản</small></span></div>
   <Link to="/book">Đặt lịch ngay <CalendarCheck size={17}/></Link>
  </footer>
 </div>;
}
