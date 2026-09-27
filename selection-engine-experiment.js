/* Phase 2 prototype: IDs and player choices only. No face scoring or identity lookup. */
export function createSelection(ids, {lateSize=3,seed,recheckMode='baseline',preliminaryMode='two'}={}) {
  if (!Array.isArray(ids) || ids.length<9 || ids.length>300 || new Set(ids).size!==ids.length)
    throw new Error('9〜300件の重複しない候補IDが必要です');
  if (lateSize!==3 && lateSize!==4) throw new Error('終盤の表示人数は3または4です');
  if (!['baseline','secondChance','declared'].includes(recheckMode)) throw new Error('再比較方式が無効です');
  if (!['two','rescue','three','hybrid','threeHybrid'].includes(preliminaryMode)) throw new Error('予選方式が無効です');
  const order=[...ids];
  let rng=Number(seed)>>>0;const random=seed===undefined?Math.random:()=>((rng=(Math.imul(1664525,rng)+1013904223)>>>0)/4294967296);
  for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]]}
  return {version:4,preliminaryMode,recheckMode,lateSize,phase:order.length<40?(order.length===9?'rank':'late'):'preliminary',pool:order.length<40?[...order]:[],remaining:order.length===9?[...order]:order.length<40?[]:[...order],advancing:[],rejected:[],history:[],prelimGroups:[],prelimSurvivors:[],mainSurvivors:[],rescueEntrants:[],finalists:order.length===9?[...order]:[],ranking:[],comparison:null,pending:null,boundaryCount:0,boundaryUsed:[],recheckQueue:[],originalCount:ids.length};
}

function support(s,id){let wins=0,losses=0,uncertain=0;for(const h of s.history)if(h.shown.includes(id)){if(h.chosen.includes(id))wins++;else losses++;if(h.uncertain)uncertain++}return {wins,losses,uncertain}}
function enterBoundary(s){if(s.originalCount<40){startRanking(s);return}s.phase='boundary';s.boundaryCount=0;s.boundaryUsed=[];
  const rejected=[...new Set(s.rejected)].filter(id=>!s.pool.includes(id));
  if(s.recheckMode==='declared'){
    // A declaration attaches to the comparison, including the candidate omitted at an early cut.
    // No declaration means no extra screens. Cap the queue to avoid repeatedly showing one face.
    s.recheckQueue=rejected.filter(id=>s.history.some(h=>h.uncertain&&h.shown.includes(id)))
      .sort((a,b)=>support(s,b).uncertain-support(s,a).uncertain||support(s,b).wins-support(s,a).wins)
      .slice(0,Math.min(12,Math.ceil(s.originalCount/12)));
  }else if(s.recheckMode==='secondChance'){
    s.recheckQueue=rejected.filter(id=>s.history.some(h=>h.phase==='preliminary'&&h.shown.includes(id)))
      .sort((a,b)=>support(s,b).wins-support(s,a).wins||support(s,a).losses-support(s,b).losses)
      .slice(0,Math.min(32,Math.ceil(s.originalCount/4)));
  }else s.recheckQueue=[];
}
function boundaryPair(s){
  const used=new Set(s.boundaryUsed),inPool=new Set(s.pool);
  const challengers=[...new Set(s.rejected)].filter(id=>!inPool.has(id)&&!used.has(id)&&support(s,id).wins>0);
  challengers.sort((a,b)=>{const A=support(s,a),B=support(s,b);return (B.wins+B.uncertain)-(A.wins+A.uncertain)||A.losses-B.losses});
  const finalists=s.pool.filter(id=>!used.has(id));
  finalists.sort((a,b)=>{const A=support(s,a),B=support(s,b);return (A.wins-A.losses)-(B.wins-B.losses)||B.uncertain-A.uncertain});
  return challengers.length&&finalists.length?[finalists[0],challengers[0]]:null;
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
    return s.pending={phase:s.phase,ids,min:s.phase==='preliminary'&&['three','threeHybrid'].includes(s.preliminaryMode)?0:1,max:Math.min(s.phase==='preliminary'&&['three','threeHybrid'].includes(s.preliminaryMode)?3:2,ids.length)};
  }
  if(s.phase==='rescue'){
    if(!s.remaining.length){s.phase=s.pool.length>9?'late':s.pool.length<9?'recovery':'boundary';if(s.phase==='recovery')s.remaining=[...new Set(s.rejected)].reverse().filter(id=>!s.pool.includes(id));if(s.phase==='boundary')enterBoundary(s);return nextQuestion(s)}
    return s.pending={phase:'rescue',ids:s.remaining.slice(0,3),min:1,max:1};
  }
  if (s.phase==='late') {
    if (s.pool.length===9) {enterBoundary(s);return nextQuestion(s)}
    const ids=s.pool.slice(0,Math.min(s.lateSize,s.pool.length-8));
    return s.pending={phase:'late',ids,min:1,max:1};
  }
  if (s.phase==='recovery') {
    if (s.pool.length===9) {enterBoundary(s);return nextQuestion(s)}
    if (!s.remaining.length) throw new Error('候補不足');
    return s.pending={phase:'recovery',ids:s.remaining.slice(0,3),min:1,max:1};
  }
  if (s.phase==='boundary') {
    while(s.recheckQueue?.length&&s.pool.includes(s.recheckQueue[0]))s.recheckQueue.shift();
    if(s.recheckQueue?.length){
      const challenger=s.recheckQueue[0], used=new Set(s.boundaryUsed);
      const incumbent=[...s.pool].filter(id=>!used.has(id)).sort((a,b)=>{
        const A=support(s,a),B=support(s,b);return (A.wins-A.losses)-(B.wins-B.losses)||B.uncertain-A.uncertain;
      })[0]||s.pool[0];
      return s.pending={phase:'boundary',ids:[incumbent,challenger],min:1,max:1,recheck:true};
    }
    const ids=s.boundaryCount<2?boundaryPair(s):null;
    if(!ids){startRanking(s);return nextQuestion(s)}
    return s.pending={phase:'boundary',ids,min:1,max:1};
  }
  throw new Error('不明な進行状態');
}

