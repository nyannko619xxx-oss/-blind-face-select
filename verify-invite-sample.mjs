import assert from 'node:assert/strict';
import {localEnv} from './invite-sample-local.mjs';
import worker,{jstDay} from './invite-sample-worker.mjs';

const origin='http://127.0.0.1:8788',env=localEnv(origin);
async function call(path,{token,body,method='GET',time,foreignOrigin}={}){
  const headers={Origin:foreignOrigin||origin};if(token)headers.Authorization='Bearer '+token;
  if(body!==undefined)headers['Content-Type']='application/json';
  const request=new Request(origin+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  const result=await worker.fetch(request,env,{now:time});return {status:result.status,data:await result.json()};
}
const before=Date.parse('2026-09-28T14:59:00Z'); // 23:59 JST
assert.equal(jstDay(before),'2026-09-28');assert.equal(jstDay(before+60000),'2026-09-29');
assert.equal((await call('/v1/sample/fixture',{time:before})).status,401);
assert.equal((await call('/v1/sample/admin/bootstrap',{method:'POST',time:before})).status,401);
assert.equal((await call('/v1/sample/owner/claim',{method:'POST',body:{ownerCode:'0'.repeat(64)},time:before})).status,403);
const ownerClaims=await Promise.all(Array.from({length:20},()=>call('/v1/sample/owner/claim',{method:'POST',body:{ownerCode:env.OWNER_BOOTSTRAP_CODE},time:before})));
assert.equal(ownerClaims.filter(x=>x.status===201).length,1);
assert.equal(ownerClaims.filter(x=>x.status===410).length,19);
const humanOwnerToken=ownerClaims.find(x=>x.status===201).data.sessionToken;
assert.equal((await call('/v1/sample/fixture',{token:humanOwnerToken,time:before})).status,200);
const ownerCode=env.OWNER_BOOTSTRAP_CODE;delete env.OWNER_BOOTSTRAP_CODE;
assert.equal((await call('/v1/sample/owner/claim',{method:'POST',body:{ownerCode},time:before})).status,503);
env.OWNER_BOOTSTRAP_CODE=ownerCode;
const owner=(await call('/v1/sample/admin/bootstrap',{method:'POST',token:env.ADMIN_SECRET,time:before}));
assert.equal(owner.status,201);const ownerToken=owner.data.sessionToken;
assert.equal((await call('/v1/sample/fixture',{token:ownerToken,time:before})).data.cards.length,5);
const first=await call('/v1/sample/invites',{method:'POST',token:ownerToken,time:before});assert.equal(first.status,201);
assert.equal((await call('/v1/sample/invites',{method:'POST',token:ownerToken,time:before})).status,409);
const attempts=await Promise.all(Array.from({length:30},()=>call('/v1/sample/claim',{method:'POST',body:{inviteToken:first.data.inviteToken},time:before+1000})));
assert.equal(attempts.filter(x=>x.status===201).length,1);assert.equal(attempts.filter(x=>x.status===410).length,29);
const child=attempts.find(x=>x.status===201).data.sessionToken;
assert.equal((await call('/v1/sample/session',{token:child,time:before+2000})).data.inviteAvailable,true);
const forwarded=await call('/v1/sample/invites',{method:'POST',token:child,time:before+2000});assert.equal(forwarded.status,201);
assert.equal((await call('/v1/sample/claim',{method:'POST',body:{inviteToken:forwarded.data.inviteToken},time:before+3000})).status,201);
assert.equal((await call('/v1/sample/invites',{method:'POST',token:ownerToken,time:before+60000})).status,201);
assert.equal((await call('/v1/sample/session',{token:ownerToken,time:before+60000})).data.jstDay,'2026-09-29');
assert.equal((await call('/v1/sample/fixture',{token:child,time:before+31*24*60*60*1000})).status,401);
assert.equal((await call('/v1/sample/fixture',{token:ownerToken,time:before,foreignOrigin:'https://evil.example'})).status,403);
const expired=await call('/v1/sample/claim',{method:'POST',body:{inviteToken:first.data.inviteToken},time:before+25*60*60*1000});assert.equal(expired.status,410);
env.INVITE_DB.close();
console.log('Invite Sample PASS: anonymous owner, protected fixture, JST rollover, one/day, concurrent single claim 1/30, re-invite, expiry, foreign origin');
