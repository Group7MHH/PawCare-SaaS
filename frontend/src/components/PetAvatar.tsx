import {PetPortrait} from './BrandArtwork';
/** Artwork SVG nguyên bản theo loài; không dùng emoji/icon thư viện làm avatar. */
export function PetAvatar({species,size=22}:{species?:string|null;size?:number}){
 return <span className="pet-avatar" aria-hidden="true"><PetPortrait species={species} size={size}/></span>;
}
