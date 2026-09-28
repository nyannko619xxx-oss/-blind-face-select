// Isolated Test origin: the private catalog is read from a local file and never posted to the Worker.
const DB='bfs-owner-real-test-v01',STORE='private';
const VERSION='starto-junior-2026-09-28',SET_VERSION='starto-105-2026-09-28';
export const OWNER_SET_VERSION=SET_VERSION;
const https=x=>{try{return new URL(x).protocol==='https:'}catch{return false}};
export function validateOwnerMaster(m){
  if(m?.schema_version!==3||m.master_version!==VERSION||!Array.isArray(m.candidate_master)||m.candidate_master.length!==263)throw Error('2026-09-28の候補ファイルを確認してください。');
  const records=new Map(),identities=new Set();
  for(const c of m.candidate_master){
    if(!c?.candidate_id||records.has(c.candidate_id)||!c.identity_id||identities.has(c.identity_id)||!c.display_name||!https(c.image_source_url)||!https(c.official_profile_url))throw Error('候補データの形式が正しくありません。');
    records.set(c.candidate_id,c);identities.add(c.identity_id);
  }
  const sets=m.candidate_sets||{},starto=sets.STARTO_SELECT,junior=sets.JUNIOR_SELECT,all=sets.ALL_SELECT;
  if(starto?.version!==SET_VERSION||starto.ids?.length!==105||junior?.ids?.length!==158||all?.ids?.length!==263||
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
export function startoSnapshot(master){
  validateOwnerMaster(master);const byId=new Map(master.candidate_master.map(c=>[c.candidate_id,c]));
  return {masterVersion:master.master_version,setVersion:SET_VERSION,candidates:master.candidate_sets.STARTO_SELECT.ids.map(id=>byId.get(id))};
}
