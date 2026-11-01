/** Decorative vector flourishes for PawCare. Not interactive or data driven. */
export function PetDoodles({variant='trail',className=''}:{
 variant?:'trail'|'leaves'|'sparkles';className?:string;
}){
 if(variant==='leaves')return <svg className={`pc-doodles pc-doodles-leaves ${className}`} viewBox="0 0 146 90" fill="none" aria-hidden="true" focusable="false">
  <path d="M14 81C52 63 78 48 98 12" stroke="#91B976" strokeWidth="3" strokeLinecap="round"/>
  <path d="M44 65C18 62 11 47 20 33c18-3 29 10 24 32Z" fill="#94C77E"/>
  <path d="M72 47C53 27 61 11 77 8c11 11 8 27-5 39Z" fill="#C0DC8B"/>
  <path d="M91 30c9-21 26-22 38-12-1 20-17 29-38 12Z" fill="#6FA963"/>
  <path d="M105 47c18-8 32-2 35 10-13 14-29 10-35-10Z" fill="#B4D88C"/>
  <path d="M30 82c8-11 17-14 26-10-3 12-12 17-26 10Z" fill="#82B96E"/>
  <g fill="#FFFEF7" stroke="#F4E5AF" strokeWidth="1.2"><circle cx="92" cy="62" r="7"/><circle cx="105" cy="64" r="7"/><circle cx="99" cy="52" r="7"/><circle cx="100" cy="71" r="7"/></g>
  <circle cx="99" cy="62" r="4.4" fill="#F1BF55"/>
 </svg>;
 if(variant==='sparkles')return <svg className={`pc-doodles pc-doodles-sparkles ${className}`} viewBox="0 0 120 90" fill="none" aria-hidden="true" focusable="false">
  <g className="pc-doodles-star" stroke="#F4B63D" strokeWidth="4.5" strokeLinecap="round">
   <path d="M29 19 32 9M16 24 8 19M17 35 8 42M42 27l11-5M42 42l8 7"/>
  </g>
  <path d="M91 57c-12-18-28-4-23 9 4 10 23 18 23 18s18-12 21-23c3-14-17-19-21-4Z" stroke="#F08D91" strokeWidth="4" fill="#FFF2EE"/>
  <circle cx="70" cy="26" r="5" fill="#A9D382"/><circle cx="81" cy="18" r="4" fill="#D6E8A2"/>
 </svg>;
 return <svg className={`pc-doodles pc-doodles-trail ${className}`} viewBox="0 0 184 94" fill="none" aria-hidden="true" focusable="false">
  <path d="M9 82C30 60 44 68 54 50S82 41 99 30S129 24 142 11" stroke="#9DCAA6" strokeWidth="2.6" strokeDasharray="3 8" strokeLinecap="round"/>
  <g className="pc-doodles-paw" fill="#A4CF8B">
   <ellipse cx="40" cy="17" rx="6.6" ry="8" transform="rotate(-17 40 17)"/>
   <ellipse cx="57" cy="12" rx="6" ry="7.5" transform="rotate(12 57 12)"/>
   <ellipse cx="72" cy="20" rx="6" ry="7" transform="rotate(33 72 20)"/>
   <ellipse cx="34" cy="34" rx="6" ry="7" transform="rotate(-35 34 34)"/>
   <path d="M44 45c1-12 14-21 24-14 8 5 10 19 0 24-6 3-9-1-14-1-6-1-12 1-10-9Z"/>
  </g>
  <path d="M147 69c-10-15-25-3-19 9 3 8 20 14 20 14s15-11 17-20c2-11-14-15-18-3Z" fill="#F6D5D2" stroke="#EA999F" strokeWidth="2"/>
 </svg>;
}
