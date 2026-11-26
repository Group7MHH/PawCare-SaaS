import type {ReactNode} from 'react';
import {useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import {X,Inbox,LoaderCircle,ArrowRight,Search,CircleAlert} from 'lucide-react';
import {statusClass,statusName} from '../lib/api';
import {PageHero,type HeroTone,type HeroVisual} from './PageHero';
export function PageTitle({eyebrow,title,description,action}:{eyebrow?:string;title:string;description?:string;action?:ReactNode}){
 const label=(eyebrow||'').toLocaleUpperCase('vi-VN');
 let visual:HeroVisual='paw',tone:HeroTone='mint';
 if(/LỊCH|ĐẶT LỊCH|CHĂM SÓC ĐƯỢC GIAO/.test(label+' '+title.toUpperCase())){visual='calendar';tone='sky';}
 else if(/NHÂN VIÊN|NHÂN SỰ|KHÁCH HÀNG|THÀNH VIÊN/.test(label+' '+title.toUpperCase())){visual='people';tone='sand';}
 else if(/DỊCH VỤ|TRUNG TÂM/.test(label+' '+title.toUpperCase())){visual='service';tone='sage';}
 else if(/TÀI KHOẢN|THÔNG TIN CÁ NHÂN/.test(label+' '+title.toUpperCase())){visual='profile';tone='sky';}
 else if(/TỔNG QUAN|BẢNG ĐIỀU KHIỂN/.test(label+' '+title.toUpperCase())){visual='analytics';tone='mint';}
 return <PageHero eyebrow={eyebrow} title={title} description={description} action={action} tone={tone} visual={visual}/>;
}
export function Panel({title,sub,action,children,className=''}:{title?:string;sub?:string;action?:ReactNode;children:ReactNode;className?:string}){return <section className={`panel ${className}`}><div className="panel-head">{title&&<div><h3>{title}</h3>{sub&&<p>{sub}</p>}</div>}{action&&<div>{action}</div>}</div>{children}</section>;}
export function Badge({status}:{status:string}){return <span className={`badge ${statusClass[status]||'gray'}`}><span className="badge-dot"/>{statusName[status]||status}</span>;}
export function Metric({icon,title,value,foot,tone='teal'}:{icon:ReactNode;title:string;value:ReactNode;foot?:string;tone?:string}){return <div className="metric"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-label">{title}</div><div className="metric-value">{value}</div>{foot&&<div className="metric-foot">{foot}</div>}</div>;}
export function Empty({title='Chưa có dữ liệu',description='Dữ liệu sẽ hiển thị tại đây khi được thêm.',action}:{title?:string;description?:string;action?:ReactNode}){return <div className="empty"><div className="empty-icon"><Inbox size={26}/></div><strong>{title}</strong><p>{description}</p>{action}</div>;}
export function Loading(){return <div className="loading" role="status" aria-live="polite"><LoaderCircle size={22} className="spin"/> Đang tải dữ liệu...</div>;}
export function ErrorNotice({message}:{message:string}){return <div className="error-box" role="alert"><CircleAlert size={18}/><span>{message}</span></div>;}
export function Modal({title,children,onClose,wide=false,className=''}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean;className?:string}){
 const dialogRef=useRef<HTMLDivElement>(null);
 const closeRef=useRef(onClose);
 closeRef.current=onClose;
 useEffect(()=>{
  const dialog=dialogRef.current;
  if(!dialog)return;
  const previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const previousOverflow=document.body.style.overflow;
  const previousPadding=document.body.style.paddingRight;
  const scrollbarWidth=window.innerWidth-document.documentElement.clientWidth;
  document.body.style.overflow='hidden';
  if(scrollbarWidth>0&&document.documentElement.clientWidth>0){
   const padding=parseFloat(window.getComputedStyle(document.body).paddingRight)||0;
   document.body.style.paddingRight=(padding+scrollbarWidth)+'px';
  }
  dialog.focus({preventScroll:true});
  const onKey=(e:KeyboardEvent)=>{
   if(Array.from(document.querySelectorAll('[data-pc-modal-root]')).slice(-1)[0]!==dialog.parentElement)return;
   if(e.key==='Escape'){e.preventDefault();closeRef.current();return;}
   if(e.key!=='Tab')return;
   const focusable=Array.from(dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(el=>el.getClientRects().length>0);
   if(!focusable.length){e.preventDefault();dialog.focus();return;}
   const first=focusable[0],last=focusable[focusable.length-1];
   if(!dialog.contains(document.activeElement)||document.activeElement===dialog){e.preventDefault();(e.shiftKey?last:first).focus();}
   else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  };
  document.addEventListener('keydown',onKey);
  return()=>{
   document.removeEventListener('keydown',onKey);
   document.body.style.overflow=previousOverflow;
   document.body.style.paddingRight=previousPadding;
   if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  };
 },[]);
 return createPortal(<div className="modal-backdrop pc-modal-root" data-pc-modal-root onMouseDown={e=>{if(e.target===e.currentTarget)closeRef.current();}} role="presentation"><div ref={dialogRef} tabIndex={-1} className={`modal ${wide?'modal-wide':''} ${className}`.trim()} role="dialog" aria-modal="true" aria-label={title}><div className="modal-head"><h2>{title}</h2><button className="icon-button" type="button" onClick={()=>closeRef.current()} aria-label="Đóng"><X size={20}/></button></div>{children}</div></div>,document.body);
}
export function Field({label,children,hint}:{label:string;children:ReactNode;hint?:string}){return <label className="field"><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>;}
export function SearchBox({value,onChange,placeholder='Tìm kiếm...'}:{value:string;onChange:(v:string)=>void;placeholder?:string}){return <div className="search-box"><Search size={17}/><input aria-label="Tìm kiếm" placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}/></div>;}
export function LinkButton({children,onClick}:{children:ReactNode;onClick:()=>void}){return <button className="text-link" onClick={onClick}>{children}<ArrowRight size={15}/></button>;}
export function TableWrap({children}:{children:ReactNode}){return <div className="table-scroll"><table className="data-table">{children}</table></div>;}
