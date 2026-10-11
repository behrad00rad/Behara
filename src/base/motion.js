import {useEffect, useRef} from 'react';

// Benico's scroll easing, reveals, parallax and chapter tracking, adapted for SPA navigation.
export function useStoreMotion() {
  const ref=useRef(null);
  useEffect(()=>{
    const root=ref.current;
    if(!root)return;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    const fine=window.matchMedia('(pointer: fine)');
    let frame=0,smoothFrame=0,target=window.scrollY,lastTime=0,chapters=[],parallax=[];
    const seen=new WeakSet();
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}
    }),{threshold:.08});
    const stop=()=>{cancelAnimationFrame(smoothFrame);smoothFrame=0;lastTime=0;};
    const update=()=>{
      if(frame)return;
      frame=requestAnimationFrame(()=>{
        frame=0;
        const y=window.scrollY,h=window.innerHeight;
        root.classList.toggle('at-footer',(root.querySelector('.brand-footer')?.getBoundingClientRect().top??Infinity)<h*.6);
        root.style.setProperty('--hero-scroll',`${reduced.matches?0:Math.min(y*.16,110)}px`);
        root.style.setProperty('--hero-fade',`${reduced.matches?1:Math.max(0,1-y/(h*.8))}`);
        root.style.setProperty('--scroll-progress',`${y/Math.max(1,document.documentElement.scrollHeight-h)*100}%`);
        let active=chapters[0];
        for(const section of chapters){if(section.getBoundingClientRect().top<=h*.52)active=section;}
        root.querySelectorAll('.walkthrough-nav a').forEach(link=>{
          if(link.hash===`#${active?.id}`)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');
        });
        for(const section of parallax){const r=section.getBoundingClientRect();if(r.bottom>0&&r.top<h)section.style.setProperty('--section-drift',`${reduced.matches?0:Math.max(-35,Math.min(35,(h*.5-r.top)*.06))}px`);}
      });
    };
    const register=()=>{
      root.querySelectorAll('[data-reveal]').forEach(el=>{
        if(reduced.matches){el.classList.add('is-visible');return;}
        if(!seen.has(el)){seen.add(el);el.classList.add('will-reveal');observer.observe(el);}
      });
      chapters=[...root.querySelectorAll('[data-chapter]')];
      parallax=[...root.querySelectorAll('[data-parallax]')];
      update();
    };
    const animate=time=>{
      const dt=Math.min(64,time-(lastTime||time-16));lastTime=time;
      const distance=target-window.scrollY;
      window.scrollTo({top:Math.abs(distance)<.5?target:window.scrollY+distance*(1-Math.exp(-dt/100)),behavior:'instant'});
      if(Math.abs(distance)>.5)smoothFrame=requestAnimationFrame(animate);else{smoothFrame=0;lastTime=0;}
    };
    const wheel=e=>{
      if(reduced.matches||!fine.matches||e.ctrlKey||e.metaKey||e.deltaMode!==0||Math.abs(e.deltaX)>Math.abs(e.deltaY)||root.querySelector('dialog[open]')||e.target.closest('input,textarea,select,dialog,.jewel-view,.filters'))return;
      const max=document.documentElement.scrollHeight-window.innerHeight;
      if((window.scrollY<=0&&e.deltaY<0)||(window.scrollY>=max-1&&e.deltaY>0))return;
      e.preventDefault();if(!smoothFrame)target=window.scrollY;
      target=Math.max(0,Math.min(max,target+e.deltaY));if(!smoothFrame)smoothFrame=requestAnimationFrame(animate);
    };
    const preference=()=>{stop();register();};
    const mutations=new MutationObserver(()=>{stop();register();});
    mutations.observe(root,{childList:true,subtree:true});
    root.addEventListener('wheel',wheel,{passive:false});
    window.addEventListener('scroll',update,{passive:true});
    window.addEventListener('resize',update);
    window.addEventListener('pointerdown',stop);
    window.addEventListener('keydown',stop);
    reduced.addEventListener('change',preference);
    register();
    return()=>{observer.disconnect();mutations.disconnect();cancelAnimationFrame(frame);stop();root.removeEventListener('wheel',wheel);window.removeEventListener('scroll',update);window.removeEventListener('resize',update);window.removeEventListener('pointerdown',stop);window.removeEventListener('keydown',stop);reduced.removeEventListener('change',preference);};
  },[]);
  return ref;
}
export function tiltCard(event){
  if(event.pointerType!=='mouse'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const r=event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--tilt-x',`${-(event.clientY-r.top-r.height/2)/r.height*2}deg`);
  event.currentTarget.style.setProperty('--tilt-y',`${(event.clientX-r.left-r.width/2)/r.width*2}deg`);
}
export function resetTilt(event){event.currentTarget.style.setProperty('--tilt-x','0deg');event.currentTarget.style.setProperty('--tilt-y','0deg');}
