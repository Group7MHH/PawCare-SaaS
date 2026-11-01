import type {SVGProps} from 'react';

/**
 * A small set of hand-drawn, flat-colour SVG pet illustrations.
 * Every service has its own animal, pose and accessory; no photographs,
 * generated-image URLs, font glyphs, filters or third-party assets.
 * Keep illustrations presentation-only: appointment/service data stays untouched.
 */
export type ArtworkKind =
 'bath'|'groom'|'nails'|'vet'|'spa'|'ears'|'walk'|'dental'|'daycare'|
 'welcome'|'pet'|'dog'|'cat';

type Props=Omit<SVGProps<SVGSVGElement>,'children'> & {kind?:ArtworkKind;variant?:number};

export function serviceArtworkKind(name:string,category=''):ArtworkKind{
 const normalized=(name+' '+category).toLocaleLowerCase('vi-VN');
 if(/móng|nail/.test(normalized))return 'nails';
 if(/vệ sinh tai|làm sạch tai|ngoáy tai|ear/.test(normalized))return 'ears';
 if(/răng|miệng|dental/.test(normalized))return 'dental';
 if(/tắm|bath|vệ sinh|khử mùi/.test(normalized))return 'bath';
 if(/cắt tỉa|tỉa lông|cắt lông|groom/.test(normalized))return 'groom';
 if(/khám|tiêm|sức khỏe|bác sĩ|bệnh|vet/.test(normalized))return 'vet';
 if(/spa|massage|thư giãn/.test(normalized))return 'spa';
 if(/dạo|đi bộ|huấn luyện|walk/.test(normalized))return 'walk';
 if(/trông giữ|khách sạn|lưu trú|daycare/.test(normalized))return 'daycare';
 return 'pet';
}

const backgrounds:Record<ArtworkKind,string>={
 bath:'#D9F3ED',groom:'#FFF2DE',nails:'#FCEBD8',vet:'#DFF2F5',
 spa:'#FCE8EA',ears:'#FFEAD7',walk:'#E4F3DF',dental:'#DDF2F3',
 daycare:'#FFF0DD',welcome:'#E9F6EA',pet:'#E8F5E8',dog:'#E8F5E8',cat:'#FFF1DE'
};

const Ink='#514941';
function BathPoodle(){return <g strokeLinecap="round" strokeLinejoin="round">
 <path d="M42 151 Q41 187 72 188 H171 Q199 187 196 151Z" fill="#70BEB5" stroke="#468F88" strokeWidth="3"/>
 <path d="M43 152 H196" stroke="#468F88" strokeWidth="7"/>
 <path d="M57 49 V27 Q57 18 68 18 H107" stroke="#478E87" strokeWidth="8" fill="none"/>
 <path d="M96 20 H116" stroke="#478E87" strokeWidth="7"/>
 <path d="M107 28 L101 42" stroke="#6EBAB6" strokeWidth="3"/><path d="M123 34 L119 45" stroke="#6EBAB6" strokeWidth="3"/>
 <g fill="#C99761" stroke="#B07B4B" strokeWidth="2.5">
  <circle cx="75" cy="93" r="24"/><circle cx="165" cy="91" r="23"/>
  <ellipse cx="121" cy="107" rx="53" ry="55"/>
 </g>
 <path d="M92 66 C85 52 97 43 110 49 C119 40 137 46 137 59 C150 63 148 82 135 83 C121 75 104 79 92 82 C82 80 82 70 92 66Z" fill="#E3BC8B" stroke="#B07B4B" strokeWidth="2.5"/>
 <ellipse cx="118" cy="126" rx="29" ry="25" fill="#F9EAD4"/>
 <path d="M94 108 Q103 99 111 108 M129 108 Q138 99 146 108" fill="none" stroke={Ink} strokeWidth="4"/>
 <ellipse cx="120" cy="120" rx="8" ry="5.5" fill={Ink}/>
 <path d="M120 126 Q112 137 103 130 M120 126 Q128 138 138 130" stroke={Ink} fill="none" strokeWidth="2.5"/>
 <path d="M116 137 Q123 150 130 137" fill="#EB8795" stroke="#C86677" strokeWidth="1.5"/>
 <g fill="#fff"><circle cx="85" cy="136" r="14"/><circle cx="108" cy="148" r="15"/><circle cx="138" cy="144" r="16"/><circle cx="163" cy="137" r="14"/><circle cx="76" cy="60" r="10"/><circle cx="146" cy="40" r="12"/></g>
 <g fill="#fff" stroke="#A8DED8" strokeWidth="2"><circle cx="182" cy="63" r="9"/><circle cx="41" cy="104" r="7"/><circle cx="199" cy="99" r="5"/></g>
 </g>;}
