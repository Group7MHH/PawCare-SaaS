/** PawCare Care Journal artwork: medical, grooming and administration motifs only.
 * No animal portrait or stock pet artwork is rendered by this component.
 * The role-specific pieces are lightweight local SVG with consistent ink strokes.
 */
const base='/illustrations/';
type ArtworkProps={file:string;className?:string;size?:number;alt?:string;priority?:boolean};
function Artwork({file,className='',size,alt='',priority=false}:ArtworkProps){
 return <img src={`${base}${file}.svg`} className={className} width={size} height={size}
  alt={alt} loading={priority?'eager':'lazy'} decoding="async" draggable={false}/>;
}
export function PawcareMark({size=24}:{size?:number}){
 return <Artwork file="pawcare-mark" className="pc-brand-mark" size={size}/>;
}
/** A general-purpose care-file seal, never a species portrait. */
export function PetPortrait({size=64}:{species?:string|null;size?:number}){
 return <Artwork file="care-record" className="pc-pet-portrait" size={size}/>;
}
export function CompanionCover(){
 return <Artwork file="care-overview" className="pc-cover-svg" priority/>;
}
export function StaffCareDesk(){
 return <Artwork file="care-workspace" className="pc-care-svg"/>;
}
export function AdminLedger(){
 return <Artwork file="care-analytics" className="pc-ledger-svg"/>;
}
export function NotebookStory(){
 return <Artwork file="care-notebook" className="pc-notebook-story"/>;
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
 return <Artwork file={`care-${serviceArtwork(label)}`} className="pc-service-svg"/>;
}
