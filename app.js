import {createSelection,nextQuestion,submitChoice,selectionAudit} from './selection-engine.js?v=2';
import {createRevealBoard} from './reveal-board.js?v=1';
import {provision,catalogRecord,validateMaster,distributionEndpoint,issueReadCapability,inspectCapability,SET_IDS} from './candidate-provision.js?v=2';
import {newPlayerUrl} from './share-play.js?v=1';
const $=id=>document.getElementById(id),KEY='blind-face-select-v2';
const phases={preliminary:'PRELIMINARY',main:'MAIN ROUND',late:'LATE ROUND',recovery:'BORDERLINE RECHECK',boundary:'TOP9 BORDERLINE',rank:'DIRECT COMPARISON'};
let db=read(),catalog=null,player=null,session=null,question=null,picks=new Set(),previous=null,resultBoard=null,sharedBoard=null;
function read(){try{const data=JSON.parse(localStorage.getItem(KEY));if(data&&Array.isArray(data.players)&&data.sessions){data.archive=data.archive||{};return data}}catch{}return {players:[],sessions:{},archive:{}}}
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function visible(id){for(const section of document.querySelectorAll('main>section'))section.hidden=section.id!==id;document.body.classList.toggle('in-result',id==='result'||id==='shared');window.scrollTo(0,0)}
function normalize(c){return {id:c.candidate_id||c.id,name:c.display_name||c.name,group:c.group||c.affiliation||'',officialCategory:c.official_category||c.officialCategory||'UNCLASSIFIED',imageUrl:c.image_source_url||c.imageUrl,sourceUrl:c.official_profile_url||c.sourceProfileUrl,imageStatus:c.image_status||'unverified'}}
const entryParams=new URLSearchParams(location.search),requestedSet=entryParams.get('set'),requestedVersion=entryParams.get('version'),requestedSetVersion=entryParams.get('setVersion');
// Fragment never reaches Pages/Worker; remove the one-time invite from visible history immediately.
let entryCapability=location.hash.startsWith('#invite=')?location.hash.slice(8):null,deliveryEndpoint=null,issuerCapability=null;
if(entryCapability){history.replaceState(null,'',location.pathname+location.search);if(!/^[A-Za-z0-9_.-]{20,4096}$/.test(entryCapability))entryCapability=null}
function configureCatalog(d){
  validateMaster(d);
  const candidates=d.candidate_master.map(normalize),sets=d.candidate_sets;
  if(requestedSetVersion&&SET_IDS.includes(requestedSet)&&sets[requestedSet]?.version!==requestedSetVersion)throw Error('共有結果の候補セットVersionが一致しません');
  catalog={version:d.master_version,candidates,sets};
  for(const [id,label] of [['STARTO_SELECT','STARTO SELECT'],['JUNIOR_SELECT','JUNIOR SELECT'],['ALL_SELECT','ALL SELECT']]){
    const opt=[...$('set').options].find(o=>o.value===id);
    opt.disabled=false;opt.textContent=`${label}（${sets[id].ids.length}人）`;
  }
  if(SET_IDS.includes(requestedSet))$('set').value=requestedSet;
  $('begin').disabled=false;
}
async function loadCatalog(){
  $('begin').disabled=true;$('retryCatalog').hidden=true;$('catalogMessage').textContent='候補データを確認中…';
  try{
    deliveryEndpoint=await distributionEndpoint();
    let grant=entryCapability;
    if(!grant)grant=await catalogRecord('get','issuerGrant');
    const {master,status}=await provision({endpoint:deliveryEndpoint,authorization:grant,requestedVersion});configureCatalog(master);
    if(grant){
      let claim=null;try{claim=await inspectCapability({endpoint:deliveryEndpoint,capability:grant})}catch{}
      if(claim?.scope==='issuer'&&claim.version===catalog.version){
        issuerCapability=grant;
        if(entryCapability===grant)await catalogRecord('put','issuerGrant',grant);
      }
    }
    entryCapability=null;
    $('catalogMessage').textContent=`${catalog.version}／${status==='cached'?'保存済みデータを使用':status==='restored'?'保存済みVersionを復元':'候補データを取得して保存'}。`;
  }catch(error){
    try{
      const existing=await catalogRecord('get','active');
      if(existing&&(!requestedVersion||existing.master_version===requestedVersion)){configureCatalog(existing);$('catalogMessage').textContent=`候補データの更新を確認できませんでした。保存済み ${catalog.version} を使用します。`;return}
    }catch{}
    $('catalogMessage').textContent='候補データを取得できませんでした。'+error.message;
    $('retryCatalog').hidden=false;
  }
}
$('retryCatalog').onclick=loadCatalog;
loadCatalog();
function refreshPlayers(){const select=$('playerList'),current=select.value;select.replaceChildren(new Option('新しいプレイヤー',''));for(const p of db.players)select.add(new Option(p.nickname||'名前なし',p.id));select.value=current;if(!select.value)select.value='';select.onchange=()=>{const p=db.players.find(x=>x.id===select.value),latest=p&&db.sessions[p.id];$('nickname').value=p?.nickname||'';$('age').value=p?.age||'';$('nickname').disabled=!!p;$('age').disabled=!!p;$('resume').hidden=!latest||latest.state.phase==='complete';$('past').hidden=!latest||latest.state.phase!=='complete';const history=p?(db.archive[p.id]||[]):[];const list=$('historyList');list.replaceChildren();history.forEach((s,i)=>list.add(new Option(`${new Date(s.completedAt||s.createdAt).toLocaleDateString('ja-JP')}／${s.setId||s.setVersion} × ${s.visualMode||'NORMAL'}／${s.state.phase==='complete'?'完了':'途中'}`,String(i))));$('historyWrap').hidden=$('historyOpen').hidden=history.length===0};select.onchange()}
function selectedPlayer(){const id=$('playerList').value;if(id)return db.players.find(p=>p.id===id);const p={id:crypto.randomUUID(),nickname:$('nickname').value.trim(),age:$('age').value,createdAt:new Date().toISOString()};db.players.push(p);$('playerList').value=p.id;return p}
function persist(){session.updatedAt=new Date().toISOString();db.sessions[player.id]=session;save()}
function candidateRecords(){return session.selectionSnapshot?.candidates||session.candidates}
function begin(){
  const setId=$('set').value;
  if(!SET_IDS.includes(setId)||!catalog?.sets?.[setId]||$('set').selectedOptions[0].disabled){$('catalogMessage').textContent='候補データを取得できませんでした。再読み込みしてください。';$('retryCatalog').hidden=false;return}
  player=selectedPlayer();const old=db.sessions[player.id];if(old){db.archive[player.id]=db.archive[player.id]||[];db.archive[player.id].unshift(old)}
  const set=catalog.sets[setId],byId=new Map(catalog.candidates.map(c=>[c.id,c])),candidates=set.ids.map(id=>({...byId.get(id)}));
  const createdAt=new Date().toISOString(),setVersion=set.version,visualMode='NORMAL';
  session={playerId:player.id,setId,setVersion,masterVersion:catalog.version,visualMode,type:'catalog',selectionSnapshot:{capturedAt:createdAt,setId,setVersion,visualMode,candidates},state:createSelection(candidates.map(c=>c.id),{lateSize:candidates.length>200?4:3}),createdAt,completedAt:null};previous=null;persist();renderQuestion()
}
function resume(){player=db.players.find(p=>p.id===$('playerList').value);session=db.sessions[player.id];previous=null;if(session.state.phase==='complete')showResult({instant:true});else renderQuestion()}
function blindMap(){const ids=candidateRecords().map(c=>c.id);return new Map(ids.map((id,i)=>[id,'FACE '+String(i+1).padStart(3,'0')]))}
function renderQuestion(){question=nextQuestion(session.state);picks=new Set();if(!question){session.completedAt=session.completedAt||new Date().toISOString();persist();showResult();return}persist();visible('game');$('phase').textContent=phases[question.phase];$('instruction').textContent=question.phase==='rank'||question.phase==='boundary'?'より好みの顔を1人選択':`${question.ids.length}人から${question.max}人まで選択`;$('progress').textContent=`${session.state.history.length+1}画面目｜最大${question.max}人`;$('uncertain').checked=false;$('faces').replaceChildren();const byId=new Map(candidateRecords().map(c=>[c.id,c])),labels=blindMap();let loading=0;const canAdvance=()=>picks.size>=question.min&&loading===0&&![...$('faces').children].some(el=>el.disabled);for(const [position,id] of question.ids.entries()){const c=byId.get(id),b=document.createElement('button');b.className='face';b.type='button';b.dataset.id=id;b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','顔画像 '+(position+1));if(c?.imageUrl){loading++;const img=document.createElement('img');img.alt='';img.onload=()=>{loading--;$('next').disabled=!canAdvance()};img.onerror=()=>{loading--;b.disabled=true;b.replaceChildren(document.createTextNode('画像を表示できません'));$('gameStatus').textContent='表示できない写真があります。選考を中断し、カタログの画像URLを確認してください。';$('next').disabled=true};img.src=c.imageUrl;b.append(img)}else b.textContent=labels.get(id);b.onclick=()=>{if(b.disabled)return;if(picks.has(id))picks.delete(id);else if(picks.size<question.max)picks.add(id);for(const el of $('faces').children)el.setAttribute('aria-pressed',String(picks.has(el.dataset.id)));$('next').disabled=!canAdvance();$('gameStatus').textContent=`${picks.size}人を選択中`};$('faces').append(b)}$('gameStatus').textContent=loading?'画像を読み込み中…':'0人を選択中';$('next').disabled=true;$('undo').disabled=!previous}
function https(value){try{return new URL(value).protocol==='https:'}catch{return false}}
function card(c,rank){const box=document.createElement('article');box.className='rank';const title=document.createElement('strong');title.textContent=rank+'位';box.append(title);if(https(c?.imageUrl)){const image=document.createElement('img');image.src=c.imageUrl;image.alt='';image.onerror=()=>image.replaceWith(Object.assign(document.createElement('div'),{className:'placeholder',textContent:'画像を表示できません'}));box.append(image)}else{const dummy=document.createElement('div');dummy.className='placeholder';dummy.textContent='画像なし';box.append(dummy)}const name=document.createElement('h3');name.textContent=c?.name||'架空候補';box.append(name);const group=document.createElement('p');group.textContent=[c?.officialCategory==='JUNIOR'?'当時：ジュニア':c?.officialCategory==='STARTO'?'当時：STARTO':'',c?.group].filter(Boolean).join('／');box.append(group);if(https(c?.sourceUrl)){const a=document.createElement('a');a.href=c.sourceUrl;a.target='_blank';a.rel='noopener noreferrer';a.textContent='公式Source';box.append(a)}return box}
function openDetail(rank,c){const dialog=$('detail');$('detailBody').replaceChildren(card(c,rank));dialog.showModal()}
function mountResultBoard({instant=false}={}){
  resultBoard?.stop();$('analysis').hidden=true;$('replay').hidden=true;$('reveal').hidden=instant;
  $('revealStatus').textContent=instant?'保存済み結果':'9位から1位へ公開します';
  const byId=new Map(candidateRecords().map(c=>[c.id,c]));
  const ordered=session.state.ranking.map(id=>byId.get(id));
  resultBoard=createRevealBoard($('ranking'),ordered,{
    onDetail:openDetail,
    onProgress:(rank)=>{$('revealStatus').textContent=`${rank}位を公開`},
    onComplete:()=>{$('revealStatus').textContent='TOP9 Reveal 完了';$('reveal').hidden=true;$('replay').hidden=false;$('analysis').hidden=false;renderAnalysis()}
  });
  if(instant)resultBoard.showAll();else{$('reveal').textContent='Revealをスキップ';resultBoard.play()}
}
function showResult({instant=false}={}){visible('result');$('resultInfo').textContent=`${session.setId||'旧カタログ'} × ${session.visualMode||'NORMAL'}／${candidateRecords().length}候補／${session.state.history.length}画面／選考開始 ${new Date(session.createdAt).toLocaleString('ja-JP')}`;mountResultBoard({instant})}
function renderAnalysis(){const audit=selectionAudit(session.state),byId=new Map(candidateRecords().map(c=>[c.id,c]));const host=$('analysisBody');host.replaceChildren();const overview=document.createElement('p');overview.textContent=`選択画面：${audit.screens}／迷った比較：${audit.uncertainComparisons}／境界再比較：${audit.borderlineComparisons}。集計は選択行動だけを示し、顔の特徴を自動推定しません。`;host.append(overview);const table=document.createElement('table');table.className='stats';const head=document.createElement('tr');for(const label of ['順位','候補','選択','非選択','再登場','経路']){const th=document.createElement('th');th.textContent=label;head.append(th)}table.append(head);for(const [i,id] of session.state.ranking.entries()){const shown=session.state.history.filter(h=>h.shown.includes(id));const wins=shown.filter(h=>h.chosen.includes(id)).length;const tr=document.createElement('tr');for(const value of [i+1,byId.get(id)?.name||'架空候補',wins,shown.length-wins,Math.max(0,shown.length-1),[...new Set(shown.map(h=>phases[h.phase]))].join(' → ')]){const td=document.createElement('td');td.textContent=value;tr.append(td)}table.append(tr)}host.append(table);const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent='全比較履歴を表示';details.append(summary);const list=document.createElement('ol');for(const h of session.state.history){const li=document.createElement('li');li.textContent=`${phases[h.phase]}：表示 ${h.shown.map(id=>byId.get(id)?.name||id).join('／')} → 選択 ${h.chosen.map(id=>byId.get(id)?.name||id).join('／')}${h.uncertain?'（迷った）':''}`;list.append(li)}details.append(list);host.append(details)}
function encode(data){const bytes=new TextEncoder().encode(JSON.stringify(data));let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')}
function decode(s){const bytes=Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));return JSON.parse(new TextDecoder().decode(bytes))}
function shared(){
  if(!location.hash.startsWith('#share='))return false;
  visible('shared');$('sharedRanking').replaceChildren();$('sharedSkip').hidden=true;$('sharedReplay').hidden=true;$('selfSelect').hidden=true;
  try{
    const data=decode(location.hash.slice(7));
    if(!Number.isFinite(data.expiresAt)||Date.now()>data.expiresAt){$('sharedStatus').textContent='この共有リンクの有効期限は終了しました。';return true}
    if(!Array.isArray(data.ranking)||data.ranking.length!==9)throw Error('invalid');
    $('selfSelect').href=newPlayerUrl(data,location.href);
    $('sharedStatus').textContent=`有効期限：${new Date(data.expiresAt).toLocaleString('ja-JP')}／候補セット：${data.version}`;
    const seenKey='bfs-shared-seen-'+location.hash.length+'-'+[...location.hash].reduce((h,c)=>(Math.imul(h,33)^c.charCodeAt(0))>>>0,5381);
    let seen=false;try{seen=sessionStorage.getItem(seenKey)==='1'}catch{}
    const launch=(instant=false)=>{
      sharedBoard?.stop();$('sharedRanking').replaceChildren();$('sharedReplay').hidden=true;$('selfSelect').hidden=true;$('sharedSkip').hidden=instant;
      sharedBoard=createRevealBoard($('sharedRanking'),data.ranking,{onDetail:openDetail,onComplete:()=>{
        $('sharedSkip').hidden=true;$('sharedReplay').hidden=false;$('selfSelect').hidden=false;
        try{sessionStorage.setItem(seenKey,'1')}catch{}
      }});
      if(instant)sharedBoard.showAll();else sharedBoard.play();
    };
    $('sharedSkip').onclick=()=>sharedBoard?.skip();$('sharedReplay').onclick=()=>launch(false);
    launch(seen);
  }catch{$('sharedStatus').textContent='共有URLを読み取れませんでした。'}
  return true;
}
$('begin').onclick=begin;$('resume').onclick=resume;$('past').onclick=resume;$('next').onclick=()=>{if(picks.size<question.min||[...$('faces').children].some(el=>el.disabled))return;previous=JSON.stringify(session.state);submitChoice(session.state,[...picks],{uncertain:$('uncertain').checked});persist();renderQuestion()};$('undo').onclick=()=>{if(previous){session.state=JSON.parse(previous);previous=null;persist();renderQuestion()}};$('leave').onclick=()=>{persist();refreshPlayers();$('playerList').value=player.id;$('playerList').onchange();visible('setup')};$('reveal').onclick=()=>resultBoard?.skip();$('replay').onclick=()=>mountResultBoard();$('detailClose').onclick=()=>$('detail').close();$('resultHome').onclick=()=>{resultBoard?.stop();refreshPlayers();$('playerList').value=player.id;$('playerList').onchange();visible('setup')};$('expiry').onchange=()=>$('customWrap').hidden=$('expiry').value!=='custom';$('makeShare').onclick=async()=>{const hours=$('expiry').value==='custom'?Number($('customHours').value):Number($('expiry').value);if(!Number.isFinite(hours)||hours<1||hours>168){$('shareStatus').textContent='1〜168時間で指定してください。';return}const expiresAt=Date.now()+hours*3600000;$('makeShare').disabled=true;$('shareLink').hidden=true;$('shareStatus').textContent='共有リンクを準備中…';try{const provisionCapability=await issueReadCapability({endpoint:deliveryEndpoint,issuer:issuerCapability,version:session.masterVersion,expiresAt});const byId=new Map(candidateRecords().map(c=>[c.id,c]));const ranking=session.state.ranking.map(id=>{const c=byId.get(id);return {name:c.name,group:c.group,officialCategory:c.officialCategory,imageUrl:c.imageUrl,sourceUrl:c.sourceUrl}});const url=new URL(location.href);url.search='';url.hash='share='+encode({expiresAt,version:session.setVersion,masterVersion:session.masterVersion,setId:session.setId,visualMode:session.visualMode,selectedAt:session.createdAt,ranking,provisionCapability});$('shareLink').value=url.href;$('shareLink').hidden=false;$('shareStatus').textContent='共有URLを作成しました。コピーして送れます。'}catch(error){$('shareStatus').textContent=error.message}finally{$('makeShare').disabled=false}};
$('historyOpen').onclick=()=>{player=db.players.find(p=>p.id===$('playerList').value);const a=db.archive[player.id],i=Number($('historyList').value),chosen=a.splice(i,1)[0];if(!chosen)return;const current=db.sessions[player.id];if(current)a.unshift(current);db.sessions[player.id]=chosen;session=chosen;save();previous=null;if(session.state.phase==='complete')showResult({instant:true});else renderQuestion()};
refreshPlayers();if(!shared())visible('setup');
