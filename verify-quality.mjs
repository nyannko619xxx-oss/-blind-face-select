import assert from 'node:assert/strict';
import {createSelection,nextQuestion,submitChoice,selectionAudit} from './selection-engine.js';

// Paired seeds and identical stable preference order across policies. A declared
// hesitation is generated from the score gap around the last selected place.
const counts=[140,263], modes=['baseline','secondChance','declared'];
const percentile=(a,p)=>[...a].sort((x,y)=>x-y)[Math.ceil(p*a.length)-1];
for(const count of counts){
  const rows={};for(const mode of modes)rows[mode]=[];
  for(let seed=0;seed<500;seed++){
    const ids=Array.from({length:count},(_,i)=>`c${i}`);
    const value=id=>(Number(id.slice(1))*977+seed*131)%count;
    const truth=[...ids].sort((a,b)=>value(b)-value(a)).slice(0,9);
    for(const mode of modes){
      const s=createSelection(ids,{seed,lateSize:count>200?4:3,recheckMode:mode});
      let q,steps=0;
      while((q=nextQuestion(s))){
        assert(++steps<250);
        const sorted=[...q.ids].sort((a,b)=>value(b)-value(a));
        const picked=sorted.slice(0,q.max===2?2:1);
        // Approximate actual indecision: at a cut, the best excluded face is
        // close to the least preferred chosen face. 10% of score range.
        const uncertain=sorted.length>picked.length&&value(picked.at(-1))-value(sorted[picked.length])<=count*.10;
        submitChoice(s,picked,{uncertain});
      }
      const audit=selectionAudit(s),hits=s.ranking.filter(id=>truth.includes(id)).length;
      assert.deepEqual(s.ranking,[...s.ranking].sort((a,b)=>value(b)-value(a)));
      rows[mode].push({screens:audit.screens,hits,boundary:truth.slice(7).filter(id=>s.ranking.includes(id)).length,max:audit.maxAppearances,uncertain:audit.uncertainComparisons});
    }
  }
  for(const mode of modes){const a=rows[mode],avg=k=>a.reduce((n,r)=>n+r[k],0)/a.length;
    console.log(JSON.stringify({count,mode,runs:a.length,meanScreens:avg('screens'),p95Screens:percentile(a.map(r=>r.screens),.95),meanTrueTop9:avg('hits'),exactTop9:a.filter(r=>r.hits===9).length,meanBoundary8to9:avg('boundary'),maxAppearances:Math.max(...a.map(r=>r.max)),meanDeclaredComparisons:avg('uncertain')}));
  }
}
// When nobody declares hesitation, the opt-in policy follows the baseline path.
for(let seed=0;seed<50;seed++){
  const ids=Array.from({length:140},(_,i)=>`c${i}`),results=[];
  for(const recheckMode of ['baseline','declared']){
    const s=createSelection(ids,{seed,recheckMode});let q;
    while((q=nextQuestion(s)))submitChoice(s,[...q.ids].sort((a,b)=>Number(b.slice(1))-Number(a.slice(1))).slice(0,q.max===2?2:1));
    results.push({ranking:s.ranking,screens:s.history.length});
  }
  assert.deepEqual(results[1],results[0]);
}
