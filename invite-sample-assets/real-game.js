// Owner-only technical test. No catalog or choices are sent to the Worker.
import {createSelection,nextQuestion,submitChoice,selectionAudit} from './selection-engine.js';
import {privateRecord,readOwnerFile,candidateSnapshot,SETS} from './owner-master.js';
import {createRevealBoard} from './reveal-board.js?v=tap-reveal-01';
const phases={preliminary:'最初の選考',main:'次の選考',late:'候補を絞る',recovery:'候補を補う',boundary:'最後の確認',rank:'順位を決める'};
const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
const digest=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
export async function mountOwnerRealGame(host,sessionToken,{setId='STARTO_SELECT'}={}){
  const set=SETS[setId];if(!set)throw Error('候補セットが正しくありません。');
  // Preserve the existing STARTO key so the first real iPad session resumes unchanged.
  const key='owner-progress:'+await digest(sessionToken)+(setId==='STARTO_SELECT'?'':':'+setId),catalogKey='owner-master:2026-09-28';
  let master=await privateRecord('get',catalogKey),saved=await privateRecord('get',key),board;
  host.replaceChildren();
  const heading=node('h2','', set.title+' SELECT');
  const note=node('p','', `${set.count}人の顔を見てTOP9を選びます。途中で閉じても、この端末で続きから再開できます。`);
  const setup=node('div','owner-setup'),input=node('input'),setupStatus=node('p','owner-message');
  input.type='file';input.accept='application/json,.json';input.setAttribute('aria-label','候補データをこの端末に読み込む');
  const setupHelp=node('p','', '初回のみ、この端末に保存した候補ファイルを選んでください。ファイルはこの端末内で読み取り、外部へ送信しません。');
  setup.append(setupHelp,input,setupStatus);
  const intro=node('div','owner-intro'),start=node('button','', '選考を始める');intro.append(note,start);
  const game=node('div','owner-selection'),phase=node('h3'),progress=node('p'),faces=node('div','game-faces'),hint=node('p'),uncertainLabel=node('label','uncertain'),uncertain=node('input'),next=node('button','', '次へ進む');
  uncertain.type='checkbox';uncertainLabel.append(uncertain,document.createTextNode('この比較は迷った'));
  game.append(phase,progress,faces,hint,uncertainLabel,next);
  const result=node('div','owner-result'),summary=node('p'),revealHint=node('p','reveal-hint'),ranking=node('div','ranking board'),actions=node('div','board-actions'),again=node('button','', '新しく選び直す'),replay=node('button','', 'もう一度Reveal');
  actions.append(replay,again);result.append(node('h2','', 'あなたのTOP9'),summary,revealHint,ranking,actions);
  const detail=node('dialog'),close=node('button','', '閉じる'),detailBody=node('div');detail.append(close,detailBody);close.onclick=()=>detail.close();
  host.append(heading,setup,intro,game,result,detail);
  let state=saved?.setVersion===set.version&&saved.engine?.version===3?saved.engine:null;
  let frozen=state&&saved.snapshot?.setVersion===set.version&&saved.snapshot.candidates?.length===set.count?saved.snapshot:null;
  if(state&&!frozen){state=null;saved=null}
  let startedAt=saved?.startedAt||null,completedAt=saved?.completedAt||null;
  // Completed results from the prior auto-Reveal version remain immediately viewable.
  let revealCount=Number.isInteger(saved?.revealCount)?saved.revealCount:(completedAt?9:0);
  let revealWrite=Promise.resolve();
  const records=()=>new Map(frozen.candidates.map(c=>[c.candidate_id,c]));
  const save=async()=>privateRecord('put',key,{setId,setVersion:set.version,startedAt,completedAt:state.phase==='complete'?completedAt:null,revealCount,snapshot:frozen,engine:state});
  const render=async()=>{
    if(board){board.stop();board=null}
    setup.hidden=!!master||!!state;intro.hidden=game.hidden=result.hidden=true;
    if(!state){if(master)intro.hidden=false;return}
    const q=nextQuestion(state);await save();
    if(!q){
      result.hidden=false;const audit=selectionAudit(state);summary.textContent=`${audit.screens}回の比較で選びました。結果はこの端末に保存されています。`;
      const byId=records(),ordered=state.ranking.map(id=>{const c=byId.get(id);return {name:c.display_name,imageUrl:c.image_source_url,candidate:c}});
      board=createRevealBoard(ranking,ordered,{onProgress:rank=>{
        revealCount=10-rank;revealHint.textContent=rank===1?'TOP9をすべて公開しました。':`次は${rank-1}位をタッチして公開`;
        revealWrite=revealWrite.then(save);
        return revealWrite.catch(error=>{revealHint.textContent='結果を保存できませんでした。ページを再読み込みしてください。';throw error});
      },onComplete:()=>{actions.hidden=false;revealHint.textContent='TOP9をすべて公開しました。'},onDetail:(rank,item)=>{
        const c=item.candidate;detailBody.replaceChildren(node('h3','',`${rank}位 ${c.display_name}`),node('p','',c.group||c.current_affiliation||'所属情報なし'));
        const img=node('img');img.src=c.image_source_url;img.alt='';img.className='detail-photo';detailBody.append(img);
        const link=node('a','', '公式プロフィール');link.href=c.official_profile_url;link.target='_blank';link.rel='noopener noreferrer';detailBody.append(link);detail.showModal();
      }});
      actions.hidden=revealCount<9;
      if(revealCount===9){board.showAll();revealHint.textContent='TOP9をすべて公開しました。'}
      else{board.startManual(revealCount);revealHint.textContent=`${9-revealCount}位をタッチして公開`}
      // The completed ranking is saved independently of the player's reveal progress.
      completedAt ||= new Date().toISOString();await save();return;
    }
    game.hidden=false;phase.textContent=phases[q.phase];progress.textContent=`${state.history.length+1}回目｜${q.ids.length}人から${q.max}人まで選択`;
    hint.textContent=q.max===1?'より好みの顔を1人選んでください。':`好みの顔を1〜${q.max}人選んでください。`;
    for(const old of faces.querySelectorAll('img'))old.onerror=old.onload=null;
    faces.replaceChildren();uncertain.checked=false;next.disabled=true;const picks=new Set(),byId=records();
    for(const [index,id] of q.ids.entries()){
      const c=byId.get(id);if(!c)throw Error('保存した候補を確認できません。');
      const button=node('button','game-face');button.type='button';button.disabled=true;button.setAttribute('aria-label',`顔 ${index+1}`);button.setAttribute('aria-pressed','false');
      const img=node('img','real-portrait');img.alt='';img.loading='eager';img.referrerPolicy='no-referrer';
      img.onload=()=>{button.disabled=false;if(picks.size>=q.min&&!faces.querySelector('.game-face:disabled'))next.disabled=false};
      img.onerror=()=>{button.disabled=true;button.classList.add('image-error');hint.replaceChildren(document.createTextNode('画像を読み込めませんでした。通信状態を確認してください。'));const reload=node('button','', '再読み込み');reload.onclick=()=>location.reload();hint.append(reload);next.disabled=true};
      button.append(img);button.onclick=()=>{if(picks.has(id))picks.delete(id);else if(picks.size<q.max)picks.add(id);for(const b of faces.children)b.setAttribute('aria-pressed',String(picks.has(b._candidateId)));next.disabled=picks.size<q.min||!!faces.querySelector('.game-face:disabled')};
      button._candidateId=id;faces.append(button);img.src=c.image_source_url;
    }
    next.onclick=async()=>{if(picks.size<q.min||faces.querySelector('.game-face:disabled'))return;next.disabled=true;submitChoice(state,[...picks],{uncertain:uncertain.checked});await save();await render()};
  };
  input.onchange=async()=>{try{const candidate=await readOwnerFile(input.files?.[0]);await privateRecord('put',catalogKey,candidate);master=candidate;setupStatus.textContent='候補データをこの端末に保存しました。';await render()}catch(error){setupStatus.textContent=error.message}finally{input.value=''}};
  start.onclick=async()=>{if(!master)return;frozen=candidateSnapshot(master,setId);state=createSelection(frozen.candidates.map(c=>c.candidate_id),{lateSize:3,recheckMode:'baseline'});startedAt=new Date().toISOString();completedAt=null;revealCount=0;await save();await render()};
  again.onclick=async()=>{if(!master){setup.hidden=false;return}frozen=candidateSnapshot(master,setId);state=createSelection(frozen.candidates.map(c=>c.candidate_id),{lateSize:3,recheckMode:'baseline'});startedAt=new Date().toISOString();completedAt=null;revealCount=0;await save();await render()};
  replay.onclick=async()=>{revealCount=0;await save();await render()};
  await render();
}
