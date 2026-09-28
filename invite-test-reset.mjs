// Dedicated Cloudflare Test D1 maintenance, callable only from an authenticated
// GitHub Actions workflow. No public Worker route or participant UI control.
import crypto from 'node:crypto';

export const ownerMarker=crypto.createHash('sha256').update('blind-face-select:owner-bootstrap:v0.1').digest('hex');
export const jstDay=now=>new Date(now+9*3600000).toISOString().slice(0,10);
export const resetSql='DELETE FROM single_use_invites WHERE issuer_session_id = (SELECT session_id FROM anonymous_sessions WHERE claimed_invite_hash = ?) AND issued_jst_day = ?';

if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){
  const token=process.env.CLOUDFLARE_API_TOKEN;
  if(!token)throw Error('test_token_missing');
  const name='blind-face-select-invite-test-v01';
  const api=async(path,options={})=>{
    const response=await fetch('https://api.cloudflare.com/client/v4'+path,{...options,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'}});
    if(!response.ok)throw Error('cloudflare_http_'+response.status);
    const json=await response.json();if(!json.success)throw Error('cloudflare_api_failed');return json.result;
  };
  const accounts=await api('/accounts?per_page=50');if(accounts.length!==1)throw Error('account_not_unique');
  const account=accounts[0].id;
  const databases=await api('/accounts/'+account+'/d1/database?name='+name+'&per_page=50');
  const exact=databases.filter(d=>d.name===name);if(exact.length!==1)throw Error('test_d1_not_unique');
  const url='/accounts/'+account+'/d1/database/'+exact[0].uuid+'/query';
  const query=async(sql,params=[])=>{
    const data=await api(url,{method:'POST',body:JSON.stringify({sql,params})});
    if(!data?.[0]?.success)throw Error('d1_query_failed');return data[0].results;
  };
  const owner=await query('SELECT session_id FROM anonymous_sessions WHERE claimed_invite_hash = ?',[ownerMarker]);
  if(owner.length!==1)throw Error('one_human_owner_required');
  const day=jstDay(Date.now());
  const count=await query('SELECT count(*) AS n FROM single_use_invites WHERE issuer_session_id = ? AND issued_jst_day = ?',[owner[0].session_id,day]);
  if(count[0].n>1)throw Error('unexpected_owner_daily_rows');
  if(process.env.RESET_TEST_OWNER_QUOTA!=='true'){
    console.log('dry_run_test_owner_daily_invite_count_'+count[0].n);
    process.exit(0);
  }
  if(count[0].n===1)await query(resetSql,[ownerMarker,day]);
  const after=await query('SELECT count(*) AS n FROM single_use_invites WHERE issuer_session_id = ? AND issued_jst_day = ?',[owner[0].session_id,day]);
  if(after[0].n!==0)throw Error('reset_not_applied');
  console.log('dedicated_test_owner_daily_quota_reset_'+count[0].n);
}
