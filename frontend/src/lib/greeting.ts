const VN_TIME_ZONE='Asia/Ho_Chi_Minh';

/** Use the numeric hour part, not the full localized string (e.g. "07 giờ"). */
export function greeting(now:Date=new Date()):string{
 const hourPart=new Intl.DateTimeFormat('vi-VN',{
  hour:'2-digit',hourCycle:'h23',timeZone:VN_TIME_ZONE
 }).formatToParts(now).find(part=>part.type==='hour')?.value;
 const hour=Number(hourPart);
 if(hourPart===undefined||!Number.isInteger(hour)||hour<0||hour>23)return 'Xin chào';
 return hour<11?'Chào buổi sáng':hour<14?'Chào buổi trưa':hour<18?'Chào buổi chiều':'Chào buổi tối';
}
