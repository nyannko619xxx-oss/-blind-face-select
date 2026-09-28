import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {provision,digest,validateMaster,validateManifest} from './candidate-provision.js';
const base='https://example.test/-blind-face-select/app.html';
const candidates=Array.from({length:18},(_,i)=>({
  candidate_id:'person-'+i,identity_id:'person-'+i,display_name:'Test '+i,
  official_profile_url:'https://official.example.test/profile/'+i,
  image_source_url:'https://official.example.test/image/'+i+'.jpg'
}));
function master(version){
  return {schema_version:3,master_version:version,candidate_master:candidates,
    candidate_sets:{
      STARTO_SELECT:{version:'starto-'+version,ids:candidates.slice(0,9).map(c=>c.candidate_id)},
      JUNIOR_SELECT:{version:'junior-'+version,ids:candidates.slice(9).map(c=>c.candidate_id)},
      ALL_SELECT:{version:'all-'+version,ids:candidates.map(c=>c.candidate_id)}
    }};
}
const records=new Map(),storage=async(method,key,value)=>method==='get'?records.get(key):records.set(key,value);
let remoteMaster=master('v1'),remoteBytes=new TextEncoder().encode(JSON.stringify(remoteMaster)),count={manifest:0,master:0};
let pinnedSha=null;
let oldEdition=null;
async function manifest(){return {schema_version:1,master_version:remoteMaster.master_version,master_url:'./master.json',sha256:pinnedSha||await digest(remoteBytes,webcrypto),editions:oldEdition?[oldEdition]:[]}}
const fetchApi=async url=>{
  if(String(url).endsWith('candidate-distribution.json')){count.manifest++;return {ok:true,json:manifest}}
  count.master++;return {ok:true,arrayBuffer:async()=>remoteBytes.buffer.slice(remoteBytes.byteOffset,remoteBytes.byteOffset+remoteBytes.byteLength)}
};
const run=(requestedVersion)=>provision({fetchApi,origin:base,storage,cryptoApi:webcrypto,requestedVersion});
assert.equal((await run()).status,'downloaded');
assert.deepEqual(count,{manifest:1,master:1});
assert.equal((await run()).status,'cached');
assert.deepEqual(count,{manifest:2,master:1});
const oldSnapshot=structuredClone(records.get('active').candidate_master[0]);
oldEdition={master_version:'v1',master_url:'./master-v1.json',sha256:await digest(remoteBytes,webcrypto)};
remoteMaster=master('v2');remoteBytes=new TextEncoder().encode(JSON.stringify(remoteMaster));
assert.equal((await run()).status,'downloaded');
assert.equal(records.get('version:v1').master_version,'v1');
assert.deepEqual(records.get('version:v1').candidate_master[0],oldSnapshot);
assert.equal(records.get('active').master_version,'v2');
records.delete('active');
assert.equal((await run()).status,'restored');
assert.deepEqual(count,{manifest:4,master:2});
assert.equal((await run('v1')).status,'restored');
assert.equal(records.get('active').master_version,'v1');
await assert.rejects(run('missing'),/候補Version/);
pinnedSha=await digest(remoteBytes,webcrypto);
remoteBytes=new TextEncoder().encode(JSON.stringify({...remoteMaster,master_version:'tampered'}));
records.clear();
await assert.rejects(run(),/整合性/);
assert.equal(records.has('active'),false);
assert.throws(()=>validateManifest({schema_version:1,master_version:'v1',master_url:'https://other.test/data.json',sha256:'sha256-'+'0'.repeat(64)},base),/配布元/);
assert.throws(()=>validateMaster({...master('x'),candidate_sets:{...master('x').candidate_sets,ALL_SELECT:{version:'x',ids:candidates.slice(1).map(c=>c.candidate_id)}}}),/分類/);
const html=readFileSync(new URL('./app.html',import.meta.url),'utf8'),app=readFileSync(new URL('./app.js',import.meta.url),'utf8');
assert(!html.includes('value="demo"'));
assert(html.includes('id="retryCatalog"'));
assert(app.includes("'app.html?set='+encodeURIComponent(data.setId)"));
assert(app.includes("'&version='+encodeURIComponent(data.version)"));
assert(!app.includes("createSelection(Array.from({length:140}"));
console.log('Candidate provisioning PASS: clean, cache, version, integrity, Set routing and failure UI structure');