function GroomMaltese(){return <g strokeLinejoin="round" strokeLinecap="round">
 <ellipse cx="109" cy="170" rx="74" ry="17" fill="#E9D5B1" opacity=".5"/>
 <path d="M61 146 Q49 179 79 182 H152 Q180 170 161 143" fill="#F9F7EF" stroke="#B5AC9E" strokeWidth="3"/>
 <path d="M79 89 Q52 93 54 128 Q58 146 77 142 L98 112" fill="#EAE7DE" stroke="#B5AC9E" strokeWidth="3"/>
 <path d="M149 90 Q178 91 178 124 Q177 144 157 139 L143 112" fill="#EAE7DE" stroke="#B5AC9E" strokeWidth="3"/>
 <ellipse cx="116" cy="110" rx="59" ry="55" fill="#FFFDF7" stroke="#B5AC9E" strokeWidth="3"/>
 <path d="M71 77 C57 62 77 47 87 56 C87 38 108 43 114 49 C128 37 147 48 145 59 C164 56 169 75 159 85" fill="#FFFDF7" stroke="#B5AC9E" strokeWidth="3"/>
 <ellipse cx="96" cy="113" rx="5" ry="6" fill={Ink}/><ellipse cx="141" cy="113" rx="5" ry="6" fill={Ink}/>
 <path d="M117 125 Q126 118 134 125 Q129 134 123 133Z" fill={Ink}/>
 <path d="M123 134 Q114 142 106 135 M123 134 Q134 142 142 134" stroke={Ink} strokeWidth="2.7" fill="none"/>
 <ellipse cx="88" cy="127" rx="11" ry="6" fill="#E9A8A3" opacity=".65"/>
 <ellipse cx="151" cy="127" rx="11" ry="6" fill="#E9A8A3" opacity=".65"/>
 <path d="M114 54 Q110 34 127 37 Q134 41 126 51" fill="#E9A4B2" stroke="#C77B8E" strokeWidth="2"/>
 <path d="M116 53 Q97 45 100 33 Q110 29 117 44 M124 52 Q141 37 149 47 Q148 59 126 58Z" fill="#E9A4B2" stroke="#C77B8E" strokeWidth="2"/>
 <circle cx="121" cy="51" r="5" fill="#C77B8E"/>
 <ellipse cx="89" cy="169" rx="18" ry="11" fill="#FFFDF7"/><ellipse cx="145" cy="169" rx="18" ry="11" fill="#FFFDF7"/>
 <g transform="translate(179 85) rotate(30)"><path d="M0 5 V68" stroke="#B48C50" strokeWidth="7"/><path d="M-13 3 H13" stroke="#E6B772" strokeWidth="11"/></g>
 <path d="M39 43 L44 33 L49 43 L59 48 L49 53 L44 63 L39 53 L29 48Z" fill="#EAC46D"/>
 </g>;}
