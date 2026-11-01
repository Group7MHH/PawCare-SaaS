import type {SVGProps} from 'react';
type ArtworkKind='bath'|'groom'|'nails'|'vet'|'spa'|'ears'|'welcome'|'pet';
type Props=SVGProps<SVGSVGElement>&{kind?:ArtworkKind};
export function serviceArtworkKind(name:string,category=''):ArtworkKind{
 const s=(name+' '+category).toLocaleLowerCase('vi-VN');
 if(/móng|nail/.test(s))return 'nails';
 if(/tai|ear/.test(s))return 'ears';
 if(/tắm|vệ sinh|bath/.test(s))return 'bath';
 if(/cắt tỉa|lông|groom/.test(s))return 'groom';
 if(/khám|tiêm|sức khỏe|y tế|bệnh|vet/.test(s))return 'vet';
 if(/spa|massage|thư giãn/.test(s))return 'spa';
 return 'pet';
}
/** Original inline SVG drawings, no third-party images or external assets. */
export function PetArtwork({kind='pet',...props}:Props){
 const cat=kind==='groom'||kind==='ears'||kind==='spa';
 const backgrounds:Record<ArtworkKind,string>={bath:'#d8f2e9',groom:'#fff0d5',nails:'#fff0df',vet:'#dff3f4',spa:'#ffe8e7',ears:'#fff0db',welcome:'#e1f3df',pet:'#edf6e9'};
 return <svg viewBox="0 0 220 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={cat?'Minh họa mèo hoạt hình':'Minh họa chó hoạt hình'} {...props}>
  <rect width="220" height="200" rx="22" fill={backgrounds[kind]}/>
  <circle cx="177" cy="43" r="26" fill="#fff" opacity=".38"/><circle cx="38" cy="56" r="15" fill="#fff" opacity=".45"/>
  <path d="M9 169 Q45 135 80 164 T157 155 T218 162 L220 200 H0Z" fill="#a8d8b3" opacity=".42"/>
  {kind==='bath'&&<><path d="M46 143 Q42 184 76 184 H163 Q185 184 180 143Z" fill="#65bdb3" stroke="#3b9590" strokeWidth="3"/><path d="M44 143 H183" stroke="#3b9590" strokeWidth="7" strokeLinecap="round"/><path d="M64 64 Q58 38 71 20 M77 59 Q91 35 84 19" fill="none" stroke="#50a4a1" strokeWidth="6" strokeLinecap="round"/><path d="M61 21 L96 21" stroke="#347d77" strokeWidth="8" strokeLinecap="round"/><circle cx="96" cy="125" r="13" fill="white"/><circle cx="144" cy="140" r="18" fill="white"/></>}
  {kind==='vet'&&<><circle cx="177" cy="48" r="28" fill="#53b8a3"/><path d="M177 34 V62 M163 48 H191" stroke="white" strokeWidth="9" strokeLinecap="round"/></>}
  {kind==='spa'&&<><ellipse cx="110" cy="147" rx="85" ry="42" fill="#fac7ca" opacity=".85"/><path d="M30 132 Q104 107 189 137" stroke="#f3abb3" strokeWidth="12" fill="none"/><ellipse cx="69" cy="39" rx="20" ry="12" fill="#9fd49f" transform="rotate(-23 69 39)"/><ellipse cx="151" cy="39" rx="20" ry="12" fill="#9fd49f" transform="rotate(23 151 39)"/></>}
  {cat?<g>
   <path d="M52 90 L50 36 Q53 22 66 33 L91 55 Q112 44 136 56 L156 32 Q170 21 170 45 L169 91" fill="#a4a5b3" stroke="#69717a" strokeWidth="4" strokeLinejoin="round"/>
   <path d="M61 75 L61 45 L83 63 M139 62 L159 44 L158 76" fill="#f5b9b5"/>
   <ellipse cx="111" cy="118" rx="66" ry="62" fill="#a4a5b3" stroke="#69717a" strokeWidth="3"/>
   <path d="M91 64 Q104 93 102 122 Q100 148 86 164 L136 164 Q115 131 119 66" fill="#f5f5ef"/>
   <ellipse cx="86" cy="116" rx="21" ry="17" fill="#fff0e8"/><ellipse cx="137" cy="116" rx="20" ry="17" fill="#fff0e8"/>
   <path d="M77 105 Q85 96 93 105 M130 105 Q138 96 146 105" stroke="#41494b" strokeWidth="4" fill="none" strokeLinecap="round"/>
   <path d="M106 118 L116 118 L111 124 Z" fill="#de8b90"/><path d="M111 124 Q106 134 99 128 M111 124 Q117 134 125 128" stroke="#6d5557" strokeWidth="2.6" fill="none" strokeLinecap="round"/>
   <path d="M73 119 L45 113 M74 129 L44 132 M149 119 L176 113 M148 129 L179 133" stroke="#747a82" strokeWidth="2.4" strokeLinecap="round"/>
   <ellipse cx="110" cy="170" rx="48" ry="17" fill="#f5f5ef"/>
  </g>:<g>
   <ellipse cx="113" cy="142" rx="65" ry="47" fill="#f3b66a" stroke="#cb8641" strokeWidth="3"/>
   <path d="M53 60 Q22 61 28 112 Q35 136 55 119 L77 72 M170 65 Q197 54 195 98 Q196 124 171 115 L152 71" fill="#d99048" stroke="#bc773e" strokeWidth="3"/>
   <ellipse cx="111" cy="106" rx="68" ry="62" fill="#f3b66a" stroke="#cb8641" strokeWidth="3"/>
   <path d="M94 48 Q116 38 135 52 L133 97 Q123 114 108 118 L92 90Z" fill="#fff5e5"/>
   <ellipse cx="110" cy="128" rx="39" ry="27" fill="#fff7eb"/>
   <path d="M72 103 Q83 91 94 103 M131 103 Q142 91 153 103" stroke="#51443b" strokeWidth="4" strokeLinecap="round" fill="none"/>
   <path d="M101 116 Q111 108 122 116 Q120 126 111 127 Q101 126 101 116Z" fill="#51443b"/>
   <path d="M111 128 Q104 139 94 133 M111 128 Q116 139 128 133" stroke="#6b4d3b" strokeWidth="3" strokeLinecap="round" fill="none"/>
   <ellipse cx="82" cy="123" rx="13" ry="7" fill="#ed9b86" opacity=".55"/><ellipse cx="140" cy="123" rx="13" ry="7" fill="#ed9b86" opacity=".55"/>
   <path d="M102 141 Q112 166 122 141" fill="#ed7d89" stroke="#b65469" strokeWidth="2"/>
   <ellipse cx="75" cy="176" rx="22" ry="10" fill="#fff5e5"/><ellipse cx="151" cy="176" rx="22" ry="10" fill="#fff5e5"/>
  </g>}
  {kind==='bath'&&<><circle cx="72" cy="55" r="14" fill="white" opacity=".92"/><circle cx="105" cy="42" r="18" fill="white"/><circle cx="134" cy="55" r="13" fill="white"/><circle cx="175" cy="85" r="10" fill="white" opacity=".82"/></>}
  {kind==='groom'&&<><rect x="148" y="34" width="9" height="53" rx="4" fill="#e2a33e" transform="rotate(38 148 34)"/><path d="M158 48 L180 25 M158 48 L184 48" stroke="#d7a33e" strokeWidth="6" strokeLinecap="round"/><path d="M37 51 L42 38 L47 51 L60 56 L47 61 L42 74 L37 61 L23 56Z" fill="#f2c864"/></>}
  {kind==='nails'&&<><g transform="translate(153 139) rotate(-28)"><path d="M0 0 L27 -40 M5 2 L49 -22" stroke="#657a7d" strokeWidth="7" strokeLinecap="round"/><circle cx="3" cy="1" r="7" fill="#edf7f4"/><circle cx="28" cy="-39" r="8" stroke="#657a7d" strokeWidth="5" fill="none"/></g></>}
  {kind==='ears'&&<><path d="M168 110 Q201 89 191 64" stroke="#4bb8b4" strokeWidth="11" strokeLinecap="round" fill="none"/><circle cx="190" cy="63" r="12" fill="#8ce0d1"/><path d="M40 40 L50 26 M185 35 L195 24" stroke="#e7a842" strokeWidth="6" strokeLinecap="round"/></>}
  {kind==='spa'&&<><path d="M58 66 Q109 44 161 66" stroke="#f29cab" strokeWidth="20" strokeLinecap="round" fill="none"/><ellipse cx="86" cy="108" rx="20" ry="13" fill="#9acb8b"/><ellipse cx="140" cy="108" rx="20" ry="13" fill="#9acb8b"/><path d="M64 22 L70 12 M151 18 L157 7" stroke="#e8b04f" strokeWidth="5" strokeLinecap="round"/></>}
  {kind==='vet'&&<><path d="M64 141 Q110 163 154 143" fill="none" stroke="#5aa1c2" strokeWidth="11"/><circle cx="110" cy="151" r="11" fill="#e6eef3" stroke="#5aa1c2" strokeWidth="4"/></>}
 </svg>;
}
