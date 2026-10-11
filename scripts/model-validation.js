export function validateModel(body){
  if(body.length<20||body.toString('ascii',0,4)!=='glTF'||body.readUInt32LE(4)!==2||body.readUInt32LE(8)!==body.length)throw Error('Choose a valid GLB 2.0 model.');
  const length=body.readUInt32LE(12);
  if(body.readUInt32LE(16)!==0x4e4f534a||length>body.length-20)throw Error('The GLB metadata is invalid.');
  const doc=JSON.parse(body.toString('utf8',20,20+length));
  if(!doc.meshes?.length)throw Error('The model must contain a mesh.');
  if([...(doc.buffers||[]),...(doc.images||[])].some(v=>v.uri&&!v.uri.startsWith('data:')))throw Error('Export a self-contained GLB with embedded textures.');
  if((doc.extensionsRequired||[]).some(v=>['KHR_draco_mesh_compression','EXT_meshopt_compression','KHR_texture_basisu'].includes(v)))throw Error('Export an uncompressed GLB without Draco, Meshopt or KTX textures.');
  return doc;
}
