/* Phase 2 prototype: IDs and player choices only. No face scoring or identity lookup. */
export function createSelection(ids, {lateSize=3}={}) {
  if (!Array.isArray(ids) || ids.length<9 || ids.length>150 || new Set(ids).size!==ids.length)
    throw new Error('9〜150件の重複しない候補IDが必要です');
  if (lateSize!==3 && lateSize!==4) throw new Error('終盤の表示人数は3または4です');
  const order=[...ids];
  for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
  return {lateSize,phase:order.length<40?(order.length===9?'rank':'late'):'preliminary',pool:order.length<40?[...order]:[],remaining:order.length===9?[...order]:order.length<40?[]:[...order],advancing:[],rejected:[],history:[],finalists:order.length===9?[...order]:[],ranking:[],comparison:null,pending:null};
}

export function nextQuestion(s) {
  if (s.pending) return s.pending;
  if (s.phase==='complete') return null;
  if (s.phase==='rank') {
    if (!s.comparison) {
      if (!s.remaining.length) {s.phase='complete';return null}
      s.comparison={candidate:s.remaining.shift(),low:0,high:s.ranking.length};
    }
    const c=s.comparison;
    if (c.low===c.high) {s.ranking.splice(c.low,0,c.candidate);s.comparison=null;return nextQuestion(s)}
    return s.pending={phase:'rank',ids:[c.candidate,s.ranking[Math.floor((c.low+c.high)/2)]],min:1,max:1};
  }
  if (s.phase==='preliminary'||s.phase==='main') {
    if (!s.remaining.length) {finishRound(s);return nextQuestion(s)}
    const ids=s.remaining.slice(0,s.phase==='preliminary'?5:4);
    return s.pending={phase:s.phase,ids,min:1,max:Math.min(2,ids.length)};
  }
  if (s.phase==='late') {
    if (s.pool.length===9) {startRanking(s);return nextQuestion(s)}
    const ids=s.pool.slice(0,Math.min(s.lateSize,s.pool.length-8));
    return s.pending={phase:'late',ids,min:1,max:1};
  }
  if (s.phase==='recovery') {
    if (s.pool.length===9) {startRanking(s);return nextQuestion(s)}
    if (!s.remaining.length) throw new Error('候補不足');
    return s.pending={phase:'recovery',ids:s.remaining.slice(0,3),min:1,max:1};
  }
  throw new Error('不明な進行状態');
}

function finishRound(s) {
  s.pool=s.advancing;s.advancing=[];
  if (s.phase==='preliminary') {s.phase='main';s.remaining=[...s.pool]}
  else {s.phase=s.pool.length>9?'late':s.pool.length<9?'recovery':'rank';s.remaining=s.phase==='recovery'?[...s.rejected].reverse():[];if(s.phase==='rank')startRanking(s)}
}
function startRanking(s) {s.finalists=[...s.pool];s.phase='rank';s.remaining=[...s.pool];s.ranking=[]}

export function submitChoice(s,chosen) {
  const q=nextQuestion(s);
  if (!q||!Array.isArray(chosen)||chosen.length<q.min||chosen.length>q.max||new Set(chosen).size!==chosen.length||chosen.some(id=>!q.ids.includes(id))) throw new Error('選択内容が無効です');
  s.history.push({phase:q.phase,shown:[...q.ids],chosen:[...chosen]});
  if (q.phase==='rank') {
    const c=s.comparison,mid=Math.floor((c.low+c.high)/2);
    if (chosen[0]===c.candidate)c.high=mid;else c.low=mid+1;
  } else if (q.phase==='late') {
    s.pool.splice(0,q.ids.length);s.pool.push(chosen[0]);s.rejected.push(...q.ids.filter(id=>id!==chosen[0]));
  } else {
    s.remaining.splice(0,q.ids.length);
    if (q.phase==='recovery')s.pool.push(chosen[0]);else s.advancing.push(...chosen);
    s.rejected.push(...q.ids.filter(id=>!chosen.includes(id)));
  }
  s.pending=null;return nextQuestion(s);
}

export function selectionAudit(s) {
  const phases={};const seenLate=new Set();
  for(const h of s.history){phases[h.phase]=(phases[h.phase]||0)+1;if(h.phase==='late')h.shown.forEach(id=>seenLate.add(id))}
  return {screens:s.history.length,phases,finalistsWithoutLate:s.finalists.filter(id=>!seenLate.has(id)).length};
}