function NailsCorgi(){return <g strokeLinecap="round" strokeLinejoin="round">
 <ellipse cx="115" cy="173" rx="81" ry="13" fill="#EEC5A2" opacity=".45"/>
 <path d="M73 139 Q56 165 77 184 H154 Q182 165 163 136" fill="#D68F53" stroke="#AC6A3E" strokeWidth="3"/>
 <path d="M66 79 L52 29 Q50 19 64 25 L96 57 M153 60 L184 25 Q195 19 191 34 L171 84" fill="#C77D43" stroke="#AC6A3E" strokeWidth="3"/>
 <path d="M72 76 L63 39 L93 68 M162 65 L180 40 L169 79" fill="#F5B8AB"/>
 <path d="M68 95 Q62 57 100 54 Q145 43 172 83 Q186 117 162 146 Q125 163 87 148 Q58 127 68 95Z" fill="#D89658" stroke="#AC6A3E" strokeWidth="3"/>
 <path d="M104 54 Q117 75 113 103 L139 123 Q158 107 152 58" fill="#FBE2BE"/>
 <ellipse cx="119" cy="121" rx="45" ry="29" fill="#FFF2D9"/>
 <path d="M81 103 Q91 94 99 103 M142 103 Q152 94 161 103" stroke={Ink} strokeWidth="4" fill="none"/>
 <path d="M110 116 Q119 109 128 116 Q124 125 119 125Z" fill={Ink}/>
 <path d="M119 126 Q110 138 100 132 M119 126 Q129 138 140 132" stroke={Ink} strokeWidth="2.5" fill="none"/>
 <ellipse cx="86" cy="121" rx="12" ry="6" fill="#E4A08B"/><ellipse cx="156" cy="121" rx="12" ry="6" fill="#E4A08B"/>
 <path d="M106 153 L112 171 L126 171 L134 151" fill="#FBE2BE"/>
 <path d="M71 140 Q46 145 48 163 Q55 178 74 173 Q89 163 83 144Z" fill="#FBE2BE" stroke="#AC6A3E" strokeWidth="2.5"/>
 <path d="M59 164 L59 171 M67 165 L67 172 M75 161 L75 169" stroke="#AC6A3E" strokeWidth="2"/>
 <g transform="translate(173 145) rotate(-23)"><path d="M0 0 L17 -28 M3 0 L28 -18" stroke="#648A90" strokeWidth="7" fill="none"/><circle cx="1" cy="2" r="6" fill="none" stroke="#648A90" strokeWidth="4"/><circle cx="26" cy="-20" r="6" fill="none" stroke="#648A90" strokeWidth="4"/></g>
 </g>;}
function EarTabby(){return <g strokeLinejoin="round" strokeLinecap="round">
 <ellipse cx="115" cy="173" rx="76" ry="12" fill="#EBC8A6" opacity=".4"/>
 <path d="M66 86 L57 31 Q56 20 68 29 L91 54 M151 60 L176 28 Q192 18 185 39 L173 87" fill="#D99A5A" stroke="#A87046" strokeWidth="3"/>
 <path d="M68 67 L67 42 L85 62 M163 62 L180 42 L174 72" fill="#E9AAA4"/>
 <ellipse cx="118" cy="110" rx="65" ry="63" fill="#E9AD6F" stroke="#A87046" strokeWidth="3"/>
 <path d="M101 49 L109 71 M128 49 L124 70 M75 72 L92 83 M159 70 L145 82" stroke="#AD754C" strokeWidth="5"/>
 <path d="M94 101 Q104 91 113 102 M132 101 Q142 91 152 102" stroke={Ink} strokeWidth="3.7" fill="none"/>
 <path d="M117 116 L127 116 L122 123Z" fill="#D07E76"/>
 <path d="M122 123 Q115 134 107 128 M122 123 Q129 134 139 128" stroke={Ink} strokeWidth="2.5" fill="none"/>
 <path d="M83 122 L51 117 M83 133 L50 136 M155 122 L187 117 M155 133 L187 137" stroke="#947356" strokeWidth="2.3"/>
 <path d="M82 157 Q118 175 155 156 Q174 176 143 182 H90 Q58 179 82 157Z" fill="#F8EBD7" stroke="#B88B64" strokeWidth="2.5"/>
 <path d="M170 75 Q198 65 203 84" stroke="#6BB7AE" strokeWidth="9" fill="none"/>
 <rect x="182" y="53" width="8" height="35" rx="4" fill="#6BB7AE" transform="rotate(23 182 53)"/>
 <ellipse cx="192" cy="53" rx="8" ry="12" fill="#FEFEFD" transform="rotate(23 192 53)"/>
 <path d="M37 53 L44 36 M199 122 L206 116" stroke="#EAB85D" strokeWidth="4"/>
 </g>;}
