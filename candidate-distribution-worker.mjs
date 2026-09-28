// Private object storage + short-lived, signed bearer capabilities.
// No real candidate records or secrets belong in this public source file.
const encoder=new TextEncoder(),decoder=new TextDecoder();
const MAX_READ_MS=7*24*60*60*1000,MAX_INVITE_MS=30*24*60*60*1000;
function b64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')}
function unb64(text){if(!/^[A-Za-z0-9_-]+$/.test(text))throw Error('token');return Uint8Array.from(atob(text.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0))}
async function hmac(secret,bytes){const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);return crypto.subtle.sign('HMAC',key,bytes)}
async function mint(secret,claim){const payload=b64(encoder.encode(JSON.stringify(claim)));return payload+'.'+b64(new Uint8Array(await hmac(secret,encoder.encode(payload))))}
async function verify(secret,token){
  const parts=String(token||'').split('.');
  if(parts.length!==2||parts[0].length>2048||parts[1].length>128)throw Error('token');
  const expected=new Uint8Array(await hmac(secret,encoder.encode(parts[0]))),provided=unb64(parts[1]);
  if(expected.length!==provided.length)throw Error('token');
  let delta=0;for(let i=0;i<expected.length;i++)delta|=expected[i]^provided[i];
  if(delta)throw Error('token');
  const claim=JSON.parse(decoder.decode(unb64(parts[0])));
  if(claim.v!==1||!['read','issuer'].includes(claim.scope)||!Number.isSafeInteger(claim.exp)||Date.now()>=claim.exp||typeof claim.version!=='string'||!claim.version||typeof claim.nonce!=='string')throw Error('token');
  return claim;
}
function bearer(request){const value=request.headers.get('Authorization')||'';return value.startsWith('Bearer ')?value.slice(7):''}
function headers(origin,appOrigin){return {'Access-Control-Allow-Origin':origin===appOrigin?origin:'null','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type','Vary':'Origin','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}}
function json(data,status,h){return new Response(JSON.stringify(data),{status,headers:{...h,'Content-Type':'application/json; charset=utf-8'}})}
function freshClaim(scope,version,exp){return {v:1,scope,version,exp,nonce:b64(crypto.getRandomValues(new Uint8Array(16)))}}
function editionFor(manifest,version){return [manifest,...(Array.isArray(manifest.editions)?manifest.editions:[])].find(e=>e.master_version===version)}
export default {
  async fetch(request,env){
    const origin=request.headers.get('Origin'),h=headers(origin,env.APP_ORIGIN),url=new URL(request.url);
    if(!env.CAPABILITY_SECRET||!env.APP_ORIGIN||!env.MASTER_BUCKET||!env.MANIFEST_JSON)return json({error:'service_unconfigured'},503,h);
    if(origin&&origin!==env.APP_ORIGIN)return json({error:'forbidden_origin'},403,h);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:h});
    let manifest;try{manifest=JSON.parse(env.MANIFEST_JSON);if(manifest.schema_version!==1||!manifest.master_version)throw Error('manifest')}catch{return json({error:'invalid_manifest'},503,h)}
    if(request.method==='GET'&&url.pathname==='/v1/manifest'){
      return json(manifest,200,h);
    }
    if(request.method==='GET'&&url.pathname==='/v1/capability'){
      try{const claim=await verify(env.CAPABILITY_SECRET,bearer(request));return json({scope:claim.scope,version:claim.version,expiresAt:claim.exp},200,h)}
      catch{return json({error:'capability_expired_or_invalid'},401,h)}
    }
    const masterMatch=url.pathname.match(/^\/v1\/master\/([A-Za-z0-9_-]{1,100})$/);
    if(request.method==='GET'&&masterMatch){
      const version=masterMatch[1],edition=editionFor(manifest,version);
      if(!edition)return json({error:'unknown_version'},404,h);
      try{
        const claim=await verify(env.CAPABILITY_SECRET,bearer(request));
        if(!['read','issuer'].includes(claim.scope)||claim.version!==version)return json({error:'insufficient_scope'},403,h);
      }catch{return json({error:'capability_expired_or_invalid'},401,h)}
      const object=await env.MASTER_BUCKET.get('masters/'+version+'.json');
      if(!object)return json({error:'master_missing'},503,h);
      return new Response(object.body,{status:200,headers:{...h,'Content-Type':'application/json; charset=utf-8'}});
    }
    if(request.method==='POST'&&url.pathname==='/v1/grants'){
      try{
        const issuer=await verify(env.CAPABILITY_SECRET,bearer(request));
        if(issuer.scope!=='issuer')return json({error:'insufficient_scope'},403,h);
        const body=await request.json(),version=body.version,expiry=body.expiresAt;
        if(version!==issuer.version||!editionFor(manifest,version)||!Number.isSafeInteger(expiry)||expiry<=Date.now()||expiry>Date.now()+MAX_READ_MS||expiry>issuer.exp)return json({error:'invalid_grant'},400,h);
        return json({capability:await mint(env.CAPABILITY_SECRET,freshClaim('read',version,expiry)),expiresAt:expiry},200,h);
      }catch{return json({error:'capability_expired_or_invalid'},401,h)}
    }
    // Admin bootstrap is a one-time human deployment operation, never called by the app.
    if(request.method==='POST'&&url.pathname==='/v1/admin/invite'){
      if(!env.ADMIN_SECRET||bearer(request)!==env.ADMIN_SECRET)return json({error:'unauthorized'},401,h);
      try{
        const body=await request.json(),version=body.version,expiry=body.expiresAt;
        if(!editionFor(manifest,version)||!Number.isSafeInteger(expiry)||expiry<=Date.now()||expiry>Date.now()+MAX_INVITE_MS)return json({error:'invalid_invite'},400,h);
        return json({capability:await mint(env.CAPABILITY_SECRET,freshClaim(body.canShare?'issuer':'read',version,expiry)),expiresAt:expiry},200,h);
      }catch{return json({error:'invalid_invite'},400,h)}
    }
    return json({error:'not_found'},404,h);
  }
};
