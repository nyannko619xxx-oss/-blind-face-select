import assert from 'node:assert/strict';
import {createSelection,nextQuestion,submitChoice,selectionAudit} from './selection-engine.js';

const counts=[9,20,40,105,135,140,150], lateSizes=[3,4], styles=['one','two','mixed'];
let total=0,maxSeen=0,maxScreens=0;
for(const count of counts)for(const lateSize of lateSizes)for(const style of styles)for(let seed=0;seed<100;seed++){
  const ids=Array.from({length:count},(_,i)=>`c${i}`);
  const state=createSelection(ids,{lateSize,seed});
  let q,steps=0;
  while((q=nextQuestion(state))){
    assert(++steps<200,`loop ${count}/${lateSize}/${style}/${seed}`);
    if(q.phase==='preliminary')assert(q.ids.length>=1&&q.ids.length<=5);
    if(q.phase==='main')assert(q.ids.length>=1&&q.ids.length<=4);
    if(q.phase==='late')assert(q.ids.length>=1&&q.ids.length<=lateSize);
    const n=q.max===2&&(style==='two'||style==='mixed'&&seed%2===0)?2:1;
    submitChoice(state,q.ids.slice(0,n),{uncertain:style==='mixed'&&steps%9===0});
  }
  assert.equal(state.ranking.length,9);
  assert.equal(new Set(state.ranking).size,9);
  const audit=selectionAudit(state);
  assert(audit.maxAppearances<=20);
  maxSeen=Math.max(maxSeen,audit.maxAppearances);
  maxScreens=Math.max(maxScreens,audit.screens);
  total++;
}

// Every pairwise rank choice follows a stable simulated preference order.
for(let seed=0;seed<500;seed++){
  const ids=Array.from({length:140},(_,i)=>`c${i}`);
  const state=createSelection(ids,{seed});
  const value=id=>(Number(id.slice(1))*977+seed*131)%140;
  let q,steps=0;
  while((q=nextQuestion(state))){
    assert(++steps<200);
    const chosen=[...q.ids].sort((a,b)=>value(b)-value(a)).slice(0,q.max===2?2:1);
    submitChoice(state,chosen);
  }
  assert.deepEqual(state.ranking,[...state.ranking].sort((a,b)=>value(b)-value(a)));
}

console.log(JSON.stringify({sessions:total,preferenceRuns:500,maxScreens,maxCandidateAppearances:maxSeen}));
