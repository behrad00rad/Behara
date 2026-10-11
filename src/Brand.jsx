import React from 'react';

// The same Persian calligraphic emblem identifies Behara in both languages.
export function BrandMark({className=''}){return <span className={`brand-mark calligraphic-mark ${className}`} aria-hidden="true"/>;}
export function BrandName(){return <span className="brand-name brand-lockup" role="img" aria-label="به‌آرا / BEHARA" dir="ltr"><span className="calligraphic-name"/><span className="brand-latin" aria-hidden="true">BEHARA</span></span>;}
