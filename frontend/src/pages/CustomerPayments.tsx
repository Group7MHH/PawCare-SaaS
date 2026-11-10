import {useEffect,useRef,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Link} from 'react-router-dom';
import {ArrowRight,CalendarDays,CheckCircle2,ChevronLeft,ChevronRight,Clock3,Landmark,ReceiptText,Search,ShieldCheck,WalletCards,X} from 'lucide-react';
import {api,dateTime,errorMessage,money} from '../lib/api';
import {type Payment,PaymentPanel, type PaymentStatus} from '../components/PaymentPanel';
import {PageTitle,Loading,ErrorNotice,Empty} from '../components/UI';

type PaymentSummary={
 total:number;unpaid:number;awaiting_payment:number;pending_review:number;paid:number;
 refund_required:number;refunded:number;paid_amount:string;
};
type PaymentList={items:Payment[];total:number;page:number;limit:number;summary:PaymentSummary};
type StatusFilter='all'|PaymentStatus;
const statuses:Record<PaymentStatus,{label:string;description:string}>={
 unpaid:{label:'Chưa thanh toán',description:'Chưa thu tiền mặt'},
 awaiting_payment:{label:'Chờ thanh toán',description:'Khách chưa thực hiện chuyển khoản'},
 pending_review:{label:'Chờ đối soát',description:'Đang kiểm tra chuyển khoản'},
 paid:{label:'Đã thanh toán',description:'Đã xác nhận nhận tiền'},
 refund_required:{label:'Cần hoàn tiền',description:'Chờ cửa hàng hoàn tiền'},
 refunded:{label:'Đã hoàn tiền',description:'Đã ghi nhận hoàn tiền'},
 void:{label:'Đã hủy',description:'Không phát sinh khoản thu'}
};
const filters:{key:StatusFilter;label:string}[]=[
 {key:'all',label:'Tất cả'},
 {key:'unpaid',label:'Chưa thanh toán'},
 {key:'awaiting_payment',label:'Chờ thanh toán'},
 {key:'pending_review',label:'Chờ đối soát'},
 {key:'paid',label:'Đã thanh toán'},
 {key:'refund_required',label:'Cần hoàn tiền'},
 {key:'refunded',label:'Đã hoàn tiền'},
 {key:'void',label:'Đã hủy'}
];
const size=12;

