import {readFileSync} from 'node:fs';
const cfg=JSON.parse(readFileSync('.production.wrangler.json','utf8'));
const base=`https://api.cloudflare.com/client/v4/accounts/${cfg.account_id}/d1/database/${cfg.d1_databases[0].database_id}/query`;
const query=async sql=>{
  const r=await fetch(base,{method:'POST',headers:{Authorization:`Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({sql})});
  const j=await r.json();if(!r.ok||!j.success||!j.result?.[0]?.success)throw Error('production_schema_check_failed');return j.result[0].results;
};
const cols=await query('PRAGMA table_info(single_use_invites)');
if(!cols.some(c=>c.name==='encrypted_master')){
  await query('ALTER TABLE single_use_invites ADD COLUMN encrypted_master TEXT');
  console.log('production_private_invite_column_added');
}else console.log('production_private_invite_column_already_present');
