import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import crypto from 'node:crypto';
const cfg=JSON.parse(readFileSync('.production.wrangler.json','utf8')),origin=process.env.PROD_ORIGIN;
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const token=crypto.randomBytes(32).toString('hex'),id=crypto.randomBytes(32).toString('hex'),now=Date.now();
const query=async(sql,params=[])=>{
  const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+cfg.account_id+'/d1/database/'+cfg.d1_databases[0].database_id+'/query',{method:'POST',headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({sql,params})});
  const data=await r.json();if(!r.ok||!data.success||!data.result?.[0]?.success)throw Error('production_d1_query_failed');return data.result[0].results;
};
const request=async(path,{method='GET',bearer,body,foreign=false}={})=>{
  const headers={'Content-Type':'application/json',Origin:foreign?'https://foreign.invalid':origin};
  if(bearer)headers.Authorization='Bearer '+bearer;
  const r=await fetch(origin+path,{method,headers,body:body?JSON.stringify(body):undefined,cache:'no-store'});
  return {status:r.status,body:await r.json()};
};
const expect=(r,status,label)=>{if(r.status!==status)throw Error(label+'_status_'+r.status);return r.body};
let loaded=false;
for(let i=0;i<8;i++){
  await new Promise(resolve=>setTimeout(resolve,5000));
  const r=await fetch(origin+'/?v=production-owner-01',{cache:'no-store'}),html=await r.text();
  const js=await fetch(origin+'/app.js?v=production-owner-01',{cache:'no-store'});
  if(r.ok&&html.includes('STARTO')===false&&html.includes('id="modes"')&&html.includes('id="beginMigration"')&&!html.includes('140候補')&&!html.includes('Ownerとして開始')&&js.ok&&(await js.text())===readFileSync('production/assets/app.js','utf8')){loaded=true;break}
}
if(!loaded)throw Error('production_assets_not_ready');
for(const file of ['selection-engine.js','reveal-board.js','board.css','owner-master.js','master-transfer.js','real-game.js']){
  const r=await fetch(origin+'/'+file,{cache:'no-store'});
  if(!r.ok||(await r.text())!==readFileSync('production/assets/'+file,'utf8'))throw Error('asset_mismatch_'+file);
}
expect(await request('/v1/owner/migrate',{method:'POST',foreign:true}),403,'foreign_migration');
expect(await request('/v1/owner/migrate',{method:'POST'}),403,'non_test_migration');
expect(await request('/v1/sample/session'),401,'anonymous');
expect(await request('/v1/sample/invites',{method:'POST'}),401,'anonymous_invite');
expect(await request('/v1/sample/fixture'),401,'anonymous_fixture');
let invite=null,child=null;
try{
  await query('INSERT INTO anonymous_sessions (session_id,token_hash,claimed_invite_hash,created_at,expires_at) VALUES (?,?,NULL,?,?)',[id,hash(token),now,now+3600000]);
  expect(await request('/v1/sample/fixture',{bearer:token}),404,'no_production_fixture');
  expect(await request('/v1/sample/admin/bootstrap',{method:'POST',bearer:token}),404,'no_admin_bootstrap');
  expect(await request('/v1/sample/owner/claim',{method:'POST',bearer:token}),404,'no_owner_bootstrap');
  const fixtureBundle={version:'starto-junior-2026-09-28',iv:'AAAAAAAAAAAAAAAA',ciphertext:'A'.repeat(660000)};
  const grant=expect(await request('/v1/sample/invites',{method:'POST',bearer:token,body:{encryptedMaster:fixtureBundle}}),201,'invite_issue');
  invite=grant.inviteToken;
  const claimed=expect(await request('/v1/sample/claim',{method:'POST',body:{inviteToken:invite}}),201,'invite_claim');
  child=claimed.sessionToken;
  const delivered=expect(await request('/v1/sample/master-bundle',{bearer:child}),200,'encrypted_bundle');
  assert.deepEqual(delivered.encryptedMaster,fixtureBundle);
  expect(await request('/v1/sample/claim',{method:'POST',body:{inviteToken:invite}}),410,'invite_reuse');
  const recipient=expect(await request('/v1/sample/session',{bearer:child}),200,'recipient_session');
  assert.equal(recipient.owner,false);
  expect(await request('/v1/sample/invites',{method:'POST',bearer:child}),201,'recipient_reinvite');
  console.log('separate_production_surface_and_invite_core_pass');
}finally{
  if(child){
    const rows=await query('SELECT session_id FROM anonymous_sessions WHERE claimed_invite_hash = ?',[hash(invite)]);
    for(const row of rows){await query('DELETE FROM single_use_invites WHERE issuer_session_id = ?',[row.session_id]);await query('DELETE FROM anonymous_sessions WHERE session_id = ?',[row.session_id])}
  }
  await query('DELETE FROM single_use_invites WHERE issuer_session_id = ?',[id]);
  await query('DELETE FROM anonymous_sessions WHERE session_id = ?',[id]);
}
