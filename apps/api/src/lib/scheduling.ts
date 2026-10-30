import {HttpError} from './http.js';
export const TIME_ZONE='Asia/Ho_Chi_Minh';
export const OPEN_HOUR=8, CLOSE_HOUR=18;
export function localDateParts(date:Date){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23',weekday:'short'}).formatToParts(date);
 return Object.fromEntries(parts.map(p=>[p.type,p.value])) as Record<string,string>;
}
export function validateBookingTime(start:Date,durationMinutes:number,now=new Date()){
 if(Number.isNaN(start.getTime()))throw new HttpError(422,'Ngày giờ không hợp lệ');
 if(start.getTime() < now.getTime()+30*60000)throw new HttpError(422,'Vui lòng đặt lịch trước ít nhất 30 phút');
 if(start.getTime() > now.getTime()+90*24*3600*1000)throw new HttpError(422,'Chỉ nhận lịch trong 90 ngày tới');
 const p=localDateParts(start), ending=localDateParts(new Date(start.getTime()+durationMinutes*60000));
 if(p.weekday==='Sun')throw new HttpError(422,'Cơ sở nghỉ Chủ nhật');
 const minute=Number(p.hour)*60+Number(p.minute);const endMinute=Number(ending.hour)*60+Number(ending.minute);
 if(Number(p.minute)%30!==0 || minute<OPEN_HOUR*60||endMinute>CLOSE_HOUR*60||p.day!==ending.day)
  throw new HttpError(422,'Chọn khung giờ cách nhau 30 phút, từ 08:00 đến 18:00 (thứ Hai–Bảy)');
}
export function sqlUTC(date:Date){return date.toISOString();}
export function isoUTC(value:string|Date){
 if(value instanceof Date)return value.toISOString();
 if(/(?:Z|[+-]\d{2}:?\d{2})$/.test(value))return new Date(value).toISOString();
 return new Date(value.replace(' ','T')+'Z').toISOString();
}
export function canTransition(oldStatus:string,newStatus:string,role:string){
 if(oldStatus===newStatus)return true;
 if(role==='staff')return (oldStatus==='confirmed'&&newStatus==='in_progress')||(oldStatus==='in_progress'&&newStatus==='completed');
 if(role!=='admin'&&role!=='customer')return false;
 if(role==='customer')return newStatus==='cancelled'&&['pending','confirmed'].includes(oldStatus);
 const allowed:Record<string,string[]>={pending:['confirmed','cancelled'],confirmed:['cancelled'],in_progress:['cancelled'],completed:[],cancelled:[]};
 return allowed[oldStatus]?.includes(newStatus)??false;
}
