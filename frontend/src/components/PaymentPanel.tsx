import {useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {toast} from 'react-hot-toast';
import {Banknote,CheckCircle2,ClipboardCheck,Copy,CreditCard,Landmark,ShieldCheck} from 'lucide-react';
import {api,errorMessage,json,money} from '../lib/api';

export type PaymentStatus='unpaid'|'awaiting_payment'|'pending_review'|'paid'|'refund_required'|'refunded'|'void';
export type Payment={
 id:number;appointment_id:number;amount:number;currency:'VND';method:'cash'|'bank_transfer';
 status:PaymentStatus;payment_reference:string;customer_note:string|null;admin_note:string|null;
 paid_at:string|null;created_at:string;appointment_status:string;service_name:string;pet_name:string;
 bank_name_snapshot:string|null;bank_account_snapshot:string|null;bank_owner_snapshot:string|null;
};
export type PaymentConfig={methods:string[];bank:{name:string;account:string;owner:string}|null;provider:'manual';automatic_confirmation:false};
const labels:Record<PaymentStatus,string>={
 unpaid:'Chưa thanh toán',awaiting_payment:'Chờ thanh toán',pending_review:'Chờ đối soát',
 paid:'Đã thanh toán',refund_required:'Cần hoàn tiền',refunded:'Đã hoàn tiền',void:'Đã hủy thanh toán'
};
export function PaymentPanel({appointmentId,admin=false,staff=false}:{appointmentId:number;admin?:boolean;staff?:boolean}){
 const qc=useQueryClient(),[note,setNote]=useState('');
 const payment=useQuery({queryKey:['payment',appointmentId],queryFn:()=>api<{payment:Payment}>(`/payments/${appointmentId}`),refetchInterval:20000});
 const config=useQuery({queryKey:['payment-config'],queryFn:()=>api<PaymentConfig>('/payments/config')});
 const refresh=()=>{qc.invalidateQueries({queryKey:['payment',appointmentId]});qc.invalidateQueries({queryKey:['payments']});qc.invalidateQueries({queryKey:['appointments']});qc.invalidateQueries({queryKey:['admin-appointments']});};
 const method=useMutation({mutationFn:(value:'cash'|'bank_transfer')=>api(`/payments/${appointmentId}/method`,json('PATCH',{method:value})),onSuccess:()=>{refresh();toast.success('Đã cập nhật phương thức thanh toán');},onError:e=>toast.error(errorMessage(e))});
 const notice=useMutation({mutationFn:()=>api(`/payments/${appointmentId}/transfer-notice`,json('POST',{note:note.trim()})),onSuccess:()=>{refresh();setNote('');toast.success('Đã gửi thông báo chuyển khoản, đang chờ kiểm tra');},onError:e=>toast.error(errorMessage(e))});
 const reconcile=useMutation({mutationFn:(action:'confirm_paid'|'reject_transfer'|'confirm_refund')=>api(`/payments/${appointmentId}/reconcile`,json('POST',{action,note:note.trim()})),onSuccess:()=>{refresh();setNote('');toast.success('Đã cập nhật trạng thái thanh toán (demo)');},onError:e=>toast.error(errorMessage(e))});
 const p=payment.data?.payment;
 if(payment.isLoading)return <div className="pc-payment-loading" role="status">Đang tải thông tin thanh toán...</div>;
 if(payment.error||!p)return <div className="pc-payment-error" role="alert">Không thể tải trạng thái thanh toán. Vui lòng thử lại.</div>;
 const availableBank=config.data?.bank;
 const bank=p.bank_name_snapshot&&p.bank_account_snapshot&&p.bank_owner_snapshot?{name:p.bank_name_snapshot,account:p.bank_account_snapshot,owner:p.bank_owner_snapshot}:null;
 const unpaid=['unpaid','awaiting_payment'].includes(p.status)&&p.appointment_status!=='cancelled';
 const cashNeedsCollection=p.method==='cash'&&p.status==='unpaid'&&p.appointment_status!=='cancelled';
 const bankNeedsConfirmation=p.method==='bank_transfer'&&p.status==='pending_review';
 const cancelledTransferAwaitingReview=p.appointment_status==='cancelled'&&bankNeedsConfirmation;
 const staffCanConfirm=['confirmed','in_progress','completed'].includes(p.appointment_status)&&(cashNeedsCollection||bankNeedsConfirmation);
 const working=method.isPending||notice.isPending||reconcile.isPending;
 return <section className="pc-payment-panel" aria-label="Thanh toán">
  <header className="pc-payment-heading"><span className="pc-payment-symbol"><CreditCard size={19}/></span><div><span className="pc-payment-overline">PAWCARE / THANH TOÁN</span><strong>Chi tiết thanh toán</strong></div><span className={`pc-payment-status pc-payment-status--${p.status}`}>{labels[p.status]}</span></header>
  {p.method==='bank_transfer'&&<p className="pc-payment-info"><strong>Chế độ demo:</strong> trạng thái thanh toán chỉ được xác nhận trong PawCare, không có kết nối hoặc xác minh giao dịch ngân hàng.</p>}
  <div className="pc-payment-total"><span>Số tiền dịch vụ</span><strong>{money(p.amount)}</strong></div>
  <div className="pc-payment-ref"><span>Mã thanh toán</span><strong>{p.payment_reference}</strong><button type="button" aria-label="Sao chép mã thanh toán" title="Sao chép mã" onClick={()=>navigator.clipboard?.writeText(p.payment_reference).then(()=>toast.success('Đã sao chép mã thanh toán')).catch(()=>toast.error('Không thể sao chép'))}><Copy size={15}/></button></div>
  <div className="pc-payment-method"><Banknote size={16}/><span>Phương thức: <strong>{p.method==='cash'?'Thanh toán tại cửa hàng':'Chuyển khoản ngân hàng'}</strong></span></div>
  {!admin&&!staff&&unpaid&&<div className="pc-payment-choices" role="group" aria-label="Phương thức thanh toán">
   <button type="button" disabled={working} aria-pressed={p.method==='cash'} onClick={()=>method.mutate('cash')}><Banknote size={17}/> Tại cửa hàng</button>
   <button type="button" disabled={working||!availableBank} aria-pressed={p.method==='bank_transfer'} onClick={()=>method.mutate('bank_transfer')} title={!availableBank?'Cửa hàng đang tạm ngừng nhận chuyển khoản mới':undefined}><Landmark size={17}/> Chuyển khoản</button>
  </div>}
  {!admin&&!staff&&p.method==='bank_transfer'&&p.status==='awaiting_payment'&&!bank&&<p className="pc-payment-warning">Lịch này chưa có bản lưu tài khoản ngân hàng tại thời điểm đặt lịch. Vui lòng liên hệ cửa hàng xác nhận số tài khoản trước khi chuyển tiền.</p>}
  {!admin&&!staff&&p.method==='bank_transfer'&&p.status==='awaiting_payment'&&bank&&<div className="pc-payment-bank">
   <span className="pc-payment-overline">TÀI KHOẢN NHẬN TIỀN ĐÃ GẮN VỚI LỊCH HẸN</span>
   <p><strong>{bank.name}</strong><span>{bank.account}</span><small>{bank.owner}</small></p>
   <div className="pc-payment-bank-note">Nếu ngân hàng của cửa hàng vừa được thay đổi, hãy xác nhận lại trước khi chuyển. Nội dung đề xuất: <strong>{p.payment_reference}</strong>. Vui lòng kiểm tra người thụ hưởng trước khi chuyển.</div>
   <label className="pc-payment-note">Ghi chú giao dịch (không bắt buộc)<textarea maxLength={300} rows={2} value={note} onChange={e=>setNote(e.target.value)} placeholder="Ví dụ: thời gian hoặc tên người chuyển"/></label>
   <button className="button button-primary" type="button" disabled={working} onClick={()=>notice.mutate()}><ClipboardCheck size={16}/> Tôi đã chuyển khoản</button>
   <small>Nút này chỉ gửi thông báo. Staff hoặc Admin sẽ xác nhận mô phỏng trong PawCare; không có kiểm tra ngân hàng thật.</small>
  </div>}
  {!admin&&!staff&&p.method==='cash'&&unpaid&&<p className="pc-payment-info">Vui lòng thanh toán tại quầy. Staff phụ trách hoặc Admin sẽ ghi nhận sau khi nhận tiền mặt.</p>}
  {!admin&&!staff&&p.status==='pending_review'&&<p className="pc-payment-info">{cancelledTransferAwaitingReview?'Lịch đã hủy sau khi bạn báo chuyển khoản. Admin sẽ xử lý thông báo: từ chối nếu chưa nhận tiền, hoặc ghi nhận khoản cần hoàn tiền nếu đã nhận (demo).':'Bạn đã báo chuyển khoản. Đang chờ Staff hoặc Admin xác nhận trên bản demo; đây chưa phải xác minh tiền đã về.'}</p>}
  {p.status==='refund_required'&&<p className="pc-payment-warning">Lịch hẹn đã hủy sau khi thanh toán. Vui lòng liên hệ cửa hàng để hoàn tiền; Admin cần ghi nhận sau khi hoàn thực tế.</p>}
  {(admin||staff)&&p.admin_note&&<p className="pc-payment-info">Ghi chú nội bộ: {p.admin_note}</p>}
  {staff&&<div className="pc-staff-reconcile">
   <div className="pc-staff-reconcile-head"><ShieldCheck size={19}/><div><strong>Ghi nhận thanh toán</strong><small>Chỉ xác nhận sau khi nhận tiền mặt. Chuyển khoản chỉ mô phỏng trong bản demo.</small></div></div>
   {staffCanConfirm
    ?<button type="button" className="button button-primary" disabled={working} onClick={()=>{if(confirm(p.method==='cash'?'Bạn xác nhận đã trực tiếp nhận đủ tiền mặt từ khách tại quầy?':'Đây chỉ là xác nhận mô phỏng; PawCare không kiểm tra ngân hàng. Bạn muốn đánh dấu đã thanh toán?'))reconcile.mutate('confirm_paid');}}><CheckCircle2 size={16}/>{p.method==='cash'?'Xác nhận đã nhận tiền mặt':'Xác nhận chuyển khoản (Demo)'}</button>
    :<p className="pc-payment-info">{p.status==='paid'?'Giao dịch đã được ghi nhận thanh toán.':'Chưa có khoản cần xác nhận, hoặc bạn cần nhận lịch trước khi ghi nhận thanh toán.'}</p>}
   <p className="pc-staff-reconcile-foot">Chỉ xác nhận lịch do bạn phụ trách. Hệ thống lưu người xác nhận và thời gian thao tác.</p>
  </div>}
  {admin&&<div className="pc-payment-reconcile">
   {cancelledTransferAwaitingReview&&<p className="pc-payment-warning">Lịch đã hủy. Nếu tiền thực tế đã về, xác nhận demo để tạo yêu cầu hoàn tiền; nếu chưa nhận tiền, từ chối đối soát. Không đánh dấu giao dịch này là thanh toán hoàn tất.</p>}
   <div className="pc-payment-actions">
    {(cashNeedsCollection||bankNeedsConfirmation)&&<button type="button" className="button button-primary" disabled={working} onClick={()=>{if(confirm(p.method==='cash'?'Bạn xác nhận cửa hàng đã nhận đủ tiền mặt tại quầy?':cancelledTransferAwaitingReview?'Lịch đã hủy. Xác nhận mô phỏng chỉ để chuyển sang CẦN HOÀN TIỀN, không xác minh ngân hàng. Tiếp tục?':'Xác nhận mô phỏng: PawCare không xác minh giao dịch ngân hàng. Đánh dấu đã thanh toán?'))reconcile.mutate('confirm_paid');}}><CheckCircle2 size={16}/>{p.method==='cash'?'Xác nhận đã nhận tiền mặt':cancelledTransferAwaitingReview?'Ghi nhận cần hoàn tiền (Demo)':'Xác nhận chuyển khoản (Demo)'}</button>}
   </div>
   {(p.method==='bank_transfer'&&p.status==='pending_review'||p.status==='refund_required')&&<label className="pc-payment-note">Ghi chú cho thao tác từ chối hoặc hoàn tiền<textarea rows={2} maxLength={500} value={note} onChange={e=>setNote(e.target.value)} placeholder="Nhập lý do từ chối hoặc ghi chú hoàn tiền"/></label>}
   <div className="pc-payment-actions">
    {p.method==='bank_transfer'&&p.status==='pending_review'&&<button className="button button-secondary" type="button" disabled={working||!note.trim()} onClick={()=>reconcile.mutate('reject_transfer')}>Từ chối đối soát</button>}
    {p.status==='refund_required'&&<button className="button button-primary" type="button" disabled={working||!note.trim()} onClick={()=>{if(confirm('Bạn đã hoàn tiền thật và muốn ghi nhận trong PawCare?'))reconcile.mutate('confirm_refund');}}>Xác nhận đã hoàn tiền</button>}
   </div>
   <small>Tiền mặt chỉ được xác nhận sau khi nhận thực tế; chuyển khoản là thao tác mô phỏng, không có xác minh ngân hàng.</small>
  </div>}
  <footer className="pc-payment-foot"><ShieldCheck size={15}/> Trạng thái được lưu trong hệ thống PawCare</footer>
 </section>;
}
