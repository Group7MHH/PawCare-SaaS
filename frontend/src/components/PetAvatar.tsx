import {Cat,Dog,PawPrint} from 'lucide-react';
/** Biểu tượng loài thú cưng bằng icon lucide (thay cho emoji), đồng bộ nét vẽ với toàn hệ thống. */
export function PetAvatar({species,size=22}:{species?:string|null;size?:number}){
 const Icon=species==='dog'?Dog:species==='cat'?Cat:PawPrint;
 return <span className="pet-avatar" aria-hidden="true"><Icon size={size} strokeWidth={1.7}/></span>;
}
