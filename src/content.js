import {useEffect,useState} from 'react';
import defaults from './defaultContent.json';
export {defaults};
export function useGalleryContent(){
  const [content,setContent]=useState(defaults);
  useEffect(()=>{const controller=new AbortController();fetch('/content/gallery.json',{cache:'no-store',signal:controller.signal}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{if(Array.isArray(data.pieces)&&data.campaigns?.length)setContent(data);}).catch(()=>{});return()=>controller.abort();},[]);
  return content;
}
