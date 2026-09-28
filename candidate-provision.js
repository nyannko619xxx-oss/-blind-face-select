// Candidate delivery is independent of the selection algorithm and player history.
export const MANIFEST_URL='./candidate-distribution.json';
const DB_NAME='blind-face-select-assets',STORE='catalogs';
export const SET_IDS=['STARTO_SELECT','JUNIOR_SELECT','ALL_SELECT'];
export async function distributionEndpoint({fetchApi=globalThis.fetch,pageUrl=globalThis.location.href,configUrl=MANIFEST_URL}={}){
  const response=await fetchApi(new URL(configUrl,pageUrl),{cache:'no-store',referrerPolicy:'no-referrer'});
  if(!response.ok)throw Error('候補データの配布先を確認できませんでした');
  const config=await response.json();
  if(config?.schema_version!==2||typeof config.endpoint_url!=='string')throw Error('候補データの配布先が未設定です');
  const endpoint=new URL(config.endpoint_url);
  if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.search||endpoint.hash||endpoint.pathname!=='/')throw Error('候補データの配布先が不正です');
  return endpoint.origin;
}
export function validateMaster(data){
  if(data?.schema_version!==3||typeof data.master_version!=='string'||!Array.isArray(data.candidate_master))throw Error('候補データの形式が正しくありません');
  const entries=data.candidate_master,ids=new Set(),identities=new Set();
  if(entries.length<9||entries.length>300)throw Error('候補人数が範囲外です');
  for(const c of entries){
    if(typeof c.candidate_id!=='string'||!c.candidate_id||ids.has(c.candidate_id)||typeof c.identity_id!=='string'||!c.identity_id||identities.has(c.identity_id)||typeof c.display_name!=='string'||!c.display_name||!isHttps(c.image_source_url)||!isHttps(c.official_profile_url))throw Error('候補データのID・画像・出典を確認してください');
    ids.add(c.candidate_id);identities.add(c.identity_id);
  }
  const sets=data.candidate_sets||{},[a,j,all]=SET_IDS.map(id=>{
    const s=sets[id];
    if(typeof s?.version!=='string'||!Array.isArray(s.ids)||s.ids.length<9||new Set(s.ids).size!==s.ids.length||s.ids.some(id=>!ids.has(id)))throw Error('候補セットの定義が正しくありません');
    return new Set(s.ids);
  });
  if([...a].some(id=>j.has(id))||a.size+j.size!==all.size||all.size!==ids.size||[...all].some(id=>!ids.has(id)))throw Error('候補セットの分類が正しくありません');
  return data;
}
function isHttps(value){try{return new URL(value).protocol==='https:'}catch{return false}}
export function validateManifest(m,origin,requestedVersion){
  if(m?.schema_version!==1)throw Error('配布Manifestが未設定または不正です');
  const edition=requestedVersion&&requestedVersion!==m.master_version?m.editions?.find(e=>e.master_version===requestedVersion):m;
  if(!edition)throw Error('共有結果の候補Versionは配布されていません');
  if(typeof edition.master_version!=='string'||!edition.master_version||!/^sha256-[a-f0-9]{64}$/.test(edition.sha256||'')||typeof edition.master_url!=='string')throw Error('配布Manifestが未設定または不正です');
  const url=new URL(edition.master_url,origin);
  if(url.origin!==new URL(origin).origin||!['https:','http:'].includes(url.protocol)||url.username||url.password)throw Error('候補データの配布元が不正です');
  return {url:url.href,edition};
}
export async function digest(bytes,cryptoApi=globalThis.crypto){
  if(!cryptoApi?.subtle)throw Error('このブラウザでは整合性を確認できません');
  const hash=await cryptoApi.subtle.digest('SHA-256',bytes);
  return 'sha256-'+Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
}
export function openDb(indexedDBApi=globalThis.indexedDB){
  return new Promise((resolve,reject)=>{
    const req=indexedDBApi.open(DB_NAME,1);
    req.onupgradeneeded=()=>req.result.createObjectStore(STORE);
    req.onerror=()=>reject(req.error);
    req.onsuccess=()=>resolve(req.result);
  });
}
export async function catalogRecord(method,key,value,indexedDBApi=globalThis.indexedDB){
  const db=await openDb(indexedDBApi);
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,method==='get'?'readonly':'readwrite'),store=tx.objectStore(STORE);
    const req=method==='get'?store.get(key):store.put(value,key);
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
    tx.oncomplete=()=>db.close();
    tx.onabort=()=>{db.close();reject(tx.error||Error('候補データを保存できません'))};
  });
}
export async function provision({fetchApi=globalThis.fetch,origin=globalThis.location.href,storage=catalogRecord,cryptoApi=globalThis.crypto,endpoint,authorization,requestedVersion}={}){
  const delivery=endpoint||await distributionEndpoint({fetchApi,pageUrl:origin});
  const response=await fetchApi(new URL('/v1/manifest',delivery),{cache:'no-store',referrerPolicy:'no-referrer'});
  if(!response.ok)throw Error('候補データの配布情報を取得できませんでした');
  const manifest=await response.json(),{url:masterUrl,edition}=validateManifest(manifest,delivery,requestedVersion);
  const active=await storage('get','active');
  // Existing imported masters without a verified digest must pass through the remote check.
  if(active?.master_version===edition.master_version&&active.__distribution_sha256===edition.sha256){
    validateMaster(active);
    return {master:active,status:'cached'};
  }
  const saved=await storage('get','version:'+edition.master_version);
  if(saved?.__distribution_sha256===edition.sha256){
    validateMaster(saved);
    await storage('put','active',saved);
    return {master:saved,status:'restored'};
  }
  if(!authorization)throw Error('候補データの受取権限がありません。招待または共有リンクを開いてください');
  const remote=await fetchApi(masterUrl,{cache:'no-store',headers:{Authorization:'Bearer '+authorization},referrerPolicy:'no-referrer'});
  if(!remote.ok)throw Error(remote.status===401?'候補データの受取期限が終了しました':'候補データを取得できませんでした');
  const bytes=await remote.arrayBuffer();
  if(await digest(bytes,cryptoApi)!==edition.sha256)throw Error('候補データの整合性を確認できませんでした');
  const master=validateMaster(JSON.parse(new TextDecoder().decode(bytes)));
  if(master.master_version!==edition.master_version)throw Error('候補データのVersionが一致しません');
  // The approved edition remains available for old frozen sessions. Session snapshots are untouched.
  const verified={...master,__distribution_sha256:edition.sha256};
  await storage('put','version:'+master.master_version,verified);
  await storage('put','active',verified);
  return {master:verified,status:'downloaded'};
}
export async function issueReadCapability({fetchApi=globalThis.fetch,endpoint,issuer,version,expiresAt}){
  if(!endpoint||!issuer)throw Error('この端末に共有用権限がありません');
  const response=await fetchApi(new URL('/v1/grants',endpoint),{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json',Authorization:'Bearer '+issuer},body:JSON.stringify({version,expiresAt}),referrerPolicy:'no-referrer'});
  if(!response.ok)throw Error('共有用の受取権限を発行できませんでした。期限と招待権限を確認してください');
  const result=await response.json();
  if(typeof result.capability!=='string'||!result.capability)throw Error('共有用の受取権限が不正です');
  return result.capability;
}
export async function inspectCapability({fetchApi=globalThis.fetch,endpoint,capability}){
  if(!endpoint||!capability)return null;
  const response=await fetchApi(new URL('/v1/capability',endpoint),{cache:'no-store',headers:{Authorization:'Bearer '+capability},referrerPolicy:'no-referrer'});
  if(!response.ok)return null;
  const result=await response.json();
  return ['read','issuer'].includes(result.scope)&&Number.isSafeInteger(result.expiresAt)&&result.expiresAt>Date.now()?result:null;
}
