/**
 * PawCare artwork system.
 * Detailed pet scenes are local ink-and-wash editorial WebP assets; functional UI ornaments remain SVG.
 * No large-scale artificial SVG pet faces; illustrations must be recognizable at card size.
 */
const base='/illustrations/';
type Format='svg'|'webp';
type ArtworkProps={file:string;format?:Format;className?:string;size?:number;alt?:string;priority?:boolean};
function Artwork({file,format='svg',className='',size,alt='',priority=false}:ArtworkProps){
 return <img
  src={`${base}${file}.${format}`}
  className={className}
  width={size}
  height={size}
  alt={alt}
  loading={priority?'eager':'lazy'}
  decoding="async"
  draggable={false}
 />;
}
export function PawcareMark({size=24}:{size?:number}){
 return <Artwork file="pawcare-mark" className="pc-brand-mark" size={size}/>;
}
export function PetPortrait({species,size=64}:{species?:string|null;size?:number}){
 const file=species==='dog'?'avatar-dog':species==='cat'?'avatar-cat':'avatar-other';
 return <Artwork file={file} format={species==='dog'||species==='cat'?'webp':'svg'} className="pc-pet-portrait" size={size}/>;
}
export function CompanionCover(){
 return <Artwork file="companion-hero" format="webp" className="pc-cover-svg" priority/>;
}
export function StaffCareDesk(){
 return <Artwork file="staff-care-photo" format="webp" className="pc-care-svg"/>;
}
export function AdminLedger(){
 return <Artwork file="admin-office-photo" format="webp" className="pc-ledger-svg"/>;
}
export function NotebookStory(){
 return <Artwork file="sidebar-story" format="webp" className="pc-notebook-story"/>;
}
const serviceArtwork=(text:string)=>{
 const label=text.toLocaleLowerCase('vi-VN');
 if(/răng|nha khoa|dental/.test(label))return 'dental';
 if(/tắm|vệ sinh|bath/.test(label))return 'bath';
 if(/cắt|tỉa|spa|làm đẹp|groom/.test(label))return 'groom';
 if(/tiêm|vaccine|vắc/.test(label))return 'vaccine';
 if(/khám|sức khỏe|kiểm tra|điều trị/.test(label))return 'checkup';
 return 'general';
};
export function ServiceArtwork({label}:{label:string}){
 return <Artwork file={`service-${serviceArtwork(label)}`} format="webp" className="pc-service-svg"/>;
}
