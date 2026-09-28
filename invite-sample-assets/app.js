const $=id=>document.getElementById(id),KEY='bfs-invite-sample-session-v0.1',OWNER_KEY='bfs-invite-sample-owner-code-v0.1';
const endpoint=new URL(location.href).origin;
let sessionToken=localStorage.getItem(KEY),invitationUrl='',pendingInvite=null;
const status=s=>$('status').textContent=s;
async function api(path,{method='GET',body,authorized=true}={}){
  const headers={'Content-Type':'application/json'};if(authorized&&sessionToken)headers.Authorization='Bearer '+sessionToken;
  const result=await fetch(endpoint+path,{method,headers,body:body?JSON.stringify(body):undefined,cache:'no-store',referrerPolicy:'no-referrer'});
  const json=await result.json();if(!result.ok)throw Object.assign(Error(json.error||'request_failed'),{code:result.status});return json;
}
function showAccess(message){$('access').hidden=false;$('play').hidden=$('invitePanel').hidden=true;status(message);$('claimInvite').hidden=!pendingInvite;$('ownerSetup').hidden=!!pendingInvite;$('ownerPanel').hidden=!!pendingInvite||!sessionStorage.getItem(OWNER_KEY);if(!$('ownerPanel').hidden)$('ownerCode').value=sessionStorage.getItem(OWNER_KEY);$('devOwner').hidden=!['localhost','127.0.0.1'].includes(location.hostname);$('accessHelp').textContent=$('devOwner').hidden?'招待URLを受け取るか、初回Owner設定を行ってください。':'ローカル試験ではOwnerを発行できます。'}
async function showSession(){
  try{
    const [me,fixture]=await Promise.all([api('/v1/sample/session'),api('/v1/sample/fixture')]);
    $('access').hidden=$('ownerPanel').hidden=true;$('play').hidden=$('invitePanel').hidden=false;
    $('quota').textContent=`JST ${me.jstDay}：${me.inviteAvailable?'本日の招待枠あり':'本日の招待枠を使用済み'}。Session期限 ${new Date(me.expiresAt).toLocaleString('ja-JP')}`;
    $('makeInvite').disabled=!me.inviteAvailable;
    $('cards').replaceChildren();const selected=new Set();
    for(const label of fixture.cards){const card=document.createElement('button');card.type='button';card.className='card';card.textContent=label;card.setAttribute('aria-pressed','false');card.onclick=()=>{if(selected.has(label))selected.delete(label);else if(selected.size<2)selected.add(label);for(const b of $('cards').children)b.setAttribute('aria-pressed',String(selected.has(b.textContent)));$('choice').textContent=`${selected.size}人選択中`};$('cards').append(card)}
    status('匿名Sessionでfixtureを取得できました。');
  }catch(error){sessionToken=null;localStorage.removeItem(KEY);showAccess(error.code===401?'Sessionが無効または期限切れです。':'接続できませんでした。')}
}
async function start(){
  const fragment=location.hash;history.replaceState(null,'',location.pathname+location.search);
  if(fragment.startsWith('#session=')){sessionToken=fragment.slice(9);localStorage.setItem(KEY,sessionToken)}
  if(fragment.startsWith('#invite=')){pendingInvite=fragment.slice(8);showAccess('招待URLを開きました。「招待を受け取る」を押すと使用済みになります。');return}
  if(sessionToken)await showSession();else showAccess('招待URLが必要です。');
}
$('claimInvite').onclick=async()=>{
  $('claimInvite').disabled=true;
  try{const claimed=await api('/v1/sample/claim',{method:'POST',body:{inviteToken:pendingInvite},authorized:false});pendingInvite=null;sessionToken=claimed.sessionToken;localStorage.setItem(KEY,sessionToken);await showSession()}
  catch(error){pendingInvite=null;showAccess(error.code===410?'この招待は使用済み、または期限切れです。':'招待を受け取れませんでした。')}
  finally{$('claimInvite').disabled=false}
};
$('ownerSetup').onclick=()=>{
  let code=sessionStorage.getItem(OWNER_KEY);
  if(!code){code=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');sessionStorage.setItem(OWNER_KEY,code)}
  $('ownerCode').value=code;$('ownerPanel').hidden=false;status('このコードを専用Test Worker Secretへ登録してください。');
};
$('copyOwnerCode').onclick=async()=>{
  try{await navigator.clipboard.writeText($('ownerCode').value);status('Ownerコードをコピーしました。CloudflareのSecret欄だけへ貼ってください。')}
  catch{$('ownerCode').select();status('コピーできませんでした。選択されたコードをコピーしてください。')}
};
$('ownerClaim').onclick=async()=>{
  $('ownerClaim').disabled=true;
  try{const data=await api('/v1/sample/owner/claim',{method:'POST',body:{ownerCode:sessionStorage.getItem(OWNER_KEY)},authorized:false});sessionToken=data.sessionToken;localStorage.setItem(KEY,sessionToken);sessionStorage.removeItem(OWNER_KEY);$('ownerCode').value='';await showSession()}
  catch(error){status(error.code===503?'CloudflareのSecret登録・反映を確認してください。':error.code===410?'初回Owner枠は使用済みです。':error.code===403?'登録したコードが一致しません。':'Owner開始に失敗しました。')}
  finally{$('ownerClaim').disabled=false}
};
$('makeInvite').onclick=async()=>{
  $('makeInvite').disabled=true;
  try{const grant=await api('/v1/sample/invites',{method:'POST'});const url=new URL('index.html',location.href);url.hash='invite='+grant.inviteToken;invitationUrl=url.href;$('inviteLink').value=invitationUrl;$('shareArea').hidden=false;$('quota').textContent=`JST ${grant.jstDay}の枠を使用済み。招待期限 ${new Date(grant.expiresAt).toLocaleString('ja-JP')}`;status('招待URLを発行しました。')}
  catch(error){status(error.code===409?'本日の招待枠は使用済みです。':'招待を発行できませんでした。');if(error.code!==409)$('makeInvite').disabled=false}
};
$('share').onclick=async()=>{if(!invitationUrl)return;if(navigator.share){try{await navigator.share({title:'Blind Face Select 招待',url:invitationUrl});status('共有画面を開きました。')}catch(error){if(error.name!=='AbortError')status('共有できませんでした。リンクをコピーしてください。')}}else $('copy').click()};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(invitationUrl);status('招待URLをコピーしました。')}catch{const input=$('inviteLink');input.select();status('コピーできませんでした。表示されたURLを選択してコピーしてください。')}};
start();
