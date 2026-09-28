import {mountFixtureGame} from './game.js?v=sample-v02-1';
import {mountOwnerRealGame} from './real-game.js?v=reveal-finish-01';
import {ownerGameStatus,SETS} from './owner-master.js?v=playable-01';
const $=id=>document.getElementById(id),KEY='bfs-invite-sample-session-v0.1',OWNER_KEY='bfs-invite-sample-owner-code-v0.1';
const endpoint=new URL(location.href).origin;
let sessionToken=localStorage.getItem(KEY),invitationUrl='',pendingInvite=null,currentSession=null;
const status=s=>$('status').textContent=s;
// Preserve an unclaimed code from an older still-open tab across future tab closures.
const legacyCode=sessionStorage.getItem(OWNER_KEY);
if(!localStorage.getItem(OWNER_KEY)&&/^[a-f0-9]{64}$/.test(legacyCode||''))localStorage.setItem(OWNER_KEY,legacyCode);
if(legacyCode)sessionStorage.removeItem(OWNER_KEY);
async function api(path,{method='GET',body,authorized=true}={}){
  const headers={'Content-Type':'application/json'};if(authorized&&sessionToken)headers.Authorization='Bearer '+sessionToken;
  const result=await fetch(endpoint+path,{method,headers,body:body?JSON.stringify(body):undefined,cache:'no-store',referrerPolicy:'no-referrer'});
  const json=await result.json();if(!result.ok)throw Object.assign(Error(json.error||'request_failed'),{code:result.status});return json;
}
function showAccess(message){$('access').hidden=false;$('home').hidden=$('play').hidden=$('invitePanel').hidden=$('homeButton').hidden=true;status(message);$('claimInvite').hidden=!pendingInvite;$('ownerSetup').hidden=!!pendingInvite;$('ownerPanel').hidden=!!pendingInvite||!localStorage.getItem(OWNER_KEY);if(!$('ownerPanel').hidden)$('ownerCode').value=localStorage.getItem(OWNER_KEY);$('ownerSetup').hidden=!!pendingInvite||!!localStorage.getItem(OWNER_KEY);$('restoreOwner').hidden=!!pendingInvite;$('devOwner').hidden=!['localhost','127.0.0.1'].includes(location.hostname);$('accessHelp').textContent=$('devOwner').hidden?'招待リンクを開くと利用できます。初回の設定や復旧は下の項目から行えます。':'ローカル試験ではOwnerを発行できます。'}
async function showHome(){
  $('access').hidden=$('ownerPanel').hidden=$('retrySession').hidden=$('play').hidden=$('invitePanel').hidden=$('homeButton').hidden=true;
  $('home').hidden=false;$('modes').replaceChildren();
  if(currentSession?.owner){
    for(const [setId,set] of Object.entries(SETS)){
      const info=await ownerGameStatus(sessionToken,setId);
      const button=document.createElement('button');button.type='button';button.className='mode-card';button.dataset.set=setId;
      const title=document.createElement('strong');title.textContent=set.title;
      const count=document.createElement('span');count.textContent=`${set.count}人`;
      const state=document.createElement('small');state.textContent=info.progress==='in_progress'?'続きから':info.progress==='complete'?'TOP9を見る':'選考を始める';
      button.append(title,count,state);button.onclick=()=>openGame(setId);$('modes').append(button);
    }
  }else{
    const button=document.createElement('button');button.type='button';button.className='mode-card';button.dataset.set='SAMPLE';button.textContent='顔だけで選ぶ｜体験版';button.onclick=()=>openGame('SAMPLE');$('modes').append(button);
  }
  status('');
}
async function openGame(setId){
  $('home').hidden=$('invitePanel').hidden=true;$('play').hidden=$('homeButton').hidden=false;
  try{if(currentSession?.owner&&setId in SETS)await mountOwnerRealGame($('play'),sessionToken,{setId});else if(!currentSession?.owner&&setId==='SAMPLE')await mountFixtureGame($('play'),sessionToken);else throw Error('mode_unavailable');status('')}
  catch{status('選考画面を開けませんでした。ホームに戻って再度お試しください。')}
}
async function showSession(){
  try{
    const [me,fixture]=await Promise.all([api('/v1/sample/session'),api('/v1/sample/fixture')]);
    currentSession=me;
    $('quota').textContent=`今日の招待：${me.inviteAvailable?'利用できます':'使用済みです'}。招待枠は毎日0:00（日本時間）に更新されます。`;
    $('makeInvite').disabled=!me.inviteAvailable;
    if(!Array.isArray(fixture.cards)||fixture.cards.length!==5)throw new Error('sample_unavailable');
    await showHome();
    return true;
  }catch(error){
    if(error.code===401){sessionToken=null;currentSession=null;localStorage.removeItem(KEY);showAccess('利用期限が終了しました。招待リンクから始めてください。');return false}
    // A one-time Owner Claim may have succeeded even if the next fetch fails.
    // Keep its token, so reload can resume without consuming the Owner slot again.
    $('retrySession').hidden=false;
    status('利用状態は保存済みです。通信に失敗しました。再読み込みで続行してください。');
    return false;
  }
}
async function start(){
  const fragment=location.hash;history.replaceState(null,'',location.pathname+location.search);
  if(fragment.startsWith('#session=')){sessionToken=fragment.slice(9);localStorage.setItem(KEY,sessionToken)}
  if(fragment.startsWith('#invite=')){pendingInvite=fragment.slice(8);showAccess('招待URLを開きました。「招待を受け取る」を押すと使用済みになります。');return}
  if(sessionToken)await showSession();else showAccess('利用するには招待URLが必要です。');
}
$('claimInvite').onclick=async()=>{
  $('claimInvite').disabled=true;
  try{const claimed=await api('/v1/sample/claim',{method:'POST',body:{inviteToken:pendingInvite},authorized:false});pendingInvite=null;sessionToken=claimed.sessionToken;localStorage.setItem(KEY,sessionToken);await showSession()}
  catch(error){pendingInvite=null;showAccess(error.code===410?'この招待は使用済み、または期限切れです。':'招待を受け取れませんでした。')}
  finally{$('claimInvite').disabled=false}
};
$('restoreOwner').onclick=()=>{$('ownerPanel').hidden=false;$('ownerCode').readOnly=false;$('ownerCode').value='';$('ownerCode').focus();$('ownerMessage').textContent='Cloudflareへ登録済みの旧コードが手元にある場合、この欄へ貼り付けてください。';};
$('ownerCode').oninput=()=>{if($('ownerCode').readOnly)return;const code=$('ownerCode').value.trim();if(/^[a-f0-9]{64}$/.test(code)){localStorage.setItem(OWNER_KEY,code);$('ownerCode').readOnly=true;$('ownerSetup').hidden=true;$('ownerMessage').textContent='登録済みコードをこのブラウザに保存しました。';}};
$('ownerSetup').onclick=()=>{
  let code=localStorage.getItem(OWNER_KEY);
  if(!code){code=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');localStorage.setItem(OWNER_KEY,code)}
  $('ownerCode').value=code;$('ownerPanel').hidden=false;$('ownerSetup').hidden=true;$('ownerMessage').textContent='';status('このコードを専用Test Worker Secretへ登録してください。');
};
$('copyOwnerCode').onclick=async()=>{
  try{await navigator.clipboard.writeText($('ownerCode').value);status('Ownerコードをコピーしました。CloudflareのSecret欄だけへ貼ってください。')}
  catch{$('ownerCode').select();status('コピーできませんでした。選択されたコードをコピーしてください。')}
};
$('ownerClaim').onclick=async()=>{
  if(!/^[a-f0-9]{64}$/.test(localStorage.getItem(OWNER_KEY)||'')){$('ownerMessage').textContent='64文字の登録済みコードを貼り付けてください。';return}
  $('ownerClaim').disabled=true;$('ownerMessage').textContent='Owner Sessionを確認中…';
  try{
    const data=await api('/v1/sample/owner/claim',{method:'POST',body:{ownerCode:localStorage.getItem(OWNER_KEY)},authorized:false});
    sessionToken=data.sessionToken;localStorage.setItem(KEY,sessionToken);localStorage.removeItem(OWNER_KEY);$('ownerCode').value='';
    $('ownerClaim').hidden=true;$('ownerMessage').textContent='Owner Sessionを保存しました。';
    await showSession();
  }catch(error){
    const message=error.code===503?'CloudflareのSecret登録・反映を確認してください。':error.code===410?'初回Owner枠は使用済みです。':error.code===403?'現在この画面に表示されたコードとCloudflareへ登録したコードが一致しません。':error.code===400?'Ownerコードが正しい形式ではありません。':'通信に失敗しました。時間をおいてもう一度押してください。';
    $('ownerMessage').textContent=message;status(message);
  }finally{$('ownerClaim').disabled=false}
};
$('retrySession').onclick=()=>showSession();
$('homeButton').onclick=()=>showHome();
$('inviteFromHome').onclick=()=>{$('home').hidden=$('play').hidden=true;$('invitePanel').hidden=$('homeButton').hidden=false};
$('makeInvite').onclick=async()=>{
  $('makeInvite').disabled=true;
  try{const grant=await api('/v1/sample/invites',{method:'POST'});const url=new URL('index.html',location.href);url.hash='invite='+grant.inviteToken;invitationUrl=url.href;$('inviteLink').value=invitationUrl;$('shareArea').hidden=false;$('quota').textContent=`今日の招待は使用済みです。有効期限：${new Date(grant.expiresAt).toLocaleString('ja-JP')}`;status('招待URLを発行しました。')}
  catch(error){status(error.code===409?'今日の招待は使用済みです。':'招待を発行できませんでした。');if(error.code!==409)$('makeInvite').disabled=false}
};
$('share').onclick=async()=>{if(!invitationUrl)return;if(navigator.share){try{await navigator.share({title:'Blind Face Select 招待',url:invitationUrl});status('共有画面を開きました。')}catch(error){if(error.name!=='AbortError')status('共有できませんでした。リンクをコピーしてください。')}}else $('copy').click()};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(invitationUrl);status('招待URLをコピーしました。')}catch{const input=$('inviteLink');input.select();status('コピーできませんでした。表示されたURLを選択してコピーしてください。')}};
start();
