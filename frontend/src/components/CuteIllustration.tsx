import {useState} from 'react';
import type {CSSProperties} from 'react';
import {PetArtwork,serviceArtworkKind,type ArtworkKind} from './PetArtwork';

export type CuteAsset='bath'|'groom'|'nails'|'ears'|'vet'|'spa'|'dental'|'walk'|'daycare'|'transport'|
 'banner-duo'|'banner-play'|'banner-family'|'empty'|'not-found'|'error';
const mappings:Record<ArtworkKind,CuteAsset>={
 bath:'bath',groom:'groom',nails:'nails',ears:'ears',vet:'vet',spa:'spa',
 dental:'dental',walk:'walk',daycare:'daycare',pet:'banner-duo',dog:'banner-play',
 cat:'banner-family',welcome:'banner-duo'
};
export function cuteAssetForService(name:string,category=''):CuteAsset{
 return mappings[serviceArtworkKind(name,category)]||'banner-play';
}

/** Approved PawCare drawings cropped from a single optimized local sprite sheet.
 * The coordinate space is the original 1000x440 atlas, independent of
 * the compressed WebP image resolution. No external services are required. */
const art:Record<CuteAsset,[number,number,number,number]>={
 bath:[0,0,200,130],groom:[200,0,200,130],
 nails:[400,0,200,130],ears:[600,0,200,130],vet:[800,0,200,130],
 spa:[0,130,200,130],dental:[200,130,200,130],
 walk:[400,130,200,130],daycare:[600,130,200,130],transport:[800,130,200,130],
 'banner-duo':[0,260,330,98],'banner-play':[330,260,330,98],
 'banner-family':[660,260,330,98],
 empty:[0,358,170,82],'not-found':[170,358,170,82],error:[340,358,170,82]
};
const assetUrl='/artwork/stickers-atlas.webp';
export function CuteIllustration({asset,kind='pet',className='',style,alt=''}:{
 asset?:CuteAsset;kind?:ArtworkKind;className?:string;style?:CSSProperties;alt?:string;eager?:boolean;
}){
 const [loaded,setLoaded]=useState(false);
 const [failed,setFailed]=useState(false);
 const chosen=asset||mappings[kind];
 const [x,y,w,h]=art[chosen];
 return <span className={`pc-cute-illustration ${className}`} style={style}
   role={alt?'img':undefined} aria-label={alt||undefined}>
   {!loaded&&<PetArtwork kind={kind} className="pc-cute-fallback" aria-hidden="true"/>}
   {!failed&&<>
     <img src={assetUrl} alt="" aria-hidden="true" decoding="async"
       className="pc-atlas-preload" onLoad={()=>setLoaded(true)}
       onError={()=>setFailed(true)}/>
     {loaded&&<svg className="pc-cute-asset is-loaded"
       viewBox={`${x} ${y} ${w} ${h}`} preserveAspectRatio="xMidYMid slice"
       xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
       <image href={assetUrl} x="0" y="0" width="1000" height="440"
         preserveAspectRatio="none"/>
     </svg>}
   </>}
 </span>;
}
