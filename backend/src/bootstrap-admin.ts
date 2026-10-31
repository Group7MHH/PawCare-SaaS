/** Explicit ONE-TIME initial platform ADMIN setup, cannot bootstrap a second Admin. */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import {rows,exec,pool,transaction} from './lib/db.js';
import {migrate} from './migrate.js';
export async function bootstrapAdmin(){
 const email=(process.env.ADMIN_EMAIL||'').trim().toLowerCase();
 const password=process.env.ADMIN_PASSWORD||'';
 if(!/^\S+@\S+\.\S+$/.test(email) || password.length<12 || password.length>100)throw new Error('Cần ADMIN_EMAIL và ADMIN_PASSWORD mạnh từ 12-100 ký tự');
 await migrate();
 await transaction(async db=>{
  await db.query('SELECT pg_advisory_xact_lock(42371, 100)');
  if((await rows('SELECT id FROM users WHERE role=? LIMIT 1',['admin'],db)).length) {console.log('Admin đã tồn tại; không tạo Admin khác từ biến môi trường');return;}
  const existing=await rows('SELECT id FROM users WHERE email=?',[email],db);
  if(existing.length)throw new Error('Email Admin đã tồn tại. Hãy sử dụng email mới, không tự nâng quyền tài khoản.');
  await exec('INSERT INTO users(full_name,email,password_hash,role) VALUES(?,?,?,?)',[process.env.ADMIN_FULL_NAME||'PawCare Platform Admin',email,await bcrypt.hash(password,12),'admin'],db);
  console.log('Đã tạo Admin nền tảng:',email);
 });
}
if(process.argv[1] && /(?:^|[\\/])bootstrap-admin\.(?:ts|js)$/.test(process.argv[1])){
 bootstrapAdmin().then(()=>pool.end()).catch(async err=>{console.error(err);await pool.end();process.exitCode=1;});
}
