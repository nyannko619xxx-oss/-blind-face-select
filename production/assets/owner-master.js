// Formal origin: private catalog and progress stay in the Owner browser, not D1.
const DB='bfs-owner-real-production-v01',STORE='private';
const VERSION='starto-junior-2026-09-28';
export const SETS={STARTO_SELECT:{title:'STARTO',count:105,version:'starto-105-2026-09-28'},JUNIOR_SELECT:{title:'Junior',count:158,version:'junior-158-2026-09-28'},ALL_SELECT:{title:'ALL',count:263,version:'all-263-2026-09-28'}};
export const OWNER_SET_VERSION=SETS.STARTO_SELECT.version;
const https=x=>{try{return new URL(x).protocol==='https:'}catch{return false}};
export function validateOwnerMaster(m){
  if(m?.schema_version!==3||m.master_version!==VERSION||!Array.isArray(m.candidate_master)||m.candidate_master.length!==263)throw Error('2026-09-28の候補ファイルを確認してください。');
  const records=new Map(),identities=new Set();
  for(const c of m.candidate_master){
    if(!c?.candidate_id||records.has(c.candidate_id)||!c.identity_id||identities.has(c.identity_id)||!c.display_name||!https(c.image_source_url)||!https(c.official_profile_url))throw Error('候補データの形式が正しくありません。');
    records.set(c.candidate_id,c);identities.add(c.identity_id);
  }
  const sets=m.candidate_sets||{},starto=sets.STARTO_SELECT,junior=sets.JUNIOR_SELECT,all=sets.ALL_SELECT;
  if(starto?.version!==SETS.STARTO_SELECT.version||starto.ids?.length!==105||junior?.version!==SETS.JUNIOR_SELECT.version||junior.ids?.length!==158||all?.version!==SETS.ALL_SELECT.version||all.ids?.length!==263||
    new Set(all.ids).size!==263||new Set([...starto.ids,...junior.ids]).size!==263||
    starto.ids.some(id=>!records.has(id))||junior.ids.some(id=>!records.has(id))||all.ids.some(id=>!records.has(id)))throw Error('候補セットの人数・分類が一致しません。');
  return m;
}
function open(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function privateRecord(method,key,value){
  const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,method==='get'?'readonly':'readwrite'),s=tx.objectStore(STORE),r=method==='get'?s.get(key):s.put(value,key);
    r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close();tx.onabort=()=>{db.close();reject(tx.error||Error('端末内に保存できませんでした。'))};
  });
}
export async function readOwnerFile(file){
  if(!file||file.size>4_000_000)throw Error('候補ファイルを確認してください。');
  return validateOwnerMaster(JSON.parse(await file.text()));
}
export function candidateSnapshot(master,setId){
  validateOwnerMaster(master);const byId=new Map(master.candidate_master.map(c=>[c.candidate_id,c]));
  const set=SETS[setId];if(!set)throw Error('候補セットが正しくありません。');
  return {masterVersion:master.master_version,setId,setVersion:set.version,candidates:master.candidate_sets[setId].ids.map(id=>byId.get(id))};
}
export const startoSnapshot=master=>candidateSnapshot(master,'STARTO_SELECT');
export async function ownerGameStatus(sessionToken,setId){
  const set=SETS[setId];if(!set)throw Error('候補セットが正しくありません。');
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sessionToken))),b=>b.toString(16).padStart(2,'0')).join('');
  const key='owner-progress:'+hash+(setId==='STARTO_SELECT'?'':':'+setId);
  const saved=await privateRecord('get',key),master=await privateRecord('get','owner-master:2026-09-28');
  return {masterAvailable:!!master,progress:saved?.setVersion===set.version&&saved.snapshot?.candidates?.length===set.count?(saved.engine?.phase==='complete'?'complete':'in_progress'):null};
}
