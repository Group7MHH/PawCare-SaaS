/**
 * Original vector artwork for PawCare's Pet Care Journal identity.
 * All illustrations are local SVG assets under /public/illustrations:
 * no remote trackers, emoji glyphs or runtime image fetching.
 */
const base='/illustrations/';
function Artwork({file,className='',size,alt=''}:{file:string;className?:string;size?:number;alt?:string}){
 return <img src={`${base}${file}.svg`} className={className} width={size} height={size} alt={alt} decoding="async" draggable={false}/>;
}
export function PawcareMark({size=24}:{size?:number}){
 return <Artwork file="pawcare-mark" className="pc-brand-mark" size={size}/>;
}
export function PetPortrait({species,size=64}:{species?:string|null;size?:number}){
 return <Artwork file={species==='dog'?'avatar-dog':species==='cat'?'avatar-cat':'avatar-other'} className="pc-pet-portrait" size={size}/>;
}
export function CompanionCover(){return <Artwork file="companion-cover" className="pc-cover-svg"/>;}
export function StaffCareDesk(){return <Artwork file="staff-care-desk" className="pc-care-svg"/>;}
export function AdminLedger(){return <Artwork file="admin-ledger" className="pc-ledger-svg"/>;}
export function NotebookStory(){return <Artwork file="sidebar-story" className="pc-notebook-story"/>;}
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
 return <Artwork file={`service-${serviceArtwork(label)}`} className="pc-service-svg"/>;
}
