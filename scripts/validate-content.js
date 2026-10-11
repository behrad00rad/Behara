export function validateContent(data){
  const fail=message=>{throw Error(message);};
  const text=(v,max=2000)=>typeof v==='string'&&v.length<=max;
  const image=v=>text(v,200)&&/^\/(images|uploads)\/[a-zA-Z0-9_.-]+\.(webp|png|jpg)$/.test(v);
  const number=v=>v===null||v===undefined||Number.isFinite(v)&&v>=0;
  if(!data||!Array.isArray(data.campaigns)||data.campaigns.length<1||data.campaigns.length>20||!data.campaigns.some(c=>c.enabled)||!Number.isFinite(data.interval)||data.interval<5||data.interval>120)fail('Keep 1–20 campaigns, at least one active, and an interval from 5–120 seconds.');
  for(const c of [...data.campaigns,...(data.campaignTrash||[])]){
    if(!text(c.id,100)||!image(c.src)||!text(c.alt)||!text(c.title,200)||!text(c.fa,200)||typeof c.enabled!=='boolean'||!Number.isFinite(c.position)||c.position<0||c.position>100||[c.start,c.end].some(v=>v&&!Number.isFinite(Date.parse(v))))fail('Invalid campaign fields.');
    if(c.start&&c.end&&Date.parse(c.start)>=Date.parse(c.end))fail('The campaign end must be after its start.');
  }
  if(new Set(data.campaigns.map(c=>c.id)).size!==data.campaigns.length)fail('Campaign IDs must be unique.');
  if(!Array.isArray(data.pieces)||data.pieces.length>200||!Array.isArray(data.trash||[]))fail('Use up to 200 pieces.');
  const all=[...data.pieces,...(data.trash||[])];
  if(new Set(all.map(p=>p.id)).size!==all.length)fail('Product IDs must be unique, including trash.');
  for(const p of all){
    if(!text(p.size||'',150)||!text(p.dimensions||'',150))fail('Size and dimensions must be short text.');
    if(p.modelSrc&&!/^\/models\/[a-zA-Z0-9_-]+\.glb$/.test(p.modelSrc))fail('Use an uploaded GLB model.');
    if(p.modelName&&!text(p.modelName,200)||p.modelGold!==undefined&&typeof p.modelGold!=='boolean')fail('Invalid model settings.');
    if(!text(p.id,100)||!/^[-a-zA-Z0-9]+$/.test(p.id)||!text(p.name,150)||!p.name.trim()||!text(p.fa,150)||!text(p.detail)||!text(p.detailFa||'')||!['ring','earrings','pendant','cuff','none'].includes(p.kind)||!['Rings','Earrings','Necklaces','Bracelets'].includes(p.category)||!['published','draft'].includes(p.status||'published'))fail('Check the product name, category and visibility.');
    if(![p.price,p.stock,p.weight].every(number)||p.stock!=null&&!Number.isInteger(p.stock))fail('Price, weight and stock must be non-negative. Stock must be a whole number.');
    if(!text(p.sku||'',100)||!text(p.materials||'')||!text(p.materialsFa||''))fail('Invalid product details.');
    if(!Array.isArray(p.images)||p.images.length<1||p.images.length>12)fail('Each piece needs 1–12 images.');
    for(const shot of p.images)if(!image(shot.src)||!['mockup','editorial','detail'].includes(shot.role)||!text(shot.alt))fail('Invalid product image.');
  }
  const skus=data.pieces.map(p=>p.sku).filter(Boolean);if(new Set(skus).size!==skus.length)fail('Product SKUs must be unique.');
  const sections=['intro','editorialOne','editorialTwo','story','footer'];
  if(!data.site||sections.some(key=>!data.site[key])||Object.keys(data.site).some(key=>!sections.includes(key)))fail('Include the five homepage content sections.');
  for(const section of Object.values(data.site))for(const [key,value] of Object.entries(section)){
    if(key==='enabled'){if(typeof value!=='boolean')fail('Invalid section visibility.');}
    else if(key==='image'){if(value&&!image(value))fail('Invalid section image.');}
    else if(key==='link'){if(!text(value,200)||!/^\/(?!\/)[-a-zA-Z0-9/#?=&]*$/.test(value))fail('Use a local website path for section links.');}
    else if(!text(value))fail('Homepage text is too long.');
  }
  return data;
}