function VetShiba(){return <g strokeLinecap="round" strokeLinejoin="round">
 <path d="M70 145 Q56 183 83 187 H156 Q181 185 165 146" fill="#F8F9F5" stroke="#9AB3AE" strokeWidth="3"/>
 <path d="M110 135 V185 M110 154 L88 144 M110 154 L140 141" stroke="#9AB3AE" strokeWidth="2.5"/>
 <path d="M73 81 L64 32 Q62 20 76 35 L96 57 M149 58 L167 32 Q181 19 180 40 L171 84" fill="#C98C58" stroke="#A36E46" strokeWidth="3"/>
 <path d="M73 72 L74 45 L91 65 M154 65 L173 43 L170 76" fill="#EAB4A0"/>
 <path d="M69 95 Q70 53 117 51 Q161 50 173 93 Q185 132 153 147 Q125 159 88 144 Q59 128 69 95Z" fill="#DCA16B" stroke="#A36E46" strokeWidth="3"/>
 <path d="M97 57 Q113 79 108 104 L118 118 Q131 98 127 56" fill="#FCEDDB"/>
 <path d="M87 103 Q96 95 105 104 M140 103 Q150 94 158 104" fill="none" stroke={Ink} strokeWidth="4"/>
 <ellipse cx="121" cy="123" rx="34" ry="22" fill="#FFF1DF"/>
 <path d="M113 116 Q121 111 129 116 Q128 124 121 125Z" fill={Ink}/>
 <path d="M121 125 Q114 135 105 130 M121 125 Q127 135 137 130" fill="none" stroke={Ink} strokeWidth="2.3"/>
 <path d="M84 144 C80 162 102 163 103 178 M158 145 C164 164 138 166 136 178" fill="none" stroke="#69A6AB" strokeWidth="8"/>
 <circle cx="121" cy="175" r="12" fill="#E6F0F1" stroke="#69A6AB" strokeWidth="4"/>
 <circle cx="181" cy="42" r="22" fill="#79BDB3"/>
 <path d="M181 29 V55 M168 42 H194" stroke="#fff" strokeWidth="7"/>
 </g>;}
function SpaCat(){return <g strokeLinecap="round" strokeLinejoin="round">
 <ellipse cx="120" cy="165" rx="92" ry="22" fill="#F3C6C4"/>
 <path d="M49 116 Q54 63 116 65 Q179 65 187 120 L183 155 Q119 178 51 151Z" fill="#9897A9" stroke="#767787" strokeWidth="3"/>
 <path d="M63 93 L56 55 L83 73 M160 74 L178 54 L172 95" fill="#9897A9" stroke="#767787" strokeWidth="2.5"/>
 <path d="M64 77 L64 61 L80 80 M163 80 L174 61 L172 83" fill="#F0B8BB"/>
 <ellipse cx="121" cy="121" rx="59" ry="43" fill="#B3B1C0"/>
 <path d="M69 77 Q65 47 91 44 Q100 27 120 37 Q140 27 148 45 Q173 41 177 76Z" fill="#F8E5EB" stroke="#D6ABB9" strokeWidth="3"/>
 <path d="M83 56 Q114 45 164 57" stroke="#EFC4D2" strokeWidth="5" fill="none"/>
 <circle cx="164" cy="54" r="14" fill="#F8E5EB" stroke="#D6ABB9" strokeWidth="2.5"/>
 <ellipse cx="97" cy="113" rx="21" ry="13" fill="#A9D4A3" transform="rotate(-9 97 113)"/>
 <ellipse cx="146" cy="113" rx="21" ry="13" fill="#A9D4A3" transform="rotate(9 146 113)"/>
 <path d="M91 112 L100 119 M142 107 L150 119" stroke="#79B37A" strokeWidth="3"/>
 <path d="M115 133 L125 133 L120 139Z" fill="#D89098"/>
 <path d="M120 139 Q111 145 105 139 M120 139 Q128 146 136 139" fill="none" stroke={Ink} strokeWidth="2.5"/>
 <path d="M56 155 Q91 143 119 151 Q147 144 183 155 L189 184 H48Z" fill="#EBAFBF" stroke="#CC92A5" strokeWidth="2.5"/>
 <path d="M65 164 Q118 151 176 165" fill="none" stroke="#F5D0DB" strokeWidth="4"/>
 <path d="M39 47 L45 36 M198 64 L204 56" stroke="#F1C167" strokeWidth="5"/>
 </g>;}
