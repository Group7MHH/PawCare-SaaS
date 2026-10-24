export type Role='customer'|'staff'|'admin'|'owner';
export type User={id:number;full_name:string;email:string;role:Role;phone?:string|null;address?:string|null;organization_id:number|null;organization_name:string|null};
export type Organization={id:number;name:string;slug:string;is_active:boolean};
export type Pet={id:number;owner_id:number;owner_name?:string;name:string;species:'dog'|'cat'|'other';breed:string|null;gender:string;birthday:string|null;weight_kg:number|null;color:string|null;notes:string|null;record_count?:number};
export type CareRecord={id:number;pet_id:number;title:string;record_type:string;care_date:string;description:string|null;next_due_date:string|null};
export type Service={id:number;name:string;category:string;description:string|null;duration_minutes:number;price:number;is_active:boolean};
export type Staff={id:number;full_name:string;email:string;phone:string|null;specialty:string|null;bio:string|null;is_active:boolean;active_appointments:number};
export type Appointment={id:number;customer_id:number;customer_name:string;customer_phone?:string|null;pet_id:number;pet_name:string;pet_species:string;service_id:number;service_name:string;staff_id:number|null;staff_name:string|null;starts_at:string;ends_at:string;duration_minutes:number;status:'pending'|'confirmed'|'in_progress'|'completed'|'cancelled';price_snapshot:number;notes:string|null};
export type Customer={id:number;full_name:string;email:string;phone:string|null;address:string|null;pet_count:number;appointment_count:number;created_at:string};
export type Stats={stats:Record<string,number>;recent:Record<string,any>[];series?:{month:string;revenue:number;appointments:number}[];statuses?:{status:string;value:number}[]};
export async function api<T>(path:string,options:RequestInit={}):Promise<T>{
 const response=await fetch(`/api${path}`,{credentials:'include',...options,headers:{'Content-Type':'application/json',...options.headers}});
 const text=await response.text();let data:any={};try{data=text?JSON.parse(text):{};}catch{throw new Error('Máy chủ trả về nội dung không hợp lệ');}
 if(!response.ok)throw new Error(data.message||`Yêu cầu thất bại (${response.status})`);
 return data as T;
}
export const json=(method:string,data?:unknown):RequestInit=>({method,body:data===undefined?undefined:JSON.stringify(data)});
export const money=(n:number)=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(Number(n||0));
export const dateTime=(iso:string)=>new Date(iso).toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Ho_Chi_Minh'});
export const dateOnly=(value:string|null|undefined)=>value?String(value).slice(0,10).split('-').reverse().join('/'): '—';
export const petIcon=(type:string)=>type==='dog'?'🐕':type==='cat'?'🐈':'🐾';
export const speciesName=(type:string)=>({dog:'Chó',cat:'Mèo',other:'Khác'}[type]||type);
export const statusName:Record<string,string>={pending:'Chờ xác nhận',confirmed:'Đã xác nhận',in_progress:'Đang thực hiện',completed:'Hoàn thành',cancelled:'Đã hủy'};
export const statusClass:Record<string,string>={pending:'amber',confirmed:'teal',in_progress:'blue',completed:'green',cancelled:'red'};
export function localDateTimeInput(date:Date){const offset=date.getTimezoneOffset()*60000;return new Date(date.getTime()-offset).toISOString().slice(0,16);}
export function errorMessage(err:unknown){return err instanceof Error?err.message:'Đã xảy ra lỗi';}
