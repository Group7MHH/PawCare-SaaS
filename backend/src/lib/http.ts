import type {Request,Response,NextFunction,RequestHandler} from 'express';
import {ZodError, type ZodTypeAny} from 'zod';
export class HttpError extends Error {constructor(public status:number,message:string){super(message);}}
export const asyncRoute=(fn:(req:Request,res:Response,next:NextFunction)=>Promise<unknown>):RequestHandler=>
 (req,res,next)=>{Promise.resolve(fn(req,res,next)).catch(next);};
export function parse<T extends ZodTypeAny>(schema:T,value:unknown):import('zod').infer<T>{return schema.parse(value);}
export function handleError(err:unknown,_req:Request,res:Response,_next:NextFunction){
 if(err instanceof ZodError){res.status(422).json({message:'Dữ liệu không hợp lệ',details:err.flatten()});return;}
 if(err instanceof HttpError){res.status(err.status).json({message:err.message});return;}
 if(typeof err==='object' && err && 'code' in err){
  if(['23505'].includes(String(err.code))){res.status(409).json({message:'Thông tin đã tồn tại'});return;}
  if(['23503'].includes(String(err.code))){res.status(409).json({message:'Không thể xóa vì đang được sử dụng'});return;}
 }
 console.error('[api error]',err);
 res.status(500).json({message:'Có lỗi hệ thống. Vui lòng thử lại.'});
}
export const idParam=(value:string):number=>{const n=Number(value);if(!Number.isSafeInteger(n)||n<1)throw new HttpError(400,'ID không hợp lệ');return n;};
export const pageParams=(req:Request)=>({page:Math.max(1,Math.min(100000,Math.trunc(Number(req.query.page)||1))),limit:Math.max(1,Math.min(100,Math.trunc(Number(req.query.limit)||20)))});