function WalkDachshund(){return <g strokeLinecap="round" strokeLinejoin="round">
 <path d="M18 160 Q38 154 47 173 M184 170 Q200 150 222 164" stroke="#A2CC98" strokeWidth="6" fill="none"/>
 <path d="M93 112 Q121 102 172 119 Q191 132 173 158 L103 161Z" fill="#B77C55" stroke="#865C47" strokeWidth="3"/>
 <path d="M115 148 L110 179 M170 146 L173 179" stroke="#865C47" strokeWidth="10"/>
 <path d="M108 180 H125 M164 180 H181" stroke="#865C47" strokeWidth="9"/>
 <path d="M179 122 Q196 101 206 118" stroke="#B77C55" strokeWidth="9" fill="none"/>
 <path d="M76 79 Q48 60 45 105 Q46 138 69 137 L96 94" fill="#8C5F48" stroke="#74513F" strokeWidth="3"/>
 <ellipse cx="89" cy="101" rx="48" ry="49" fill="#B77C55" stroke="#865C47" strokeWidth="3"/>
 <path d="M100 93 Q121 98 125 115 Q115 142 84 139 Q62 128 69 109Z" fill="#E8C6A3"/>
 <circle cx="97" cy="93" r="4.5" fill={Ink}/><ellipse cx="122" cy="115" rx="8" ry="6" fill={Ink}/>
 <path d="M122 121 Q116 130 107 125" stroke={Ink} strokeWidth="2.5" fill="none"/>
 <path d="M118 129 Q122 143 130 134" fill="#E991A0"/>
 <path d="M89 144 Q96 151 107 146" stroke="#5BA98F" strokeWidth="7" fill="none"/>
 <path d="M95 147 Q103 90 126 48 Q146 23 161 38" stroke="#5BA98F" strokeWidth="3" fill="none"/>
 <circle cx="182" cy="172" r="17" fill="#F4BE5B" stroke="#C18C39" strokeWidth="3"/>
 <path d="M170 160 Q185 170 193 181" stroke="#FFE4A0" strokeWidth="4"/>
 </g>;}
function DentalPup(){return <g strokeLinecap="round" strokeLinejoin="round">
 <path d="M75 60 Q51 36 42 67 Q37 94 57 105 L82 88" fill="#E1B98C" stroke="#B58A62" strokeWidth="3"/>
 <path d="M159 62 Q180 35 188 71 Q192 98 172 108 L155 85" fill="#E1B98C" stroke="#B58A62" strokeWidth="3"/>
 <ellipse cx="116" cy="109" rx="65" ry="59" fill="#F5D6AF" stroke="#B58A62" strokeWidth="3"/>
 <path d="M102 52 Q110 70 105 87 L130 103 L143 54" fill="#FFF4E6"/>
 <path d="M85 102 Q96 92 104 103 M133 103 Q145 92 155 102" stroke={Ink} strokeWidth="4" fill="none"/>
 <ellipse cx="119" cy="119" rx="34" ry="25" fill="#FFF3E6"/><ellipse cx="117" cy="115" rx="7" ry="5" fill={Ink}/>
 <path d="M98 135 Q118 156 138 135" fill="#BD6F6E" stroke={Ink} strokeWidth="2.5"/>
 <path d="M102 136 V144 M113 141 V148 M125 140 V147 M135 136 V142" stroke="#FFF" strokeWidth="6"/>
 <path d="M69 158 Q117 172 164 158 L167 181 H70Z" fill="#8BC5BF" stroke="#5E9F9B" strokeWidth="3"/>
 <path d="M179 44 Q197 62 187 85 Q170 83 166 65 Q157 51 171 41Z" fill="#fff" stroke="#8ABBB8" strokeWidth="3"/>
 <path d="M180 53 V72" stroke="#8ABBB8" strokeWidth="3"/>
 </g>;}
