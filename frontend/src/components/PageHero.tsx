import type {ReactNode} from 'react';
import {CareArtwork} from './CareArtwork';

export type HeroTone='mint'|'sage'|'sand'|'sky';
export type HeroVisual='paw'|'calendar'|'service'|'people'|'analytics'|'profile';
type PageHeroProps={eyebrow?:string;title:string;description?:string;action?:ReactNode;tone?:HeroTone;visual?:HeroVisual};

/** A shared medical-record hero: consistent across Customer, Staff and Admin. */
export function PageHero({eyebrow,title,description,action,tone='mint',visual='paw'}:PageHeroProps){
 const art=visual==='calendar'?'appointment':visual==='service'?'service':visual==='people'?'care':visual==='analytics'?'analytics':visual==='profile'?'profile':'record';
 return <header className={`pc-shared-hero pc-shared-hero--${tone}`}>
  <div className="pc-shared-hero-copy">
   {eyebrow&&<span className="pc-shared-hero-kicker"><span className="pc-shared-hero-kicker-dot" aria-hidden="true"/>{eyebrow}</span>}
   <h1>{title}</h1>
   {description&&<p>{description}</p>}
   {action&&<div className="pc-shared-hero-actions">{action}</div>}
  </div>
  <div className="pc-shared-hero-visual" aria-hidden="true">
   <span className="pc-hero-ruled"/>
   <CareArtwork variant={art}/>
  </div>
 </header>;
}
