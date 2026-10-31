import type {Request,Response,RequestHandler} from 'express';
import {randomBytes,createHash} from 'node:crypto';
import {rows,exec} from './db.js';
import {asyncRoute,HttpError} from './http.js';
export type Role='customer'|'staff'|'admin';
export type AuthUser={id:number;full_name:string;email:string;role:Role;phone:string|null;address:string|null;organization_id:number|null;organization_name:string|null};
declare global {namespace Express {interface Request {user?:AuthUser;}}}
const COOKIE='pawcare_session',DAY=86400000;
export function hashToken(token:string){return createHash('sha256').update(token).digest('hex');}
const cookieSecure=()=>process.env.SESSION_COOKIE_SECURE !== 'false' && (process.env.SESSION_COOKIE_SECURE === 'true' || process.env.NODE_ENV==='production');
export async function createSession(res:Response,userId:number,organizationId:number|null=null){
 const token=randomBytes(32).toString('hex');
 await exec('INSERT INTO sessions(user_id,token_hash,expires_at,organization_id) VALUES(?,?,?,?)',[userId,hashToken(token),new Date(Date.now()+7*DAY).toISOString(),organizationId]);
 res.cookie(COOKIE,token,{httpOnly:true,secure:cookieSecure(),sameSite:'lax',path:'/',maxAge:7*DAY});
}
export function clearSession(res:Response){res.clearCookie(COOKIE,{path:'/',httpOnly:true,sameSite:'lax',secure:cookieSecure()});}
export const optionalAuth:RequestHandler=asyncRoute(async(req,_res,next)=>{
 const token=req.cookies?.[COOKIE];
 if(typeof token==='string'&&/^[a-f0-9]{64}$/.test(token)){
  const found=await rows<AuthUser>(`SELECT u.id,u.full_name,u.email,u.phone,u.address,
   u.role AS role,
   o.id AS organization_id,o.name AS organization_name
   FROM sessions s JOIN users u ON u.id=s.user_id
   JOIN organizations o ON o.is_active=TRUE
   
   WHERE s.token_hash=? AND s.expires_at>now() AND u.is_active=TRUE LIMIT 1`,[hashToken(token)]);
  if(found.length)req.user=found[0];
 }
 next();
});
export const requireAuth:RequestHandler=(req,_res,next)=>req.user?next():next(new HttpError(401,'Bạn cần đăng nhập'));
export const requireRole=(...roles:Role[]):RequestHandler=>(req,_res,next)=>req.user&&roles.includes(req.user.role)?next():next(new HttpError(403,'Bạn không có quyền thực hiện'));
export const requireOrganization:RequestHandler=(req,_res,next)=>req.user?.organization_id?next():next(new HttpError(400,'Cửa hàng chưa được cấu hình'));
export function orgId(req:Request):number {if(!req.user?.organization_id)throw new HttpError(400,'Cửa hàng chưa được cấu hình');return req.user.organization_id;}
export async function revokeSession(req:Request){const token=req.cookies?.[COOKIE];if(typeof token==='string')await exec('DELETE FROM sessions WHERE token_hash=?',[hashToken(token)]);}
export async function updateSessionOrganization(req:Request,organizationId:number){
 const token=req.cookies?.[COOKIE];if(typeof token!=='string')throw new HttpError(401,'Phiên không hợp lệ');
 await exec('UPDATE sessions SET organization_id=? WHERE token_hash=?',[organizationId,hashToken(token)]);
}
export function isPrivileged(req:Request){return req.user?.role==='staff'||req.user?.role==='admin';}
