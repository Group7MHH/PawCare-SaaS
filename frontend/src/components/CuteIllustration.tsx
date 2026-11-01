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

/** High-resolution individual WebP illustrations.
 * The earlier tiny sprite atlas enlarged the crops and looked blurry.
 * Files are bundled locally with the frontend; no network/image CDN dependency.
 * The original SVG remains as a visual fallback if an image cannot be loaded.
 */
export function CuteIllustration({
 asset,kind='pet',className='',style,alt='',eager=false
}:{
 asset?:CuteAsset;kind?:ArtworkKind;className?:string;style?:CSSProperties;alt?:string;eager?:boolean;
}){
 const file=asset||mappings[kind];
 const [load,setLoad]=useState<{file:string;loaded:boolean;failed:boolean}>({
  file,loaded:false,failed:false
 });
 const loaded=load.file===file&&load.loaded;
 const failed=load.file===file&&load.failed;
 return <span className={`pc-cute-illustration ${className}`} style={style}
  role={alt?'img':undefined} aria-label={alt||undefined}>
  {!loaded&&<PetArtwork kind={kind} className="pc-cute-fallback" aria-hidden="true"/>}
  {!failed&&<img key={file} src={`/artwork/${file}.webp`}
    className={`pc-cute-asset ${loaded?'is-loaded':''}`}
    loading={eager?'eager':'lazy'} decoding="async" alt="" aria-hidden="true"
    onLoad={()=>setLoad({file,loaded:true,failed:false})}
    onError={()=>setLoad({file,loaded:false,failed:true})}/>}
 </span>;
}
