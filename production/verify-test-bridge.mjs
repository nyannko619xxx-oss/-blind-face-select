import {readFileSync} from 'node:fs';
const origin=process.env.TEST_ORIGIN;
let ready=false;
for(let i=0;i<8;i++){
  await new Promise(resolve=>setTimeout(resolve,5000));
  const html=await fetch(origin+'/migration.html?v=production-owner-01',{cache:'no-store'});
  const js=await fetch(origin+'/migration.js?v=production-owner-01',{cache:'no-store'});
  ready=html.ok&&js.ok&&(await html.text()).includes('引き継ぎを開始')&&(await js.text())===readFileSync('invite-sample-assets/migration.js','utf8');
  if(ready)break;
}
if(!ready)throw Error('migration_bridge_not_ready');
const session=await fetch(origin+'/v1/sample/session',{cache:'no-store'});
if(session.status!==401)throw Error('test_session_gate_regression');
const home=await fetch(origin+'/',{cache:'no-store'});
if(!home.ok||(await home.text()).includes('id="home"')===false)throw Error('test_home_regression');
console.log('test_migration_asset_and_existing_core_pass');
