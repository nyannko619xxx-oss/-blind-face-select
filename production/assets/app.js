import {mountOwnerRealGame} from './real-game.js?v=medal-reveal-01';
import {ownerGameStatus,SETS,validateOwnerMaster,candidateSnapshot,privateRecord} from './owner-master.js?v=production-owner-01';
import {sealMaster,openMaster} from './master-transfer.js';
const $=id=>document.getElementById(id), KEY='bfs-production-session-v0.1';
const TEST_ORIGIN='https://blind-face-select-invite-test-v01.nyannko619xxx.workers.dev';
const PENDING_KEY='bfs-pending-invite-master-key-v01';
let sessionToken=localStorage.getItem(KEY), pendingInvite=null, pendingInviteKey=null, currentSession=null, inviteUrl='', migrationWindow=null, migrationNonce=null;
const status=value=>$('status').textContent=value;
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
async function api(path,{method='GET',body,authorized=true}={}){
  const headers={'Content-Type':'application/json'};if(authorized&&sessionToken)headers.Authorization='Bearer '+sessionToken;
  const r=await fetch(path,{method,headers,body:body?JSON.stringify(body):undefined,cache:'no-store',referrerPolicy:'no-referrer'});
  const data=await r.json();if(!r.ok)throw Object.assign(Error(data.error||'request_failed'),{code:r.status});return data;
}
function access(message){$('access').hidden=false;$('home').hidden=$('play').hidden=$('invitePanel').hidden=$('homeButton').hidden=true;$('accessMessage').textContent=message;$('claimInvite').hidden=!pendingInvite;$('beginMigration').hidden=!!pendingInvite;status('')}
async function home(){
  $('access').hidden=$('retrySession').hidden=$('play').hidden=$('invitePanel').hidden=$('homeButton').hidden=true;
  $('home').hidden=false;$('modes').replaceChildren();
  const master=await privateRecord('get','owner-master:2026-09-28');
  if(master){
    $('migrateFromHome').hidden=true;
    for(const [setId,set] of Object.entries(SETS)){
      const info=await ownerGameStatus(sessionToken,setId),button=document.createElement('button');
      button.type='button';button.className='mode-card';button.dataset.set=setId;
      const title=document.createElement('strong');title.textContent=set.title;
      const count=document.createElement('span');count.textContent=set.count+'人';
      const state=document.createElement('small');state.textContent=info.progress==='in_progress'?'続きから':info.progress==='complete'?'TOP9を見る':'選考を始める';
      button.append(title,count,state);button.onclick=()=>openGame(setId);$('modes').append(button);
    }
  }else{
    $('migrateFromHome').hidden=!currentSession?.owner;
    const note=document.createElement('p');note.textContent='実候補での選考は現在準備中です。招待機能はホームから利用できます。';$('modes').append(note);
  }
  status('');
}
async function openGame(setId){
  if(!(setId in SETS)||!await privateRecord('get','owner-master:2026-09-28'))return;
  $('home').hidden=$('invitePanel').hidden=true;$('play').hidden=$('homeButton').hidden=false;
  try{await mountOwnerRealGame($('play'),sessionToken,{setId});status('')}catch{status('選考画面を開けませんでした。ホームに戻って再度お試しください。')}
}
async function showSession(){
  try{
    currentSession=await api('/v1/sample/session');if(currentSession.owner&&currentSession.expiresAt-Date.now()<7*86400000)await api('/v1/sample/renew',{method:'POST'});
    let provisionError=false;
    if(!currentSession.owner&&localStorage.getItem(PENDING_KEY)){
      try{const bundle=await api('/v1/sample/master-bundle'),master=await openMaster(bundle.encryptedMaster,localStorage.getItem(PENDING_KEY));await privateRecord('put','owner-master:2026-09-28',master);localStorage.removeItem(PENDING_KEY)}catch{provisionError=true}
    }
    $('quota').textContent='今日の招待：'+(currentSession.inviteAvailable?'利用できます':'使用済みです')+'。毎日0:00（日本時間）に更新されます。';$('makeInvite').disabled=!currentSession.inviteAvailable;await home();
    if(provisionError){$('retrySession').hidden=false;status('候補データを復元できませんでした。再読み込みでお試しください。')}
  }
  catch(error){if(error.code===401){sessionToken=null;currentSession=null;localStorage.removeItem(KEY);access('利用期限が終了しました。以前の端末から引き継ぐか、招待リンクを開いてください。')}else{$('retrySession').hidden=false;status('通信に失敗しました。再読み込みで続行してください。')}}
}
function validProgress(record,setId,master){
  if(!record)return null;
  const set=SETS[setId],expected=candidateSnapshot(master,setId),candidateIds=expected.candidates.map(c=>c.candidate_id);
  const snapshot=record.snapshot;
  if(record.setId!==setId||record.setVersion!==set.version||snapshot?.setVersion!==set.version||snapshot?.masterVersion!==expected.masterVersion||
    JSON.stringify(snapshot.candidates?.map(c=>c.candidate_id))!==JSON.stringify(candidateIds)||record.engine?.version!==3||record.engine?.originalCount!==set.count||
    !Array.isArray(record.engine.history)||!Array.isArray(record.engine.ranking)||
    (record.revealCount!==undefined&&(!Number.isInteger(record.revealCount)||record.revealCount<0||record.revealCount>9)))
    throw Error('保存結果の整合性を確認できませんでした。');
  const ids=new Set(candidateIds);
  for(const event of record.engine.history)if(!Array.isArray(event.shown)||!Array.isArray(event.chosen)||event.shown.some(id=>!ids.has(id))||event.chosen.some(id=>!event.shown.includes(id)))throw Error('選択履歴の整合性を確認できませんでした。');
  if(record.engine.ranking.some(id=>!ids.has(id)))throw Error('順位の整合性を確認できませんでした。');
  return {...record,revealCount:record.revealCount===undefined?(record.completedAt?9:0):record.revealCount};
}
async function receiveMigration(data){
  const master=validateOwnerMaster(data.master),progress=data.progress||{};
  const records={};for(const setId of Object.keys(SETS))records[setId]=validProgress(progress[setId],setId,master);
  if(!/^[a-f0-9]{64}$/.test(data.sessionToken||''))throw Error('利用情報を確認できませんでした。');
  const response=await fetch('/v1/sample/session',{headers:{Authorization:'Bearer '+data.sessionToken},cache:'no-store',referrerPolicy:'no-referrer'});
  const owner=await response.json();if(!response.ok||owner.owner!==true)throw Error('利用情報を確認できませんでした。');
  // Make a recoverable local backup before changing the active session pointer.
  const newHash=await digest(data.sessionToken);
  await privateRecord('put','owner-master:2026-09-28',master);
  for(const [setId,record] of Object.entries(records))if(record){
    const key='owner-progress:'+newHash+(setId==='STARTO_SELECT'?'':':'+setId);
    await privateRecord('put',key,record);
  }
  sessionToken=data.sessionToken;localStorage.setItem(KEY,sessionToken);await showSession();
}
window.addEventListener('message',async event=>{
  if(event.origin!==TEST_ORIGIN||event.source!==migrationWindow||!migrationNonce||event.data?.nonce!==migrationNonce)return;
  if(event.data.type==='bfs-migration-ready'){migrationWindow.postMessage({type:'bfs-migration-begin',nonce:migrationNonce},TEST_ORIGIN);return}
  if(event.data.type==='bfs-migration-data'){
    try{await receiveMigration(event.data);migrationWindow.postMessage({type:'bfs-migration-ack',nonce:migrationNonce},TEST_ORIGIN);migrationNonce=null;status('以前の結果を引き継ぎました。')}
    catch(error){status(error.message||'引き継ぎに失敗しました。元のデータは残っています。');migrationWindow.postMessage({type:'bfs-migration-error',nonce:migrationNonce},TEST_ORIGIN)}
  }
});
$('beginMigration').onclick=()=>{
  migrationNonce=Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
  const url=new URL('/migration.html',TEST_ORIGIN);url.searchParams.set('nonce',migrationNonce);
  migrationWindow=window.open(url.href,'_blank');
  if(!migrationWindow)status('新しいタブを開けませんでした。Safariのポップアップ設定を確認してください。');
  else status('開いた画面で引き継ぎを開始してください。');
};
$('migrateFromHome').onclick=()=>$('beginMigration').click();
$('claimInvite').onclick=async()=>{
  $('claimInvite').disabled=true;
  try{
    if(pendingInviteKey){if(!/^[A-Za-z0-9_-]{43}$/.test(pendingInviteKey))throw Error('invalid_key');localStorage.setItem(PENDING_KEY,pendingInviteKey)}
    const claimed=await api('/v1/sample/claim',{method:'POST',body:{inviteToken:pendingInvite},authorized:false});pendingInvite=null;pendingInviteKey=null;sessionToken=claimed.sessionToken;localStorage.setItem(KEY,sessionToken);await showSession()
  }
  catch(error){if(error.code===410||error.code===400){pendingInvite=null;localStorage.removeItem(PENDING_KEY)}access(error.code===410?'この招待は使用済み、または期限切れです。':'招待を受け取れませんでした。')}
  finally{$('claimInvite').disabled=false}
};
$('retrySession').onclick=()=>showSession();
$('homeButton').onclick=()=>home();
$('inviteFromHome').onclick=()=>{$('home').hidden=$('play').hidden=true;$('invitePanel').hidden=$('homeButton').hidden=false};
$('makeInvite').onclick=async()=>{
  $('makeInvite').disabled=true;
  try{
    const master=await privateRecord('get','owner-master:2026-09-28'),sealed=master?await sealMaster(master):null;
    const grant=await api('/v1/sample/invites',{method:'POST',body:sealed?{encryptedMaster:sealed.bundle}:undefined}),url=new URL('index.html',location.href);
    const fragment=new URLSearchParams({invite:grant.inviteToken});if(sealed)fragment.set('key',sealed.key);url.hash=fragment.toString();inviteUrl=url.href;
    $('inviteLink').value=inviteUrl;$('shareArea').hidden=false;$('quota').textContent='今日の招待は使用済みです。';status('招待リンクを発行しました。')
  }
  catch(error){status(error.code===409?'今日の招待は使用済みです。':'招待を発行できませんでした。');if(error.code!==409)$('makeInvite').disabled=false}
};
$('share').onclick=async()=>{if(!inviteUrl)return;if(navigator.share){try{await navigator.share({title:'Blind Face Select 招待',url:inviteUrl})}catch(error){if(error.name!=='AbortError')status('共有できませんでした。リンクをコピーしてください。')}}else $('copy').click()};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(inviteUrl);status('招待URLをコピーしました。')}catch{$('inviteLink').select();status('表示されたURLを選択してコピーしてください。')}};
const fragment=new URLSearchParams(location.hash.slice(1));history.replaceState(null,'',location.pathname+location.search);
if(/^[a-f0-9]{64}$/.test(fragment.get('invite')||'')){pendingInvite=fragment.get('invite');pendingInviteKey=fragment.get('key');access('招待リンクを開きました。')}else if(sessionToken)showSession();else access('以前の結果を引き継ぐか、招待リンクを開いてください。');
