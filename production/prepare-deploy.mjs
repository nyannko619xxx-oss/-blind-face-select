import {writeFileSync,appendFileSync} from 'node:fs';
const token=process.env.CLOUDFLARE_API_TOKEN;
if(!token)throw Error('cloudflare_token_missing');
const api=async(path,{method='GET',body}={})=>{
  const r=await fetch('https://api.cloudflare.com/client/v4'+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  if(!r.ok)throw Error('cloudflare_http_'+r.status);
  const data=await r.json();if(!data.success)throw Error('cloudflare_api_failed');
  return data.result;
};
const accounts=await api('/accounts?per_page=50');if(accounts.length!==1)throw Error('account_not_unique');
const account=accounts[0].id,prod='blind-face-select-prod-v01',test='blind-face-select-invite-test-v01';
const databases=await api('/accounts/'+account+'/d1/database?per_page=100');
const testDb=databases.filter(x=>x.name===test);
if(testDb.length!==1)throw Error('exact_test_database_missing');
let prodDbs=databases.filter(x=>x.name===prod);
if(prodDbs.length===0){
  const created=await api('/accounts/'+account+'/d1/database',{method:'POST',body:{name:prod}});
  prodDbs=[created];
  console.log('separate_production_d1_created');
}
if(prodDbs.length!==1||!prodDbs[0].uuid||prodDbs[0].uuid===testDb[0].uuid)throw Error('production_d1_not_isolated');
const domain=await api('/accounts/'+account+'/workers/subdomain');
if(!/^[a-z0-9-]+$/.test(domain.subdomain||''))throw Error('workers_subdomain_missing');
const origin=name=>'https://'+name+'.'+domain.subdomain+'.workers.dev';
const cfg=(name,main,assets,db,vars)=>({name,account_id:account,main,compatibility_date:'2026-09-28',workers_dev:true,assets:{directory:assets,run_worker_first:['/v1/*']},d1_databases:[{binding:'INVITE_DB',database_name:name,database_id:db}],vars});
writeFileSync('.production.wrangler.json',JSON.stringify({...cfg(prod,'production/worker.mjs','./production/assets',prodDbs[0].uuid,{APP_ORIGIN:origin(prod),TEST_ORIGIN:origin(test)}),services:[{binding:'TEST_SESSION',service:test}]}));
writeFileSync('.migration-test.wrangler.json',JSON.stringify(cfg(test,'invite-sample-worker.mjs','./invite-sample-assets',testDb[0].uuid,{APP_ORIGIN:origin(test)})));
appendFileSync(process.env.GITHUB_ENV,'PROD_ORIGIN='+origin(prod)+'\nTEST_ORIGIN='+origin(test)+'\n');
console.log('exact_separate_worker_and_d1_configs_prepared');
