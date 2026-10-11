import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomUUID,randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {validateContent} from './validate-content.js';
import {validateModel} from './model-validation.js';
export default function contentServer(){return {name:'behara-local-content',async configureServer(server){
 const root=server.config.root, privateDir=resolve(root,'.studio'),content=resolve(privateDir,'gallery.json'),publicFile=resolve(root,'public/content/gallery.json'),account=resolve(privateDir,'admin.json');
 await mkdir(privateDir,{recursive:true});
 const publish=async data=>{const {trash,campaignTrash,...publicData}=data;publicData.pieces=data.pieces.filter(p=>p.status!=='draft');await writeFile(`${publicFile}.tmp`,JSON.stringify(publicData,null,2));await rename(`${publicFile}.tmp`,publicFile);};
 try{await readFile(content);}catch{await writeFile(content,await readFile(publicFile));}
 await publish(JSON.parse(await readFile(content,'utf8')));
 const sessions=new Map(),attempts=new Map();let writing=false,settingUp=false;
 const credentials=async()=>{try{return JSON.parse(await readFile(account,'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}};
 server.middlewares.use('/api/studio',async(req,res)=>{
  res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
  const reply=(status,value)=>{res.statusCode=status;res.end(JSON.stringify(value));};
  const origin=req.headers.origin,host=req.headers.host;
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress)||!host||!/^127\.0\.0\.1:\d+$/.test(host)||(origin&&origin!==`http://${host}`))return reply(403,{error:'Local studio access only.'});
  const token=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('behara_session='))?.slice(15),session=sessions.get(token),authenticated=!!session&&session.expires>Date.now();
  if(session&&!authenticated)sessions.delete(token);
  try{
   if(req.method==='GET'&&req.url==='/session')return reply(200,{authenticated,setupRequired:!(await credentials()),username:authenticated?session.username:undefined});
   if(req.method==='GET'&&req.url==='/content')return authenticated?reply(200,JSON.parse(await readFile(content,'utf8'))):reply(401,{error:'Sign in to manage your gallery.'});
   if(!['PUT','POST'].includes(req.method))return reply(405,{error:'Unsupported request.'});
   if(origin!==`http://${host}`)return reply(403,{error:'Same-origin access required.'});
   if(!['/login','/setup'].includes(req.url)&&!authenticated)return reply(401,{error:'Your session expired. Sign in again.'});
   const chunks=[];let size=0;const limit=req.url==='/models'?30*1024*1024:req.url==='/images'?8*1024*1024:2*1024*1024;
   for await(const chunk of req){size+=chunk.length;if(size>limit)return reply(413,{error:'File is too large.'});chunks.push(chunk);}const body=Buffer.concat(chunks);
   if(['/login','/setup'].includes(req.url)){
    const input=JSON.parse(body.toString()),existing=await credentials();
    if(req.url==='/setup'){
     if(existing||settingUp)return reply(409,{error:'An account already exists. Sign in.'});
     if(typeof input.username!=='string'||!/^[-a-zA-Z0-9_.]{3,40}$/.test(input.username)||typeof input.password!=='string'||input.password.length<12||input.password.length>200)return reply(400,{error:'Use a username of 3–40 letters/numbers and a password of at least 12 characters.'});
     settingUp=true;try{const salt=randomBytes(16).toString('hex');await writeFile(account,JSON.stringify({username:input.username,salt,hash:scryptSync(input.password,salt,64).toString('hex')}),{flag:'wx',mode:0o600});}finally{settingUp=false;}
    }else{
     const key=req.socket.remoteAddress,previous=attempts.get(key),record=previous&&previous.until>Date.now()?previous:{count:0,until:Date.now()+600000};
     if(record.count>=5)return reply(429,{error:'Too many attempts. Try again in 10 minutes.'});record.count++;attempts.set(key,record);
     if(!existing||typeof input.password!=='string'||input.password.length>200||input.username!==existing.username||!timingSafeEqual(scryptSync(input.password,existing.salt,64),Buffer.from(existing.hash,'hex')))return reply(401,{error:'Incorrect username or password.'});attempts.delete(key);
    }
    const fresh=randomBytes(32).toString('hex');sessions.set(fresh,{username:input.username,expires:Date.now()+8*3600000});res.setHeader('Set-Cookie',`behara_session=${fresh}; HttpOnly; SameSite=Strict; Path=/api/studio; Max-Age=28800`);return reply(200,{authenticated:true,username:input.username});
   }
   if(req.url==='/logout'){sessions.delete(token);res.setHeader('Set-Cookie','behara_session=; HttpOnly; SameSite=Strict; Path=/api/studio; Max-Age=0');return reply(200,{ok:true});}
   if(req.url==='/images'||req.url==='/models'){
    let ext,folder;
    if(req.url==='/models'){validateModel(body);ext='glb';folder='models';}
    else{ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[req.headers['content-type']];const valid=ext==='jpg'?body[0]===255&&body[1]===216:ext==='png'?body.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):ext==='webp'?body.toString('ascii',0,4)==='RIFF'&&body.toString('ascii',8,12)==='WEBP':false;if(!valid)throw Error('Choose JPEG, PNG or WebP.');folder='uploads';}
    const name=`${randomUUID()}.${ext}`,path=resolve(root,'public',folder,name);await mkdir(resolve(root,'public',folder),{recursive:true});await writeFile(path,body);server.watcher.add(path);return reply(200,{src:`/${folder}/${name}`,size:body.length});
   }
   if(req.url!=='/content'||req.method!=='PUT')return reply(404,{error:'Unknown endpoint.'});
   const data=validateContent(JSON.parse(body.toString()));if(writing)return reply(409,{error:'Another save is in progress.'});writing=true;
   try{const previous=JSON.parse(await readFile(content,'utf8'));if((data.revision||0)!==(previous.revision||0))return reply(409,{error:'The gallery changed in another tab. Export your draft, then reload.'});const backups=resolve(privateDir,'backups');await mkdir(backups,{recursive:true});await writeFile(resolve(backups,`${Date.now()}-${randomUUID()}.json`),JSON.stringify(previous,null,2));data.revision=(previous.revision||0)+1;await writeFile(`${content}.tmp`,JSON.stringify(data,null,2));await rename(`${content}.tmp`,content);await publish(data);}finally{writing=false;}
   return reply(200,{ok:true,content:data});
  }catch(e){return reply(400,{error:e.message||'Could not complete request.'});}
 });
}};}
