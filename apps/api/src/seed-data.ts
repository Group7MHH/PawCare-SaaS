/** Development fixtures only. NEVER seed passwords or example staff on production. */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import {rows,exec} from './lib/db.js';
import {sqlUTC} from './lib/scheduling.js';
async function user(email:string,password:string,name:string,role:'owner'|'customer'){
 const found=await rows<any>('SELECT id FROM users WHERE email=?',[email]);if(found.length)return found[0].id as number;
 const r=await exec('INSERT INTO users(full_name,email,password_hash,role,phone) VALUES(?,?,?,?,?)',[name,email,await bcrypt.hash(password,12),role,role==='customer'?'0901234567':'0909000000']);return r.insertId;
}
export async function seedData(){
 if(process.env.NODE_ENV==='production')throw new Error('Không được seed demo trên production');
 const owner=await user('owner@pawcare.local','Owner@Dev123456','Chủ nền tảng PawCare','owner');
 const admin=await user('admin@petcare.local','Admin@Dev123456','Nguyễn Minh Quân','customer');
 const staff=await user('staff@petcare.local','Staff@Dev123456','Trần Mạnh Hùng','customer');
 const customer=await user('demo@petcare.local','Demo@Dev123456','Lê An Nhiên','customer');
 let [org]=await rows<any>("SELECT id FROM organizations WHERE slug='pawcare-demo'");
 if(!org){const r=await exec("INSERT INTO organizations(name,slug) VALUES('PawCare Demo','pawcare-demo')");org={id:r.insertId};}
 for(const [uid,role] of [[admin,'admin'],[staff,'staff']] as const){
  await exec('INSERT INTO organization_members(organization_id,user_id,role) VALUES(?,?,?) ON CONFLICT (organization_id,user_id) DO UPDATE SET role=EXCLUDED.role,is_active=TRUE',[org.id,uid,role]);
 }
 await exec('INSERT INTO organization_staff_profiles(organization_id,user_id,specialty,bio) VALUES(?,?,?,?) ON CONFLICT(organization_id,user_id) DO NOTHING',[org.id,staff,'Chăm sóc & spa thú cưng','Nhân viên mẫu: Trần Mạnh Hùng']);
 const catalog=[['Tắm & sấy cơ bản','Spa','Làm sạch, chải lông và sấy khô',60,180000],['Cắt tỉa lông','Spa','Cắt tỉa tạo kiểu phù hợp',90,250000],['Vệ sinh tai & móng','Chăm sóc','Vệ sinh tai, cắt và mài móng',30,90000],['Khám sức khỏe tổng quát','Sức khỏe','Đánh giá tình trạng sức khỏe',60,350000]];
 for(const [name,cat,description,duration,price] of catalog)await exec('INSERT INTO services(organization_id,name,category,description,duration_minutes,price) VALUES(?,?,?,?,?,?) ON CONFLICT (organization_id,name) DO NOTHING',[org.id,name,cat,description,duration,price]);
 let pets=await rows<any>('SELECT id FROM pets WHERE owner_id=?',[customer]);
 if(!pets.length){await exec('INSERT INTO pets(owner_id,name,species,breed,gender,birthday,weight_kg,color) VALUES(?,?,?,?,?,?,?,?)',[customer,'Milo','dog','Poodle','male','2022-04-12',4.8,'Nâu vàng']);pets=await rows<any>('SELECT id FROM pets WHERE owner_id=?',[customer]);}
 if(!(await rows('SELECT id FROM appointments WHERE organization_id=? AND customer_id=?',[org.id,customer])).length){
  const [service]=await rows<any>('SELECT * FROM services WHERE organization_id=? LIMIT 1',[org.id]);
  const future=new Date();future.setUTCDate(future.getUTCDate()+3);future.setUTCHours(3,0,0,0);if(future.getUTCDay()===0)future.setUTCDate(future.getUTCDate()+1);
  const finish=new Date(future.getTime()+service.duration_minutes*60000);
  await exec('INSERT INTO appointments(organization_id,customer_id,pet_id,service_id,staff_id,starts_at,ends_at,status,price_snapshot,notes) VALUES(?,?,?,?,?,?,?,?,?,?)',[org.id,customer,pets[0].id,service.id,staff,sqlUTC(future),sqlUTC(finish),'confirmed',service.price,'Lịch hẹn dữ liệu mẫu']);
 }
 console.log('Demo seed OK:',{owner,admin,staff,customer,org:org.id});
}
