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
/**
 * Uses the approved PawCare illustration sheet when deployed under
 * frontend/public/artwork, with an existing SVG fallback for deployments
 * where images are missing. Never affects API or booking workflow.
 */
export function CuteIllustration({asset,kind='pet',className='',style,alt='',eager=false}:{
 asset?:CuteAsset;kind?:ArtworkKind;className?:string;style?:CSSProperties;alt?:string;eager?:boolean;
}){
 const [failed,setFailed]=useState(false);
 const [loaded,setLoaded]=useState(false);
 const file=asset||mappings[kind];
 return <span className={`pc-cute-illustration ${className}`} style={style} aria-label={alt||undefined} role={alt?'img':undefined}>
   {!loaded||failed?<PetArtwork kind={kind} className="pc-cute-fallback" aria-hidden="true"/>:null}
   {!failed&&<img src={`/artwork/${file}.webp`} className={`pc-cute-asset ${loaded?'is-loaded':''}`}
     loading={eager?'eager':'lazy'} decoding="async" alt="" aria-hidden="true"
     onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)}/>}
 </span>;
}
