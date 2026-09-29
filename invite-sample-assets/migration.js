import {privateRecord,SETS,validateOwnerMaster} from './owner-master.js';
const PROD_ORIGIN='https://blind-face-select-prod-v01.nyannko619xxx.workers.dev';
const token=localStorage.getItem('bfs-invite-sample-session-v0.1');
const nonce=new URL(location.href).searchParams.get('nonce'),button=document.getElementById('transfer'),message=document.getElementById('message');
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
let begun=false,waiting=false;
if(!window.opener||!/^[a-f0-9]{32}$/.test(nonce||'')||!/^[a-f0-9]{64}$/.test(token||''))message.textContent='元の利用画面から引き継ぎを開始してください。';
else{
  try{
    const r=await fetch('/v1/sample/session',{headers:{Authorization:'Bearer '+token},cache:'no-store',referrerPolicy:'no-referrer'});
    const session=await r.json();
    if(!r.ok||session.owner!==true)throw Error('以前のOwner利用状態を確認できません。');
    window.opener.postMessage({type:'bfs-migration-ready',nonce},PROD_ORIGIN);
    message.textContent='新しい画面との接続を確認しています…';
  }catch(error){message.textContent=error.message}
}
window.addEventListener('message',event=>{
  if(event.origin!==PROD_ORIGIN||event.source!==window.opener||event.data?.nonce!==nonce)return;
  if(event.data.type==='bfs-migration-begin'){begun=true;button.disabled=false;message.textContent='この端末の保存結果を新しい画面へ引き継ぎます。'}
  if(event.data.type==='bfs-migration-ack'){waiting=false;button.disabled=true;message.textContent='引き継ぎが完了しました。新しい画面で結果を確認してください。'}
  if(event.data.type==='bfs-migration-error'){waiting=false;button.disabled=false;message.textContent='引き継ぎを完了できませんでした。元のデータは残っています。もう一度お試しください。'}
});
button.onclick=async()=>{
  if(!begun||waiting)return;waiting=true;button.disabled=true;message.textContent='引き継いでいます…';
  try{
    const master=validateOwnerMaster(await privateRecord('get','owner-master:2026-09-28'));
    const hash=await digest(token),progress={};
    for(const setId of Object.keys(SETS)){
      const key='owner-progress:'+hash+(setId==='STARTO_SELECT'?'':':'+setId);
      progress[setId]=await privateRecord('get',key)||null;
    }
    const r=await fetch(PROD_ORIGIN+'/v1/owner/migrate',{method:'POST',headers:{Authorization:'Bearer '+token},cache:'no-store',referrerPolicy:'no-referrer'});
    const result=await r.json();if(!r.ok||!/^[a-f0-9]{64}$/.test(result.sessionToken||''))throw Error('新しい利用状態を作成できませんでした。');
    window.opener.postMessage({type:'bfs-migration-data',nonce,sessionToken:result.sessionToken,master,progress},PROD_ORIGIN);
    message.textContent='新しい画面で保存内容を確認しています…';
  }catch(error){waiting=false;button.disabled=false;message.textContent=error.message||'引き継ぎに失敗しました。'}
};
