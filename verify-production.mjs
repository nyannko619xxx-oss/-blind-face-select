import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import worker from './production/worker.mjs';
const db=new DatabaseSync(':memory:');db.exec(readFileSync('production/schema.sql','utf8'));
const d1={prepare(sql){return {bind(...params){const s=db.prepare(sql);return {async first(){return s.get(...params)||null},async run(){return s.run(...params)}}}}}};
const origin='https://blind-face-select-prod-v01.example',test='https://blind-face-select-invite-test-v01.example';
const oldToken='a'.repeat(64),env={APP_ORIGIN:origin,TEST_ORIGIN:test,INVITE_DB:d1,TEST_SESSION:{fetch:async request=>new Response(JSON.stringify({owner:request.headers.get('Authorization')==='Bearer '+oldToken,active:true}),{status:request.headers.get('Authorization')==='Bearer '+oldToken?200:401,headers:{'Content-Type':'application/json'}})}};
async function call(path,{method='GET',token,from=origin,body}={}){
  const headers={Origin:from};if(token)headers.Authorization='Bearer '+token;
  const r=await worker.fetch(new Request(origin+path,{method,headers,body:body?JSON.stringify(body):undefined}),env);
  return {status:r.status,value:await r.json(),headers:r.headers};
}
try{
  assert.equal((await call('/v1/sample/fixture')).status,401);
  assert.equal((await call('/v1/sample/owner/claim',{method:'POST'})).status,401);
  assert.equal((await call('/v1/sample/admin/bootstrap',{method:'POST'})).status,401);
  assert.equal((await call('/v1/owner/migrate',{method:'POST',token:oldToken})).status,403);
  assert.equal((await call('/v1/owner/migrate',{method:'POST',from:test,token:'b'.repeat(64)})).status,401);
  const first=await call('/v1/owner/migrate',{method:'POST',from:test,token:oldToken});
  assert.equal(first.status,201);assert.equal(first.headers.get('Access-Control-Allow-Origin'),test);
  const prodToken=first.value.sessionToken;
  assert.equal((await call('/v1/sample/session',{token:prodToken})).value.owner,true);
  assert.equal((await call('/v1/sample/owner/claim',{method:'POST',token:prodToken})).status,404);
  assert.equal((await call('/v1/sample/admin/bootstrap',{method:'POST',token:prodToken})).status,404);
  const renewed=await call('/v1/sample/renew',{method:'POST',token:prodToken});assert.equal(renewed.status,200);
  const invite=await call('/v1/sample/invites',{method:'POST',token:prodToken,body:{encryptedMaster:{version:'starto-junior-2026-09-28',iv:'AAAAAAAAAAAAAAAA',ciphertext:'encryptedData'}}});assert.equal(invite.status,201);
  assert.equal((await call('/v1/sample/invites',{method:'POST',token:prodToken})).status,409);
  const claimed=await call('/v1/sample/claim',{method:'POST',body:{inviteToken:invite.value.inviteToken}});
  assert.equal(claimed.status,201);
  assert.equal((await call('/v1/sample/claim',{method:'POST',body:{inviteToken:invite.value.inviteToken}})).status,410);
  assert.equal((await call('/v1/sample/session',{token:claimed.value.sessionToken})).value.owner,false);
  assert.equal((await call('/v1/sample/master-bundle',{token:claimed.value.sessionToken})).value.encryptedMaster.ciphertext,'encryptedData');
  assert.equal((await call('/v1/sample/fixture',{token:claimed.value.sessionToken})).status,404);
  assert.equal((await call('/v1/sample/renew',{method:'POST',token:claimed.value.sessionToken})).status,403);
  assert.equal((await call('/v1/sample/invites',{method:'POST',token:claimed.value.sessionToken})).status,201);
  const retry=await call('/v1/owner/migrate',{method:'POST',from:test,token:oldToken});
  assert.equal(retry.status,201);assert.notEqual(retry.value.sessionToken,prodToken);
  assert.equal((await call('/v1/sample/session',{token:prodToken})).status,401);
  assert.equal((await call('/v1/sample/session',{token:retry.value.sessionToken})).value.owner,true);
  const count=db.prepare('SELECT count(*) AS n FROM anonymous_sessions WHERE claimed_invite_hash IS NOT NULL').get().n;assert.equal(count,2); // Owner and claimed recipient
  console.log('production worker isolation, owner migration retry and invite core PASS');
}finally{db.close()}
