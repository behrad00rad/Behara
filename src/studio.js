export async function uploadImage(file){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024)throw Error('Choose JPEG, PNG or WebP images below 8 MB.');
  const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas');
  const ratio=Math.min(1,1920/Math.max(bitmap.width,bitmap.height));canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);
  canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
  const compressed=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.82));if(!compressed)throw Error('Could not prepare image.');
  const r=await fetch('/api/studio/images',{method:'POST',headers:{'Content-Type':'image/webp'},body:compressed});const data=await r.json();if(!r.ok)throw Error(data.error);return data.src;
}
export async function uploadModel(file){
 if(!file.name.toLowerCase().endsWith('.glb')||file.size>30*1024*1024)throw Error('Choose a self-contained GLB below 30 MB.');
 const response=await fetch('/api/studio/models',{method:'POST',headers:{'Content-Type':'model/gltf-binary'},body:file});const result=await response.json();if(!response.ok)throw Error(result.error);return result.src;
}
export function exportContent(data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`behara-gallery-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
