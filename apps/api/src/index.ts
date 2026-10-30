import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import auth from './routes/auth.js';
import pets from './routes/pets.js';
import appointments from './routes/appointments.js';
import catalog from './routes/catalog.js';
import management from './routes/management.js';
import organizations from './routes/organizations.js';
import {optionalAuth} from './lib/auth.js';
import {handleError,HttpError} from './lib/http.js';
import {rows} from './lib/db.js';
import {migrate} from './migrate.js';
import {bootstrapAdmin} from './bootstrap-owner.js';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
const app=express();app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({contentSecurityPolicy:{directives:{
 'style-src':["'self'","'unsafe-inline'",'https://fonts.googleapis.com'],
 'font-src':["'self'",'https://fonts.gstatic.com','data:'],
 'upgrade-insecure-requests':process.env.NODE_ENV==='production'?[]:null
}}}));
const appOrigin=process.env.APP_ORIGIN || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173';
app.use(cors({origin:appOrigin,credentials:true}));
app.use(express.json({limit:'100kb'}));app.use(cookieParser());
// Cookie session + Origin check cho tất cả request làm thay đổi dữ liệu (CSRF mitigation).
app.use((req,res,next)=>{
 if(['GET','HEAD','OPTIONS'].includes(req.method))return next();
 const origin=req.get('origin');
 if(origin && origin!==appOrigin)return next(new HttpError(403,'Origin không hợp lệ'));
 if(!origin && process.env.NODE_ENV==='production')return next(new HttpError(403,'Thiếu Origin'));
 next();
});
app.get('/api/health',async(_req,res)=>{try{await rows('SELECT 1');res.json({status:'ok'});}catch{res.status(503).json({status:'unavailable'});}});
app.use('/api/auth',rateLimit({windowMs:15*60*1000,limit:100,standardHeaders:'draft-7',legacyHeaders:false}),optionalAuth,auth);
app.use('/api',optionalAuth);
app.use('/api/pets',pets);
app.use('/api/appointments',appointments);
app.use('/api',catalog);
app.use('/api',management);
app.use('/api',organizations);
app.use('/api',(_req,_res,next)=>next(new HttpError(404,'Không tìm thấy API')));
// One public URL: same-origin React SPA + Express API from the same Render Node service.
const webDist=resolve(process.cwd(),'../web/dist');
if(existsSync(webDist)){
 app.use(express.static(webDist,{index:false}));
 app.get('*',(req,res,next)=>req.path.startsWith('/api/')?next(new HttpError(404,'Không tìm thấy API')):res.sendFile(resolve(webDist,'index.html')));
}
app.use((_req,_res,next)=>next(new HttpError(404,'Không tìm thấy trang')));
app.use(handleError);
const port=Number(process.env.PORT||4000);
await migrate();
if(process.env.BOOTSTRAP_ADMIN==='true')await bootstrapAdmin();
if(process.env.NODE_ENV==='production' && appOrigin.startsWith('http:'))throw new Error('APP_ORIGIN phải là HTTPS khi chạy production');
if(process.env.NODE_ENV==='production' && !process.env.APP_ORIGIN && !process.env.RENDER_EXTERNAL_URL)throw new Error('Cần APP_ORIGIN hoặc RENDER_EXTERNAL_URL để xác thực Origin');
app.listen(port,'0.0.0.0',()=>console.log(`PawCare web + API on :${port} (PostgreSQL)`));
export {app};
