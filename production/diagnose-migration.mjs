import {readFileSync} from 'node:fs';
import {randomBytes,createHash} from 'node:crypto';

const prod=JSON.parse(readFileSync('.production.wrangler.json','utf8'));
const test=JSON.parse(readFileSync('.migration-test.wrangler.json','utf8'));
const apiToken=process.env.CLOUDFLARE_API_TOKEN;
const hash=value=>createHash('sha256').update(value).digest('hex');
const query=async(cfg,sql,params=[])=>{
  const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfg.account_id}/d1/database/${cfg.d1_databases[0].database_id}/query`,{
    method:'POST',headers:{Authorization:`Bearer ${apiToken}`,'Content-Type':'application/json'},body:JSON.stringify({sql,params})
  });
  const j=await r.json();if(!r.ok||!j.success||!j.result?.[0]?.success)throw Error('d1_diagnostic_failed');
  return j.result[0].results;
};
const ownerMarker=hash('blind-face-select:owner-bootstrap:v0.1');
const rows=await query(test,'SELECT COUNT(*) AS count, MAX(expires_at) AS expires_at FROM anonymous_sessions WHERE claimed_invite_hash = ?',[ownerMarker]);
console.log('test_owner_count',rows[0].count,'test_owner_active',rows[0].expires_at>Date.now());
const prodRows=await query(prod,'SELECT COUNT(*) AS count FROM anonymous_sessions WHERE claimed_invite_hash = ?',[ownerMarker]);
console.log('production_owner_count',prodRows[0].count);
const token=randomBytes(32).toString('hex'),id=randomBytes(32).toString('hex'),now=Date.now();
const testOrigin=process.env.TEST_ORIGIN,prodOrigin=process.env.PROD_ORIGIN;
try{
  await query(test,'INSERT INTO anonymous_sessions (session_id,token_hash,claimed_invite_hash,created_at,expires_at) VALUES (?,?,NULL,?,?)',[id,hash(token),now,now+600000]);
  const direct=await fetch(testOrigin+'/v1/sample/session',{headers:{Authorization:'Bearer '+token},cache:'no-store'});
  console.log('test_direct_status',direct.status,'test_direct_active',direct.ok&&(await direct.json()).active===true);
  const migrated=await fetch(prodOrigin+'/v1/owner/migrate',{method:'POST',headers:{Origin:testOrigin,Authorization:'Bearer '+token},cache:'no-store'});
  const contentType=migrated.headers.get('content-type')||'';
  const body=contentType.includes('json')?await migrated.json():null;
  console.log('production_migration_status',migrated.status,'production_migration_error',String(body?.error||'non_json_or_missing_error'));
  if(migrated.status===201)throw Error('non_owner_migration_accepted');
}finally{
  await query(test,'DELETE FROM anonymous_sessions WHERE session_id = ?',[id]);
}
