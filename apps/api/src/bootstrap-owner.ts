/** Explicit ONE-TIME initial platform OWNER setup, cannot bootstrap a second Owner. */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import {rows,exec,pool,transaction} from './lib/db.js';
import {migrate} from './migrate.js';
export async function bootstrapOwner(){
 const email=(process.env.OWNER_EMAIL||'').trim().toLowerCase();
 const password=process.env.OWNER_PASSWORD||'';
 if(!/^\S+@\S+\.\S+$/.test(email) || password.length<12 || password.length>100)throw new Error('Cần OWNER_EMAIL và OWNER_PASSWORD mạnh từ 12-100 ký tự');
 await migrate();
 await transaction(async db=>{
  await db.query('SELECT pg_advisory_xact_lock(42371, 100)');
  if((await rows('SELECT id FROM users WHERE role=? LIMIT 1',['owner'],db)).length) {console.log('Owner đã tồn tại; không tạo Owner khác từ biến môi trường');return;}
  const existing=await rows('SELECT id FROM users WHERE email=?',[email],db);
  if(existing.length)throw new Error('Email Owner đã tồn tại. Hãy sử dụng email mới, không tự nâng quyền tài khoản.');
  await exec('INSERT INTO users(full_name,email,password_hash,role) VALUES(?,?,?,?)',[process.env.OWNER_FULL_NAME||'PawCare Platform Owner',email,await bcrypt.hash(password,12),'owner'],db);
  console.log('Đã tạo Owner nền tảng:',email);
 });
}
if(process.argv[1] && /(?:^|[\\/])bootstrap-owner\.(?:ts|js)$/.test(process.argv[1])){
 bootstrapOwner().then(()=>pool.end()).catch(async err=>{console.error(err);await pool.end();process.exitCode=1;});
}
