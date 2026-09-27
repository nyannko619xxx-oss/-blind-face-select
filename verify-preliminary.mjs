import assert from 'node:assert/strict';
import {createSelection,nextQuestion,submitChoice,selectionAudit} from './selection-engine-experiment.js';

const scenarios=[
  ['A baseline','two','baseline'],['B rescue','rescue','baseline'],
  ['C max3','three','baseline'],['D rescue+declared','hybrid','declared'],
  ['E max3+rescue+declared','threeHybrid','declared']
];
const p95=a=>[...a].sort((x,y)=>x-y)[Math.ceil(.95*a.length)-1];
for(const count of [140,263]){
  const rows=Object.fromEntries(scenarios.map(([n])=>[n,[]]));
  for(let seed=0;seed<500;seed++){
    const ids=Array.from({length:count},(_,i)=>`c${i}`),value=id=>(Number(id.slice(1))*977+seed*131)%count;
    const truth=[...ids].sort((a,b)=>value(b)-value(a)),top9=new Set(truth.slice(0,9)),near=new Set(truth.slice(7,12));
    for(const [name,preliminaryMode,recheckMode] of scenarios){
      const s=createSelection(ids,{seed,lateSize:count>200?4:3,preliminaryMode,recheckMode});let q,steps=0;
      while((q=nextQuestion(s))){
        assert(++steps<240,`${count}/${seed}/${name}`);
        const sorted=[...q.ids].sort((a,b)=>value(b)-value(a)),n=q.phase==='preliminary'&&['three','threeHybrid'].includes(preliminaryMode)?3:q.max===2?2:1;
        const chosen=sorted.slice(0,n),uncertain=sorted.length>n&&value(chosen.at(-1))-value(sorted[n])<=count*.10;
        submitChoice(s,chosen,{uncertain});
      }
      assert.equal(s.ranking.length,9);assert.deepEqual(s.ranking,[...s.ranking].sort((a,b)=>value(b)-value(a)));
      const prelimLost=new Set(s.prelimGroups.flatMap(g=>g.omitted).filter(id=>top9.has(id))),final=new Set(s.ranking),audit=selectionAudit(s);
      rows[name].push({screens:audit.screens,hits:s.ranking.filter(id=>top9.has(id)).length,near:s.ranking.filter(id=>near.has(id)).length,max:audit.maxAppearances,
        prelimLost:prelimLost.size,mainLost:truth.slice(0,9).filter(id=>s.prelimSurvivors.includes(id)&&!s.mainSurvivors.includes(id)).length,
        rescued:s.rescueEntrants.filter(id=>prelimLost.has(id)&&final.has(id)).length});
    }
  }
  for(const [name] of scenarios){const a=rows[name],mean=k=>a.reduce((v,r)=>v+r[k],0)/a.length;
    console.log(JSON.stringify({count,scenario:name,runs:a.length,meanScreens:mean('screens'),p95Screens:p95(a.map(r=>r.screens)),trueTop9:mean('hits'),exact9:a.filter(r=>r.hits===9).length,rank8to12:mean('near'),maxAppearances:Math.max(...a.map(r=>r.max)),preliminaryLost:mean('prelimLost'),mainLost:mean('mainLost'),rescueRecovered:mean('rescued')}));
  }
}