function DaycarePets(){return <g strokeLinecap="round" strokeLinejoin="round">
 <path d="M49 145 Q63 121 91 141 L115 169 Q93 189 54 179Z" fill="#E8A766" stroke="#B77845" strokeWidth="3"/>
 <path d="M46 86 L38 43 L66 63 M86 63 L111 43 L103 95" fill="#E8A766" stroke="#B77845" strokeWidth="3"/>
 <path d="M43 77 L45 56 L60 69 M90 69 L104 55 L101 77" fill="#E8B6AB"/>
 <ellipse cx="75" cy="111" rx="44" ry="46" fill="#F0B77F" stroke="#B77845" strokeWidth="3"/>
 <path d="M54 109 Q62 102 69 109 M82 109 Q90 101 98 109" stroke={Ink} strokeWidth="3.5" fill="none"/>
 <path d="M71 122 L80 122 L75 128Z" fill="#C88484"/>
 <path d="M75 128 Q67 135 62 129 M75 128 Q84 134 90 129" stroke={Ink} strokeWidth="2" fill="none"/>
 <path d="M115 148 Q131 125 167 141 Q191 151 190 177 H116Z" fill="#F6D5A6" stroke="#C0996C" strokeWidth="3"/>
 <path d="M137 84 Q108 68 117 106 Q125 125 140 118 M176 86 Q204 66 199 108 Q191 123 177 118" fill="#C78F60" stroke="#A8764B" strokeWidth="3"/>
 <ellipse cx="157" cy="112" rx="41" ry="40" fill="#EBC494" stroke="#A8764B" strokeWidth="3"/>
 <path d="M130 109 Q139 99 148 109 M163 109 Q172 99 183 109" stroke={Ink} strokeWidth="3.3" fill="none"/>
 <ellipse cx="157" cy="125" rx="21" ry="16" fill="#FFF1DA"/>
 <ellipse cx="157" cy="121" rx="6" ry="4" fill={Ink}/>
 <path d="M156 127 Q151 133 145 130 M157 127 Q164 133 170 130" stroke={Ink} strokeWidth="2" fill="none"/>
 <circle cx="117" cy="167" r="15" fill="#71C6B1" stroke="#438F7F" strokeWidth="3"/>
 <path d="M109 155 Q120 164 124 177" stroke="#E6F5EB" strokeWidth="4"/>
 </g>;}
function PetCorgi(){return <g strokeLinecap="round" strokeLinejoin="round">
 <path d="M75 134 Q64 162 83 182 H160 Q174 162 161 132Z" fill="#DDA065" stroke="#B77A49" strokeWidth="3"/>
 <path d="M64 79 L45 31 Q47 21 61 30 L94 61 M148 63 L180 31 Q194 23 188 40 L168 82" fill="#D68E54" stroke="#B77A49" strokeWidth="3"/>
 <path d="M65 70 L58 44 L91 65 M153 65 L179 45 L170 76" fill="#F2BBAC"/>
 <ellipse cx="116" cy="108" rx="66" ry="60" fill="#E6A567" stroke="#B77A49" strokeWidth="3"/>
 <path d="M101 52 Q118 71 113 103 L132 115 Q141 92 137 52" fill="#FFF2D9"/>
 <ellipse cx="116" cy="124" rx="40" ry="29" fill="#FFF2DF"/>
 <path d="M82 104 Q93 95 103 105 M133 105 Q146 95 155 104" stroke={Ink} strokeWidth="4" fill="none"/>
 <path d="M108 116 Q117 109 126 116 Q124 125 117 126Z" fill={Ink}/>
 <path d="M117 126 Q107 139 97 132 M117 126 Q127 139 138 132" stroke={Ink} strokeWidth="2.5" fill="none"/>
 <path d="M107 140 Q117 157 126 140" fill="#E88B96"/>
 <path d="M79 147 L116 180 L154 147" fill="#5BAF87" stroke="#428F72" strokeWidth="2.5"/>
 <circle cx="117" cy="160" r="7" fill="#F9D37A"/>
 <ellipse cx="82" cy="181" rx="23" ry="9" fill="#FFF2D9"/><ellipse cx="152" cy="181" rx="23" ry="9" fill="#FFF2D9"/>
 </g>;}
