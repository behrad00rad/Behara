import React, {useEffect,useState} from 'react';
export default function CampaignSlides({campaigns,interval,onSlide,t}){
  const [active,setActive]=useState(0),[paused,setPaused]=useState(false),[now,setNow]=useState(Date.now());
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  const enabled=campaigns.filter(c=>c.enabled&&(!c.start||Date.parse(c.start)<=now)&&(!c.end||Date.parse(c.end)>now));
  const slides=enabled.length?enabled:[campaigns[0]];
  const index=active%slides.length,current=slides[index];
  useEffect(()=>{const q=matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(q.matches);q.addEventListener('change',change);return()=>q.removeEventListener('change',change);},[]);
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{onSlide(current);},[current,onSlide]);
  useEffect(()=>{if(paused||reduced||slides.length<2)return;const timer=setInterval(()=>{if(!document.hidden)setActive(v=>v+1);},interval*1000);return()=>clearInterval(timer);},[paused,reduced,slides.length,interval]);
  // Render active and next only; the browser preloads one subsequent campaign.
  return <><div className="campaign-slides">{slides.map((c,i)=>i===index||i===(index+1)%slides.length||i===(index-1+slides.length)%slides.length?<img key={c.id} className={`campaign-image campaign-slide ${i===index?'is-active':''}`} src={c.src} srcSet={c.src.startsWith('/images/')?`${c.src.replace('-1536','-480')} 480w, ${c.src.replace('-1536','-960')} 960w, ${c.src} 1536w`:undefined} sizes="(max-width:760px) 150vh, 100vw" style={{objectPosition:`${c.position}% center`}} alt={i===index?c.alt:''} aria-hidden={i!==index} fetchpriority={i===index?'high':'low'} decoding="async"/>:null)}</div>{slides.length>1&&<div className="campaign-slide-controls" aria-label={t('Campaign photographs','تصاویر کمپین')} dir="ltr">{slides.map((c,i)=><button key={c.id} className="campaign-dot" aria-label={`${t('Campaign','کمپین')} ${i+1}`} aria-pressed={i===index} onClick={()=>{setActive(i);setPaused(true);}}><span/></button>)}{!reduced&&<button className="campaign-pause" aria-label={paused?t('Play campaign slideshow','پخش تصاویر کمپین'):t('Pause campaign slideshow','توقف تصاویر کمپین')} onClick={()=>setPaused(v=>!v)}>{paused?'▷':'Ⅱ'}</button>}</div>}</>;
}