function finishRound(s) {
  s.pool=s.advancing;s.advancing=[];
  if (s.phase==='preliminary') {s.prelimSurvivors=[...s.pool];s.phase='main';s.remaining=[...s.pool]}
  else {
    s.mainSurvivors=[...s.pool];
    if(['rescue','hybrid','threeHybrid'].includes(s.preliminaryMode)){
      // Only groups whose selected faces survived Main provide evidence of
      // a crowded preliminary group. Declared groups have priority in hybrid.
      const groups=[...s.prelimGroups].map((g,i)=>({...g,i,retained:g.chosen.filter(id=>s.pool.includes(id)).length}));
      groups.sort((a,b)=>Number(b.uncertain&&s.preliminaryMode!=='rescue')-Number(a.uncertain&&s.preliminaryMode!=='rescue')||b.retained-a.retained||a.i-b.i);
      const selected=groups.filter(g=>g.retained>0).slice(0,Math.min(6,Math.ceil(s.originalCount/25)));
      // Interleave groups so each rescue question compares different groups.
      const pending=[];for(let k=0;k<3;k++)for(const g of selected)if(g.omitted[k])pending.push(g.omitted[k]);
      s.phase='rescue';s.remaining=pending;
    }else{s.phase=s.pool.length>9?'late':s.pool.length<9?'recovery':'boundary';s.remaining=s.phase==='recovery'?[...new Set(s.rejected)].reverse().filter(id=>!s.pool.includes(id)):[];if(s.phase==='boundary')enterBoundary(s)}
  }
}
function startRanking(s) {s.finalists=[...s.pool];s.phase='rank';s.remaining=[...s.pool];s.ranking=[]}

export function submitChoice(s,chosen,{uncertain=false}={}) {
  const q=nextQuestion(s);
  if (!q||!Array.isArray(chosen)||chosen.length<q.min||chosen.length>q.max||new Set(chosen).size!==chosen.length||chosen.some(id=>!q.ids.includes(id))) throw new Error('選択内容が無効です');
  s.history.push({phase:q.phase,shown:[...q.ids],chosen:[...chosen],uncertain:!!uncertain});
  if(q.phase==='preliminary')s.prelimGroups.push({chosen:[...chosen],omitted:q.ids.filter(id=>!chosen.includes(id)),uncertain:!!uncertain});
  if (q.phase==='rank') {
    const c=s.comparison,mid=Math.floor((c.low+c.high)/2);
    if (chosen[0]===c.candidate)c.high=mid;else c.low=mid+1;
  } else if(q.phase==='rescue'){
    s.remaining.splice(0,q.ids.length);s.pool.push(chosen[0]);s.rescueEntrants.push(chosen[0]);
  } else if (q.phase==='late') {
    s.pool.splice(0,q.ids.length);s.pool.push(chosen[0]);s.rejected.push(...q.ids.filter(id=>id!==chosen[0]));
  } else if (q.phase==='boundary') {
    if(q.recheck)s.recheckQueue.shift();else{s.boundaryCount++;s.boundaryUsed.push(...q.ids)}
    if(chosen[0]===q.ids[1]){s.pool.splice(s.pool.indexOf(q.ids[0]),1,q.ids[1]);s.rejected.push(q.ids[0])}
  } else {
    s.remaining.splice(0,q.ids.length);
    if (q.phase==='recovery')s.pool.push(chosen[0]);else s.advancing.push(...chosen);
    s.rejected.push(...q.ids.filter(id=>!chosen.includes(id)));
  }
  s.pending=null;return nextQuestion(s);
}

export function selectionAudit(s) {
  const phases={},seenLate=new Set(),appearances={},chosenCount={};
  for(const h of s.history){phases[h.phase]=(phases[h.phase]||0)+1;for(const id of h.shown){appearances[id]=(appearances[id]||0)+1;if(h.phase==='late')seenLate.add(id)}for(const id of h.chosen)chosenCount[id]=(chosenCount[id]||0)+1}
  return {screens:s.history.length,phases,appearances,chosenCount,uncertainComparisons:s.history.filter(h=>h.uncertain).length,borderlineComparisons:phases.boundary||0,finalistsWithoutLate:s.finalists.filter(id=>!seenLate.has(id)).length,maxAppearances:Math.max(0,...Object.values(appearances))};
}
