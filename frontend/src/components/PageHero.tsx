import type {ReactNode} from 'react';
import {CalendarDays,ChartNoAxesCombined,PawPrint,Scissors,UserRound,Users} from 'lucide-react';

export type HeroTone='mint'|'sage'|'sand'|'sky';
export type HeroVisual='paw'|'calendar'|'service'|'people'|'analytics'|'profile';

type PageHeroProps={
 eyebrow?:string;
 title:string;
 description?:string;
 action?:ReactNode;
 tone?:HeroTone;
 visual?:HeroVisual;
};

/** Tiêu đề trang dùng chung: thẻ "trang sổ" với vạch màu bên trái và icon trên nền kẻ dòng.
 * Thuần trình bày, không có số liệu giả. */
export function PageHero({
 eyebrow,title,description,action,tone='mint',visual='paw'
}:PageHeroProps){
 const Artwork={
  paw:PawPrint,
  calendar:CalendarDays,
  service:Scissors,
  people:Users,
  analytics:ChartNoAxesCombined,
  profile:UserRound
 }[visual];
 return <header className={`pc-shared-hero pc-shared-hero--${tone}`}>
  <div className="pc-shared-hero-copy">
   {eyebrow&&<span className="pc-shared-hero-kicker"><span className="pc-shared-hero-kicker-dot" aria-hidden="true"/>{eyebrow}</span>}
   <h1>{title}</h1>
   {description&&<p>{description}</p>}
   {action&&<div className="pc-shared-hero-actions">{action}</div>}
  </div>
  <div className="pc-shared-hero-visual" aria-hidden="true">
   <span className="pc-hero-ruled"/>
   <span className="pc-hero-badge"><Artwork className="pc-hero-main-icon" size={34} strokeWidth={1.6}/></span>
  </div>
 </header>;
}
