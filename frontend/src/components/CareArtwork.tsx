import {Activity,CalendarCheck2,ClipboardCheck,HeartPulse,Stethoscope,ShieldCheck} from 'lucide-react';

type CareVisual='record'|'appointment'|'service'|'care'|'analytics'|'profile';
type Props={variant?:CareVisual;className?:string};

/** Pure decorative care-record illustration: no photographs, patient data, or external assets. */
export function CareArtwork({variant='record',className=''}:Props){
 const Symbol=variant==='appointment'?CalendarCheck2:variant==='service'?Stethoscope:variant==='care'?HeartPulse:variant==='analytics'?Activity:variant==='profile'?ShieldCheck:ClipboardCheck;
 const number=variant==='analytics'?'04':variant==='appointment'?'02':variant==='service'?'03':'01';
 return <span className={'pc-care-art pc-care-art--'+variant+' '+className} aria-hidden="true">
  <span className="pc-care-art-back"/>
  <span className="pc-care-art-sheet">
   <span className="pc-care-art-top"><span>PAWCARE / CARE FILE</span><span>{number}</span></span>
   <span className="pc-care-art-symbol"><Symbol size={43} strokeWidth={1.45}/></span>
   <span className="pc-care-art-rule pc-care-art-rule--long"/>
   <span className="pc-care-art-rule"/>
   <span className="pc-care-art-rule pc-care-art-rule--short"/>
   <span className="pc-care-art-bottom"><span/><span/> <span/></span>
  </span>
  <span className="pc-care-art-seal"><HeartPulse size={21} strokeWidth={1.6}/></span>
  <span className="pc-care-art-tab"/>
 </span>;
}