export function CustomerPayments(){
 const [filter,setFilter]=useState<StatusFilter>('all');
 const [search,setSearch]=useState('');
 const [debounced,setDebounced]=useState('');
 const [page,setPage]=useState(1);
 const [selectedId,setSelectedId]=useState<number|null>(null);
 const detailRef=useRef<HTMLElement|null>(null);
 useEffect(()=>{
  if(selectedId===null)return;
  detailRef.current?.scrollIntoView({behavior:'smooth',block:'start'});
  const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')setSelectedId(null);};
  window.addEventListener('keydown',onKey);
  return()=>window.removeEventListener('keydown',onKey);
 },[selectedId]);
 useEffect(()=>{
  const timer=window.setTimeout(()=>{setDebounced(search.trim());setPage(1);},280);
  return()=>window.clearTimeout(timer);
 },[search]);
 const query=useQuery({
  queryKey:['payments','customer',filter,page,debounced],
  queryFn:()=>api<PaymentList>(`/payments?status=${encodeURIComponent(filter)}&page=${page}&limit=${size}&search=${encodeURIComponent(debounced)}`),
  refetchInterval:20000,refetchOnWindowFocus:true,staleTime:0
 });
 const all=query.data?.items??[];
 // Keep the detail panel open when a mutation changes the transaction's status or filter.
 const selected=all.find(p=>p.appointment_id===selectedId);
 const summary=query.data?.summary;
 const pages=Math.max(1,Math.ceil((query.data?.total??0)/size));
 const select=(p:Payment)=>setSelectedId(p.appointment_id);
 const active=selectedId!==null;
 return <div className="pc-customer-payments">
  <PageTitle eyebrow="TÀI CHÍNH CÁ NHÂN" title="Thanh toán của tôi"
   description="Theo dõi số tiền, mã giao dịch và tiến độ đối soát mọi lịch chăm sóc tại một nơi."
   action={<Link className="button button-primary" to="/book"><CalendarDays size={16}/> Đặt lịch mới</Link>}/>
  <section className="pc-wallet-intro" aria-label="Tổng quan thanh toán">
   <div className="pc-wallet-intro-copy">
    <span className="pc-wallet-index">PAWCARE / PAYMENT JOURNAL</span>
    <h2>Mọi khoản chăm sóc, rõ ràng từng bước.</h2>
    <p>Tiền mặt được ghi nhận sau khi thu tại quầy; xác nhận chuyển khoản chỉ là mô phỏng trong PawCare. Không cung cấp mật khẩu hay mã OTP ngân hàng.</p>
    <span className="pc-wallet-trust"><ShieldCheck size={16}/> Theo dõi thanh toán thủ công và demo</span>
   </div>
   <div className="pc-wallet-ledger" aria-hidden="true">
    <span className="pc-wallet-ledger-tape"/>
    <div className="pc-wallet-ledger-sheet">
     <span className="pc-wallet-ledger-top">CARE / LEDGER <b>01</b></span>
     <span className="pc-wallet-ledger-stamp"><ReceiptText size={35} strokeWidth={1.4}/></span>
     <i/><i/><i/>
     <span className="pc-wallet-ledger-bottom"><CheckCircle2 size={16}/> DEMO LEDGER</span>
    </div>
   </div>
  </section>
  <section className="pc-wallet-stats" aria-label="Thống kê giao dịch">
   <div className="pc-wallet-stat"><span className="pc-wallet-stat-index">01 / GIAO DỊCH</span><strong>{summary?.total??'—'}</strong><small>Tổng số giao dịch</small><ReceiptText size={22} aria-hidden="true"/></div>
   <div className="pc-wallet-stat"><span className="pc-wallet-stat-index">02 / CHỜ THANH TOÁN</span><strong>{summary?(summary.unpaid+summary.awaiting_payment):'—'}</strong><small>Tiền mặt chưa thu và chuyển khoản chưa thực hiện</small><WalletCards size={22} aria-hidden="true"/></div>
   <div className="pc-wallet-stat"><span className="pc-wallet-stat-index">03 / ĐANG ĐỐI SOÁT</span><strong>{summary?.pending_review??'—'}</strong><small>Admin hoặc Staff đang kiểm tra</small><Clock3 size={22} aria-hidden="true"/></div>
   <div className="pc-wallet-stat pc-wallet-stat--paid"><span className="pc-wallet-stat-index">04 / ĐÃ XÁC NHẬN</span><strong>{summary?money(Number(summary.paid_amount)):'—'}</strong><small>{summary?.paid??0} giao dịch đã thanh toán</small><CheckCircle2 size={22} aria-hidden="true"/></div>
  </section>
  <section className="pc-wallet-section" aria-label="Danh sách thanh toán">
   <header className="pc-wallet-section-head"><div><span className="pc-wallet-overline">01 / LỊCH SỬ GIAO DỊCH</span><h2>Sổ thanh toán</h2><p>Chọn một giao dịch để xem số tiền, nội dung chuyển khoản và trạng thái mới nhất.</p></div><span className="pc-wallet-count" aria-live="polite">{query.data?.total??0} kết quả</span></header>
   <div className="pc-wallet-toolbar">
    <label className="pc-wallet-search"><Search size={17} aria-hidden="true"/><span className="sr-only">Tìm giao dịch</span><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Mã thanh toán, dịch vụ, tên thú cưng..." autoComplete="off"/></label>
    <div className="pc-wallet-filters" role="group" aria-label="Lọc trạng thái thanh toán">
     {filters.map(f=><button type="button" key={f.key} aria-pressed={filter===f.key} className={filter===f.key?'active':''} onClick={()=>{setFilter(f.key);setPage(1);}}>{f.label}</button>)}
    </div>
   </div>
   {query.isLoading?<Loading/>:query.error?<ErrorNotice message={errorMessage(query.error)}/>:!all.length?
    <div className="pc-wallet-empty"><Empty title={search||filter!=='all'?'Không tìm thấy giao dịch':'Bạn chưa có giao dịch'} description={search||filter!=='all'?'Thử tìm kiếm hoặc chọn bộ lọc khác.':'Sau khi đặt lịch, mọi khoản thanh toán sẽ hiển thị tại đây.'} action={<Link to="/book" className="button button-primary">Đặt lịch chăm sóc <ArrowRight size={16}/></Link>}/></div>:
    <div className="pc-wallet-list" aria-live="polite">
     {all.map((p,i)=><button type="button" key={p.id} onClick={()=>select(p)} aria-label={`Xem thanh toán ${p.payment_reference} của lịch ${p.appointment_id}`} className={`pc-wallet-item ${selectedId===p.appointment_id?'pc-wallet-item--selected':''}`} style={{animationDelay:`${Math.min(i,7)*35}ms`}}>
      <span className="pc-wallet-item-index">{String((page-1)*size+i+1).padStart(2,'0')}</span>
      <span className="pc-wallet-item-icon" aria-hidden="true">{p.method==='bank_transfer'?<Landmark size={22}/>:<WalletCards size={22}/>}</span>
      <span className="pc-wallet-item-main"><strong>{p.service_name}</strong><small>{p.pet_name} · Lịch #{String(p.appointment_id).padStart(4,'0')}</small><span className="pc-wallet-item-ref">{p.payment_reference}</span></span>
      <span className="pc-wallet-item-meta"><strong>{money(p.amount)}</strong><small>{dateTime(p.created_at)}</small></span>
      <span className={`pc-wallet-status pc-wallet-status--${p.status}`}>{statuses[p.status].label}</span>
      <ChevronRight className="pc-wallet-item-chevron" size={19} aria-hidden="true"/>
     </button>)}
    </div>}
   <div className="pc-wallet-list-foot"><span>Trang {page}/{pages} · {query.data?.total??0} giao dịch</span><div className="pc-wallet-pager"><button type="button" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page<=1} aria-label="Trang thanh toán trước"><ChevronLeft size={18}/></button><button type="button" onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page>=pages} aria-label="Trang thanh toán sau"><ChevronRight size={18}/></button></div></div>
  </section>
  <footer className="pc-wallet-bottom"><ShieldCheck size={19}/><span>Staff phụ trách hoặc Admin ghi nhận tiền mặt đã thu và xác nhận chuyển khoản trong bản demo. Nếu đã chuyển khoản, hãy mở giao dịch và gửi thông báo.</span></footer>
  {active&&<section ref={detailRef} className="pc-wallet-inline-detail" aria-label="Chi tiết thanh toán đã chọn">
   <header className="pc-wallet-inline-head">
    <div><span className="pc-wallet-overline">CHI TIẾT GIAO DỊCH</span><h2>Thanh toán lịch #{String(selectedId).padStart(4,'0')}</h2><p>{selected?.payment_reference??'Xem hướng dẫn chuyển khoản và tình trạng đối soát tại đây.'}</p></div>
    <button type="button" className="pc-wallet-inline-close" onClick={()=>setSelectedId(null)} aria-label="Đóng chi tiết thanh toán"><X size={19}/> Đóng</button>
   </header>
   <PaymentPanel key={selectedId} appointmentId={selectedId}/>
   <Link to="/my-appointments" className="pc-wallet-appointment-link">Xem lịch hẹn của tôi <ArrowRight size={16}/></Link>
  </section>}
 </div>;
}
