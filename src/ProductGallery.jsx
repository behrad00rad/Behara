import React, {useEffect, useRef, useState} from 'react';
import {productImages,responsiveSource,roles} from './media.js';

export default function ProductGallery({piece,t}) {
  const [active,setActive]=useState(0), [wide,setWide]=useState(innerWidth>760), [offset,setOffset]=useState(0);
  const stage=useRef(null), drag=useRef(null), dragged=useRef(false), zoom=useRef(null);
  const [zoomIndex,setZoomIndex]=useState(0);
  const shots=productImages(piece);
  useEffect(()=>{setActive(0);setOffset(0);},[piece.id]);
  useEffect(()=>{const resize=()=>{setWide(innerWidth>760);setOffset(0);};window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[]);
  const move=n=>setActive(v=>Math.max(0,Math.min(shots.length-1,v+n)));
  const expanding=wide&&((active===0&&offset<0)||(active===1&&offset>0));
  const progress=Math.min(1,Math.abs(offset)/((stage.current?.clientWidth||innerWidth)*.5));
  const firstWidth=!wide?100:active===0?100-(expanding?50*progress:0):50+(expanding?50*progress:0);
  const translation=wide?Math.max(0,active-1)*50:active*100;
  const release=e=>{if(!drag.current)return;const distance=e.clientX-drag.current.x;if(dragged.current&&Math.abs(distance)>Math.min(80,stage.current.clientWidth*.12))move(distance<0?1:-1);drag.current=null;setOffset(0);};
  const photo=(shot,large=false)=><img src={responsiveSource(shot.src,large?1536:960)} srcSet={shot.src.startsWith('/images/')?`${responsiveSource(shot.src,480)} 480w, ${responsiveSource(shot.src,960)} 960w, ${shot.src} 1536w`:undefined} sizes={large?'100vw':'(max-width:760px) 100vw, 75vw'} loading={large?'lazy':'eager'} alt={shot.alt||`${piece.name} — ${t(...roles[shot.role])}`} draggable="false"/>;
  return <div className={`immersive-gallery ${shots[active]?.role==='mockup'?'is-mockup-view':' '}`}>
    <div className="gallery-viewport" ref={stage} tabIndex={0} aria-label={t('Photograph gallery. Use arrow keys to browse.','گالری تصاویر؛ با کلیدهای جهت حرکت کنید.')} onKeyDown={e=>{if(e.target!==e.currentTarget)return;if(e.key==='ArrowRight'){e.preventDefault();move(1);}if(e.key==='ArrowLeft'){e.preventDefault();move(-1);}}}
      onPointerDown={e=>{if(e.button!==0)return;drag.current={x:e.clientX,y:e.clientY};dragged.current=false;}}
      onPointerMove={e=>{if(!drag.current)return;const dx=e.clientX-drag.current.x,dy=e.clientY-drag.current.y;if(!dragged.current&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)){dragged.current=true;e.currentTarget.setPointerCapture(e.pointerId);}if(dragged.current)setOffset(dx);}}
      onPointerUp={release} onPointerCancel={()=>{drag.current=null;setOffset(0);}}>
      <div className={`gallery-rail ${offset?'is-dragging':''}`} style={{transform:`translateX(calc(-${translation}% + ${expanding||active===0&&wide?0:offset}px))`}}>{shots.map((name,i)=><button key={name.src} className={`gallery-shot ${name.role==='mockup'?'gallery-mockup':''}`} style={{flexBasis:`${i===0?firstWidth:wide?50:100}%`}} aria-label={t('Enlarge photograph','بزرگ‌نمایی تصویر')} tabIndex={i===active||wide&&active>0&&i===active-1?0:-1} onClick={()=>{if(dragged.current){dragged.current=false;return;}setZoomIndex(i);zoom.current.showModal();}}>{photo(name)}</button>)}</div>
    </div>
    <div className="gallery-caption"><p>{t(piece.name,piece.fa)}</p><a href="#piece-details">{t('Discover the piece','درباره این اثر')} ↓</a></div>
    <span className="gallery-hint">{t('Drag to discover · Click to enlarge','برای کشف بکشید · برای بزرگ‌نمایی کلیک کنید')}</span>
    <div className="gallery-controls" dir="ltr"><div className="gallery-thumbnails">{shots.map((name,i)=><button key={name.src} aria-label={t(...roles[name.role])} aria-pressed={active===i} onClick={()=>setActive(i)}><img src={responsiveSource(name.src,480)} alt=""/></button>)}</div><button disabled={active===0} aria-label={t('Previous photograph','تصویر قبلی')} onClick={()=>move(-1)}>←</button><span>{active+1} / {shots.length}</span><button disabled={active===shots.length-1} aria-label={t('Next photograph','تصویر بعدی')} onClick={()=>move(1)}>→</button></div>
    <dialog ref={zoom} className="gallery-zoom" aria-label={t('Enlarged photograph','تصویر بزرگ‌شده')} onClick={e=>{if(e.target===e.currentTarget)zoom.current.close();}}><button className="zoom-close" aria-label={t('Close enlarged photograph','بستن تصویر')} onClick={()=>zoom.current.close()}>×</button>{photo(shots[zoomIndex]||shots[0],true)}<div className="zoom-controls"><button onClick={()=>setZoomIndex(v=>(v-1+shots.length)%shots.length)} aria-label={t('Previous enlarged photograph','تصویر قبلی')}>←</button><span>{zoomIndex+1} / {shots.length}</span><button onClick={()=>setZoomIndex(v=>(v+1)%shots.length)} aria-label={t('Next enlarged photograph','تصویر بعدی')}>→</button></div></dialog>
  </div>;
}
