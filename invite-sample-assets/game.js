import {createSelection,nextQuestion,submitChoice,selectionAudit} from './selection-engine.js';

const ids=Array.from({length:55},(_,i)=>`sample-${String(i+1).padStart(2,'0')}`);
const keyPrefix='bfs-invite-game-v0.2-';
const phases={preliminary:'最初の選考',main:'次の選考',late:'候補を絞る',recovery:'候補を補う',boundary:'最後の確認',rank:'順位を決める'};
const position=id=>ids.indexOf(id)+1;
function avatar(id){
  const n=position(id),outer=document.createElement('div');outer.className='portrait';
  outer.style.setProperty('--tone',`${(n*47)%360}`);
  outer.style.setProperty('--hair',`${(n*83+40)%360}`);
  outer.style.setProperty('--shift',`${(n%5-2)*4}px`);
  outer.innerHTML='<div class="hair"></div><div class="head"><span class="eyes"></span><span class="mouth"></span></div><div class="shoulders"></div>';
  return outer;
}
export async function mountFixtureGame(host,sessionToken){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(sessionToken));
  const suffix=Array.from(new Uint8Array(digest)).slice(0,12).map(x=>x.toString(16).padStart(2,'0')).join('');
  const key=keyPrefix+suffix;
  let saved;try{saved=JSON.parse(localStorage.getItem(key)||'null')}catch{saved=null}
  let state=saved?.version===2&&saved?.poolVersion==='sample-55-v1'&&saved?.engine?.version===3?saved.engine:null;
  host.replaceChildren();
  const intro=document.createElement('div');intro.innerHTML='<h2>顔だけで選んでみる</h2><p>55人の架空候補から、好みのTOP9を選びます。名前や所属は選考中に表示しません。途中で閉じても、このブラウザで続きから再開できます。</p><button id="startGame">選考を始める</button>';
  const game=document.createElement('div');game.hidden=true;game.innerHTML='<h2 id="gamePhase"></h2><p id="gameProgress"></p><div id="gameFaces" class="game-faces"></div><p id="gameHint"></p><label class="uncertain"><input id="gameUncertain" type="checkbox">この比較は迷った</label><p><button id="gameNext" disabled>次へ進む</button></p>';
  const result=document.createElement('div');result.hidden=true;result.innerHTML='<h2>あなたのTOP9</h2><p id="gameSummary"></p><ol id="gameRanking" class="game-ranking"></ol><button id="gameAgain">もう一度選ぶ</button>';
  host.append(intro,game,result);
  const $=id=>host.querySelector('#'+id);
  const save=()=>localStorage.setItem(key,JSON.stringify({version:2,poolVersion:'sample-55-v1',engine:state}));
  const render=()=>{
    intro.hidden=!!state;game.hidden=true;result.hidden=true;
    if(!state)return;
    const q=nextQuestion(state);save();
    if(!q){result.hidden=false;const audit=selectionAudit(state);$('gameSummary').textContent=`${audit.screens}回の比較で選びました。結果はこのブラウザに保存されています。`;$('gameRanking').replaceChildren();for(const [rank,id] of state.ranking.entries()){const li=document.createElement('li');li.append(avatar(id));const label=document.createElement('span');label.textContent=`${rank+1}位｜架空候補 ${String(position(id)).padStart(2,'0')}`;li.append(label);$('gameRanking').append(li)}return}
    game.hidden=false;$('gamePhase').textContent=phases[q.phase];$('gameProgress').textContent=`${state.history.length+1}回目｜${q.ids.length}人から${q.max}人まで選択`;
    $('gameHint').textContent=q.max===1?'より好みの顔を1人選んでください。':`好みの顔を1〜${q.max}人選んでください。`;
    $('gameFaces').replaceChildren();$('gameUncertain').checked=false;
    const picks=new Set();
    for(const id of q.ids){const button=document.createElement('button');button.type='button';button.className='game-face';button.setAttribute('aria-label',`顔 ${position(id)}`);button.setAttribute('aria-pressed','false');button.append(avatar(id));button.onclick=()=>{if(picks.has(id))picks.delete(id);else if(picks.size<q.max)picks.add(id);for(const b of $('gameFaces').children)b.setAttribute('aria-pressed',String(picks.has(b.dataset.id)));$('gameNext').disabled=picks.size<q.min};button.dataset.id=id;$('gameFaces').append(button)}
    $('gameNext').disabled=true;$('gameNext').onclick=()=>{if(picks.size<q.min)return;submitChoice(state,[...picks],{uncertain:$('gameUncertain').checked});save();render()};
  };
  $('startGame').onclick=()=>{state=createSelection(ids,{lateSize:3,recheckMode:'baseline'});save();render()};
  $('gameAgain').onclick=()=>{state=createSelection(ids,{lateSize:3,recheckMode:'baseline'});save();render()};
  render();
}
