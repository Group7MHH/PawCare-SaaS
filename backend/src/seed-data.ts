/** Optional development fixtures. Never run on production data. */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import {rows,exec,transaction} from './lib/db.js';
export async function seedData(){
 if(process.env.NODE_ENV==='production')throw new Error('Seed is disabled in production');
 const password=process.env.DEV_SEED_PASSWORD;
 if(!password||password.length<12)throw new Error('Set a unique DEV_SEED_PASSWORD (12+ characters) for local demo data');
 const [shop]=await rows<any>('SELECT id FROM organizations LIMIT 1');
 if(!shop)throw new Error('Run migrations before seeding');
 const hash=await bcrypt.hash(password,12);
 await transaction(async db=>{
  const demo=[
   {email:'admin@pawcare.example.test',name:'Admin Demo',role:'admin'},
   {email:'staff@pawcare.example.test',name:'Nhân viên Demo',role:'staff'},
   {email:'customer@pawcare.example.test',name:'Khách hàng Demo',role:'customer'}
  ] as const;
  const ids:Record<string,number>={};
  for(const item of demo){
   const [existing]=await rows<any>('SELECT id FROM users WHERE email=?',[item.email],db);
   const id=existing?.id ?? (await exec('INSERT INTO users(full_name,email,password_hash,role) VALUES(?,?,?,?)',[item.name,item.email,hash,item.role],db)).insertId;
   ids[item.role]=id;
   if(item.role==='staff'||item.role==='admin'){
    await exec('INSERT INTO organization_members(organization_id,user_id,role,is_active) VALUES(?,?,?,TRUE) ON CONFLICT(organization_id,user_id) DO UPDATE SET role=EXCLUDED.role,is_active=TRUE',[shop.id,id,item.role],db);
   }
  }
  await exec("INSERT INTO staff_profiles(user_id,specialty,bio) VALUES(?,?,?) ON CONFLICT(user_id) DO NOTHING",[ids.staff,'Spa thú cưng','Nhân viên demo'],db);
  await exec("INSERT INTO organization_staff_profiles(organization_id,user_id,specialty,bio) VALUES(?,?,?,?) ON CONFLICT(organization_id,user_id) DO NOTHING",[shop.id,ids.staff,'Spa thú cưng','Nhân viên demo'],db);
  await exec("INSERT INTO services(organization_id,name,category,description,duration_minutes,price) VALUES(?,?,?,?,?,?) ON CONFLICT(organization_id,name) DO NOTHING",[shop.id,'Tắm và sấy','Spa','Chăm sóc cơ bản',60,180000],db);
 });
 console.log('Development demo seed prepared (password comes from DEV_SEED_PASSWORD).');
}