function Kitten(){return <g strokeLinecap="round" strokeLinejoin="round">
 <path d="M71 89 L60 33 Q61 22 74 33 L96 57 M151 57 L174 32 Q190 22 184 43 L171 89" fill="#A5ADB2" stroke="#777F83" strokeWidth="3"/>
 <path d="M74 69 L71 45 L91 63 M158 64 L179 45 L171 74" fill="#EFBAC0"/>
 <ellipse cx="122" cy="114" rx="65" ry="60" fill="#B3B9BE" stroke="#777F83" strokeWidth="3"/>
 <path d="M104 54 L112 76 M134 54 L130 76 M81 77 L97 88 M159 76 L145 87" stroke="#8A9498" strokeWidth="5"/>
 <path d="M88 109 Q100 100 110 109 M135 109 Q146 100 157 109" stroke={Ink} strokeWidth="3.8" fill="none"/>
 <path d="M117 122 L128 122 L123 130Z" fill="#D98F99"/>
 <path d="M123 130 Q116 139 106 132 M123 130 Q130 139 140 132" stroke={Ink} strokeWidth="2.5" fill="none"/>
 <path d="M82 123 L51 117 M84 136 L51 139 M162 123 L192 118 M161 135 L190 140" stroke="#899195" strokeWidth="2.3"/>
 <path d="M82 151 Q123 175 159 151 Q179 175 147 182 H93 Q67 180 82 151Z" fill="#EDEEEB" stroke="#879195" strokeWidth="2.5"/>
 <path d="M134 158 Q147 162 154 156" stroke="#8C9CA1" strokeWidth="3" fill="none"/>
 <circle cx="174" cy="41" r="8" fill="#E9C46A"/>
 </g>;}
function WelcomeDuo(){return <g>
 <g transform="translate(2 14) scale(.65 .78)"><PetCorgi/></g>
 <g transform="translate(87 28) scale(.63 .7)"><Kitten/></g>
 <path d="M165 48 Q171 39 178 48 Q182 39 191 46 Q193 58 179 68 Q166 59 165 48Z" fill="#E9A5AE"/>
 <path d="M32 49 L37 38 L42 49 L54 54 L42 59 L37 70 L32 59 L21 54Z" fill="#F0C76C"/>
 </g>;}
const scenes:Record<ArtworkKind,()=>import('react').ReactElement>={
 bath:BathPoodle,groom:GroomMaltese,nails:NailsCorgi,vet:VetShiba,
 spa:SpaCat,ears:EarTabby,walk:WalkDachshund,dental:DentalPup,
 daycare:DaycarePets,welcome:WelcomeDuo,pet:PetCorgi,dog:PetCorgi,cat:Kitten
};
export function PetArtwork({kind='pet',variant=0,...props}:Props){
 // Portraits vary with pet ID, so profiles are not copies of the same mascot.
 const portraitKind:ArtworkKind=kind==='dog'
   ?(['dog','vet','groom'][Math.abs(variant)%3] as ArtworkKind)
   :kind==='cat'
   ?(['cat','ears','spa'][Math.abs(variant)%3] as ArtworkKind):kind;
 const Scene=scenes[portraitKind];
 return <svg viewBox="0 0 240 200" xmlns="http://www.w3.org/2000/svg"
  role="img" aria-label="Minh họa thú cưng hoạt hình" {...props}>
  <rect width="240" height="200" rx="20" fill={backgrounds[portraitKind]}/>
  <path d="M9 170 Q46 144 87 171 Q136 144 181 164 Q211 146 235 170 V200 H5Z" fill="#9DCDB3" opacity=".2"/>
  <circle cx="200" cy="39" r="18" fill="#FFF" opacity=".37"/>
  <circle cx="30" cy="93" r="8" fill="#FFF" opacity=".38"/>
  <Scene/>
 </svg>;
}
