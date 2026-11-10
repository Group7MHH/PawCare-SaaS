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
 const qc=useQueryClient(),[note,setNote]=useState(''),[verificationReference,setVerificationReference]=useState('');
 const payment=useQuery({queryKey:['payment',appointmentId],queryFn:()=>api<{payment:Payment}>(`/payments/${appointmentId}`),refetchInterval:20000});
 const config=useQuery({queryKey:['payment-config'],queryFn:()=>api<PaymentConfig>('/payments/config')});
 const refresh=()=>{qc.invalidateQueries({queryKey:['payment',appointmentId]});qc.invalidateQueries({queryKey:['payments']});qc.invalidateQueries({queryKey:['appointments']});qc.invalidateQueries({queryKey:['admin-appointments']});};
 const method=useMutation({mutationFn:(value:'cash'|'bank_transfer')=>api(`/payments/${appointmentId}/method`,json('PATCH',{method:value})),onSuccess:()=>{refresh();toast.success('Đã cập nhật phương thức thanh toán');},onError:e=>toast.error(errorMessage(e))});
 const notice=useMutation({mutationFn:()=>api(`/payments/${appointmentId}/transfer-notice`,json('POST',{note:note.trim()})),onSuccess:()=>{refresh();setNote('');toast.success('Đã gửi thông báo chuyển khoản, đang chờ kiểm tra');},onError:e=>toast.error(errorMessage(e))});
 const reconcile=useMutation({mutationFn:(action:'confirm_paid'|'reject_transfer'|'confirm_refund')=>api(`/payments/${appointmentId}/reconcile`,json('POST',{action,note:note.trim(),verification_reference:verificationReference.trim()||undefined})),onSuccess:()=>{refresh();setNote('');setVerificationReference('');toast.success('Đã cập nhật trạng thái thanh toán');},onError:e=>toast.error(errorMessage(e))});
 const p=payment.data?.payment;
 if(payment.isLoading)return <div className="pc-payment-loading" role="status">Đang tải thông tin thanh toán...</div>;
 if(payment.error||!p)return <div className="pc-payment-error" role="alert">Không thể tải trạng thái thanh toán. Vui lòng thử lại.</div>;
 const availableBank=config.data?.bank;
 const bank=p.bank_name_snapshot&&p.bank_account_snapshot&&p.bank_owner_snapshot?{name:p.bank_name_snapshot,account:p.bank_account_snapshot,owner:p.bank_owner_snapshot}:null;
 const unpaid=['unpaid','awaiting_payment'].includes(p.status)&&p.appointment_status!=='cancelled';
 const working=method.isPending||notice.isPending||reconcile.isPending;
 return <section className="pc-payment-panel" aria-label="Thanh toán">
  <header className="pc-payment-heading"><span className="pc-payment-symbol"><CreditCard size={19}/></span><div><span className="pc-payment-overline">PAWCARE / THANH TOÁN</span><strong>Chi tiết thanh toán</strong></div><span className={`pc-payment-status pc-payment-status--${p.status}`}>{labels[p.status]}</span></header>
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
   <small>Nút này chỉ gửi thông báo. Thanh toán chỉ thành công sau khi nhân viên được giao hoặc Admin đối soát thực tế.</small>
  </div>}
  {!admin&&!staff&&p.method==='cash'&&unpaid&&<p className="pc-payment-info">Vui lòng thanh toán tại cửa hàng. Admin sẽ ghi nhận sau khi nhận tiền.</p>}
  {!admin&&!staff&&p.status==='pending_review'&&<p className="pc-payment-info">Bạn đã báo chuyển khoản. Nhân viên hoặc Admin đang kiểm tra; đây chưa phải xác nhận đã nhận tiền.</p>}
  {p.status==='refund_required'&&<p className="pc-payment-warning">Lịch hẹn đã hủy sau khi thanh toán. Vui lòng liên hệ cửa hàng để hoàn tiền; Admin cần ghi nhận sau khi hoàn thực tế.</p>}
  {(admin||staff)&&p.admin_note&&<p className="pc-payment-info">Ghi chú nội bộ: {p.admin_note}</p>}
  {staff&&<div className="pc-staff-reconcile">
   <div className="pc-staff-reconcile-head"><ShieldCheck size={19}/><div><strong>Đối soát chuyển khoản được giao</strong><small>Chỉ xác nhận khi đã trực tiếp kiểm tra sao kê của cửa hàng và thấy tiền thực nhận.</small></div></div>
   {p.status==='pending_review'&&p.method==='bank_transfer'&&p.appointment_status!=='cancelled'?<>
    <label className="pc-payment-note">Mã giao dịch ngân hàng đã đối chiếu (bắt buộc)<input type="text" maxLength={80} value={verificationReference} onChange={e=>setVerificationReference(e.target.value)} placeholder="Nhập mã từ sao kê ngân hàng"/></label>
    <label className="pc-payment-note">Bằng chứng/ghi chú xác minh (bắt buộc)<textarea rows={3} maxLength={500} value={note} onChange={e=>setNote(e.target.value)} placeholder="Đã kiểm tra sao kê, khớp số tiền và nội dung thanh toán..."/></label>
    <button type="button" className="button button-primary" disabled={working||verificationReference.trim().length<6||note.trim().length<10} onClick={()=>{if(confirm('Bạn đã kiểm tra tiền thực sự về tài khoản cửa hàng, khớp số tiền và mã giao dịch?'))reconcile.mutate('confirm_paid');}}><CheckCircle2 size={16}/> Xác nhận đã nhận chuyển khoản</button>
   </>:<p className="pc-payment-info">Giao dịch không ở trạng thái chờ đối soát chuyển khoản. Staff không thể thay đổi.</p>}
   <p className="pc-staff-reconcile-foot">Hệ thống ghi người xác nhận và thời gian trong nhật ký. Thao tác này không tự kiểm tra ngân hàng; không xác nhận chỉ dựa vào ảnh chụp chuyển khoản.</p>
  </div>}
  {admin&&<div className="pc-payment-reconcile"><label className="pc-payment-note">Ghi chú Admin<textarea maxLength={500} rows={2} value={note} onChange={e=>setNote(e.target.value)} placeholder="Ghi chú kiểm tra giao dịch hoặc bằng chứng hoàn tiền"/></label><div className="pc-payment-actions">
   {p.method==='bank_transfer'&&p.status==='pending_review'&&<label className="pc-payment-note">Mã giao dịch trên sao kê<input type="text" maxLength={80} value={verificationReference} onChange={e=>setVerificationReference(e.target.value)} placeholder="Nhập mã giao dịch ngân hàng"/></label>}
   {((p.method==='cash'&&unpaid)||(p.method==='bank_transfer'&&p.status==='pending_review'))&&<button className="button button-primary" type="button" disabled={working||(p.method==='bank_transfer'&&(verificationReference.trim().length<6||note.trim().length<10))} onClick={()=>{if(confirm('Bạn đã kiểm tra và thực sự nhận được tiền?'))reconcile.mutate('confirm_paid');}}><CheckCircle2 size={16}/> {p.appointment_status==='cancelled'?'Đã nhận tiền · Cần hoàn':'Xác nhận đã nhận tiền'}</button>}
   {p.method==='bank_transfer'&&p.status==='pending_review'&&<button className="button button-secondary" type="button" disabled={working||!note.trim()} onClick={()=>reconcile.mutate('reject_transfer')}>Từ chối đối soát</button>}
   {p.status==='refund_required'&&<button className="button button-primary" type="button" disabled={working||!note.trim()} onClick={()=>{if(confirm('Bạn đã hoàn tiền thật và có bằng chứng?'))reconcile.mutate('confirm_refund');}}>Xác nhận đã hoàn tiền</button>}
  </div><small>Chỉ xác nhận khi đã kiểm tra dòng tiền thật. Hệ thống không tự chuyển khoản hoặc thu tiền.</small></div>}
  <footer className="pc-payment-foot"><ShieldCheck size={15}/> Trạng thái được lưu trong hệ thống PawCare</footer>
 </section>;
}
