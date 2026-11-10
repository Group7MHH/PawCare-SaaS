import {PetPortrait} from './BrandArtwork';
/** Generic care-record seal. Names, breeds and species remain text; no animal drawing. */
export function PetAvatar({species,size=22}:{species?:string|null;size?:number}){
 return <span className="pet-avatar" aria-hidden="true"><PetPortrait species={species} size={size}/></span>;
}
