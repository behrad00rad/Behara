import React, {useEffect, useRef, useState} from 'react';
import {BrandName} from './Brand.jsx';

// The portfolio's 450ms cover / 700ms reveal, adapted to a local language change.
export function useLanguageTransition(lang, setLang) {
  const [phase, setPhase] = useState('idle');
  const timers = useRef([]), busy = useRef(false);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const switchLanguage = () => {
    if (busy.current) return;
    const next = lang === 'en' ? 'fa' : 'en';
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {setLang(next); return;}
    busy.current = true;
    setPhase('cover');
    timers.current.push(setTimeout(() => {
      setLang(next);
      setPhase('reveal');
      timers.current.push(setTimeout(() => {setPhase('idle'); busy.current = false; timers.current = [];}, 700));
    }, 450));
  };
  return {switchLanguage, busy:phase !== 'idle', curtain:phase === 'idle' ? null :
    <div className={`language-curtain language-curtain-${phase}`} aria-hidden="true" dir="ltr"><BrandName lang="fa"/><i/><small>BEHARA / THE GOLD EDIT</small></div>};
}
