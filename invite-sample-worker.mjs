// Experimental anonymous invite chain. No candidate master, real photos, or R2.
const enc=new TextEncoder();
const SESSION_MS=30*24*60*60*1000,INVITE_MS=24*60*60*1000;
const random=()=>{const a=crypto.getRandomValues(new Uint8Array(32));return Array.from(a,b=>b.toString(16).padStart(2,'0')).join('')};
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
export const jstDay=now=>new Date(now+9*60*60*1000).toISOString().slice(0,10);
const bearer=request=>{const v=request.headers.get('Authorization')||'';return /^Bearer [a-f0-9]{64}$/.test(v)?v.slice(7):null};
const equalHex=(a,b)=>{if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0};
const response=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff',...headers}});
function cors(origin,allowed){return {'Access-Control-Allow-Origin':origin===allowed?origin:'null','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type','Vary':'Origin'}}
async function sessionFor(request,db,now){const token=bearer(request);if(!token)return null;return db.prepare('SELECT session_id, expires_at FROM anonymous_sessions WHERE token_hash = ? AND expires_at > ?').bind(await hash(token),now).first()}
export async function handleInviteRequest(request,env,{now=Date.now()}={}){
  const url=new URL(request.url),origin=request.headers.get('Origin'),h=cors(origin,env.APP_ORIGIN);
  if(!env.INVITE_DB||!env.APP_ORIGIN)return response({error:'unconfigured'},503,h);
  if(origin&&origin!==env.APP_ORIGIN)return response({error:'forbidden_origin'},403,h);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:h});
  if(request.method==='POST'&&url.pathname==='/v1/sample/owner/claim'){
    if(!env.OWNER_BOOTSTRAP_CODE)return response({error:'owner_not_ready'},503,h);
    let code;try{code=(await request.json()).ownerCode}catch{return response({error:'invalid_owner_code'},400,h)}
    if(typeof code!=='string'||!(/^[a-f0-9]{64}$/).test(code))return response({error:'invalid_owner_code'},400,h);
    if(!equalHex(await hash(code),await hash(env.OWNER_BOOTSTRAP_CODE)))return response({error:'invalid_owner_code'},403,h);
    const token=random(),id=random(),marker=await hash('blind-face-select:owner-bootstrap:v0.1');
    try{
      // A fixed UNIQUE marker is the linearization point: only one human Owner claim.
      await env.INVITE_DB.prepare('INSERT INTO anonymous_sessions (session_id, token_hash, claimed_invite_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)').bind(id,await hash(token),marker,now,now+SESSION_MS).run();
      return response({sessionToken:token,expiresAt:now+SESSION_MS},201,h);
    }catch(error){if(/UNIQUE|constraint/i.test(String(error)))return response({error:'owner_already_claimed'},410,h);throw error}
  }
  if(request.method==='POST'&&url.pathname==='/v1/sample/admin/bootstrap'){
    // Admin bootstrap is outside normal Player UI; never write the secret to public config.
    if(!env.ADMIN_SECRET||request.headers.get('Authorization')!=='Bearer '+env.ADMIN_SECRET)return response({error:'unauthorized'},401,h);
    const token=random(),id=random();
    await env.INVITE_DB.prepare('INSERT INTO anonymous_sessions (session_id, token_hash, claimed_invite_hash, created_at, expires_at) VALUES (?, ?, NULL, ?, ?)').bind(id,await hash(token),now,now+SESSION_MS).run();
    return response({sessionToken:token,expiresAt:now+SESSION_MS},201,h);
  }
  if(request.method==='POST'&&url.pathname==='/v1/sample/claim'){
    let token;try{token=(await request.json()).inviteToken}catch{return response({error:'invalid_invite'},400,h)}
    if(typeof token!=='string'||!(/^[a-f0-9]{64}$/).test(token))return response({error:'invalid_invite'},400,h);
    const inviteHash=await hash(token),sessionToken=random(),id=random();
    // One SQL statement plus UNIQUE(claimed_invite_hash) is the claim linearization point.
    // A simultaneous second claim cannot create another session, even after a retry.
    try{
      const claimed=await env.INVITE_DB.prepare('INSERT INTO anonymous_sessions (session_id, token_hash, claimed_invite_hash, created_at, expires_at) SELECT ?, ?, token_hash, ?, ? FROM single_use_invites WHERE token_hash = ? AND expires_at > ? AND NOT EXISTS (SELECT 1 FROM anonymous_sessions WHERE claimed_invite_hash = ?) RETURNING session_id').bind(id,await hash(sessionToken),now,now+SESSION_MS,inviteHash,now,inviteHash).first();
      if(!claimed)return response({error:'invite_used_or_expired'},410,h);
      return response({sessionToken,expiresAt:now+SESSION_MS},201,h);
    }catch(error){if(/UNIQUE|constraint/i.test(String(error)))return response({error:'invite_used_or_expired'},410,h);throw error}
  }
  if(url.pathname.startsWith('/v1/sample/')){
    const session=await sessionFor(request,env.INVITE_DB,now);
    if(!session)return response({error:'session_required'},401,h);
    if(request.method==='GET'&&url.pathname==='/v1/sample/session'){
      const day=jstDay(now),used=await env.INVITE_DB.prepare('SELECT 1 FROM single_use_invites WHERE issuer_session_id = ? AND issued_jst_day = ?').bind(session.session_id,day).first();
      return response({active:true,expiresAt:session.expires_at,jstDay:day,inviteAvailable:!used},200,h);
    }
    if(request.method==='GET'&&url.pathname==='/v1/sample/fixture')return response({cards:['FACE 01','FACE 02','FACE 03','FACE 04','FACE 05'],experimental:true},200,h);
    if(request.method==='POST'&&url.pathname==='/v1/sample/invites'){
      const token=random(),day=jstDay(now),expiry=now+INVITE_MS;
      try{await env.INVITE_DB.prepare('INSERT INTO single_use_invites (token_hash, issuer_session_id, issued_jst_day, created_at, expires_at) VALUES (?, ?, ?, ?, ?)').bind(await hash(token),session.session_id,day,now,expiry).run()}
      catch(error){if(/UNIQUE|constraint/i.test(String(error)))return response({error:'daily_invite_used',jstDay:day},409,h);throw error}
      return response({inviteToken:token,expiresAt:expiry,jstDay:day},201,h);
    }
  }
  return response({error:'not_found'},404,h);
}
export default {fetch:handleInviteRequest};
