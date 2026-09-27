import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSelection} from './selection-engine.js';

// Diagnostic replay of the published B21 experiment, seeds 0..499. The
// synthetic preference order is a simulated player; only choose/compare
// outcomes and final placement may influence the experimental triggers.
const count=140, seeds=500;
const reference=fs.readFileSync(new URL('./finalist-boundary-results.jsonl',import.meta.url),'utf8')
  .trim().split('\n').map(JSON.parse).filter(x=>x.count===count&&x.target===21&&['B','D'].includes(x.mode));
assert.equal(reference.length,2);
const score=(id,seed)=>(Number(id.slice(1))*977+seed*131)%count;
const p95=a=>[...a].sort((x,y)=>x-y)[Math.ceil(a.length*.95)-1];
const triggerRules={
  all3Top9: r=>r.filter(x=>x<=9).length===3,
  atLeast2Top9: r=>r.filter(x=>x<=9).length>=2,
  all3Top6: r=>r.every(x=>x<=6),
};
const records=[];
for(let seed=0;seed<seeds;seed++){
  const ids=Array.from({length:count},(_,i)=>`c${i}`),preference=(a,b)=>score(b,seed)-score(a,seed);
  const trueTop9=new Set([...ids].sort(preference).slice(0,9));
  const order=createSelection(ids,{seed}).remaining;
  let baseScreens=0,baseComparisons=0;
  function choose(group,n){baseScreens++;baseComparisons++;return [...group].sort(preference).slice(0,Math.min(n,group.length))}
  function batch(items,size,n){const result=[];for(let i=0;i<items.length;i+=size)result.push(...choose(items.slice(i,i+size),n));return result}
  const preliminary=batch(order,5,2),main=batch(preliminary,4,2),screenEvents=[];
  let pool=main;
  while(pool.length>21){const next=[];for(let i=0;i<pool.length;i+=4){
    const group=pool.slice(i,i+4),selected=choose(group,3);
    next.push(...selected);
    if(group.length===4)screenEvents.push({omitted:group.find(id=>!selected.includes(id)),selected});
  }pool=next}
  assert.equal(pool.length,21);assert.equal(screenEvents.length,7);
  const sorted=[];
  function compare(a,b){baseScreens++;baseComparisons++;return preference(a,b)<0?a:b}
  function insert(id){let lo=0,hi=sorted.length;while(lo<hi){const mid=Math.floor((lo+hi)/2);if(compare(id,sorted[mid])===id)hi=mid;else lo=mid+1}sorted.splice(lo,0,id)}
  for(const id of pool){if(sorted.length<9)insert(id);else if(compare(id,sorted[8])===id){insert(id);sorted.pop()}}
  assert.equal(sorted.length,9);
  const baseline=[...sorted],baselineSet=new Set(baseline),baseHits=baseline.filter(id=>trueTop9.has(id)).length;
  const placements=new Map(baseline.map((id,index)=>[id,index+1]));
  const perRule={};
  for(const [name,rule] of Object.entries(triggerRules)){
    // Freeze the evidence before any rescue comparisons. A trigger cannot
    // become true merely because an earlier rescue displaced another face.
    const flagged=screenEvents.filter(e=>rule(e.selected.map(id=>placements.get(id)??Infinity)));
    const ranked=[...baseline],accepted=[],displaced=[];
    let extraScreens=0,extraComparisons=0;
    function challenge(a,b){extraScreens++;extraComparisons++;return preference(a,b)<0?a:b}
    for(const e of flagged){const id=e.omitted;
      if(challenge(id,ranked[8])!==id)continue;
      let lo=0,hi=9;
      while(lo<hi){const mid=Math.floor((lo+hi)/2);if(challenge(id,ranked[mid])===id)hi=mid;else lo=mid+1}
      ranked.splice(lo,0,id);displaced.push(ranked.pop());accepted.push(id);
    }
    assert.deepEqual(ranked,[...ranked].sort(preference));
    const finalSet=new Set(ranked),hits=ranked.filter(id=>trueTop9.has(id)).length;
    perRule[name]={triggered:flagged.length,triggeredTrue:flagged.filter(e=>trueTop9.has(e.omitted)).length,
      triggeredFalse:flagged.filter(e=>!trueTop9.has(e.omitted)).length,
      acceptedTrue:accepted.filter(id=>trueTop9.has(id)).length,
      acceptedFalse:accepted.filter(id=>!trueTop9.has(id)).length,
      extraScreens,extraComparisons,hits,baseHits,
      newlyLostTrue:baseline.filter(id=>trueTop9.has(id)&&!finalSet.has(id)).length,
      displacedTrue:displaced.filter(id=>trueTop9.has(id)).length};
  }
  records.push({seed,baseScreens,baseComparisons,baseHits,perRule});
}
const baseline={meanScreens:records.reduce((n,x)=>n+x.baseScreens,0)/seeds,
  meanTop9:records.reduce((n,x)=>n+x.baseHits,0)/seeds,
  exact9:records.filter(x=>x.baseHits===9).length};
const b=reference.find(x=>x.mode==='B'),d=reference.find(x=>x.mode==='D');
assert.equal(baseline.meanScreens,b.meanScreens);assert.equal(baseline.meanTop9,b.meanTop9);assert.equal(baseline.exact9,b.exact9);
const summary={experiment:'retrospective-trigger-B21',count,seeds,reference:{B:{meanScreens:b.meanScreens,p95Screens:b.p95Screens,meanTop9:b.meanTop9,exact9:b.exact9},
  D:{meanScreens:d.meanScreens,p95Screens:d.p95Screens,meanTop9:d.meanTop9,exact9:d.exact9,meanTags:d.meanTags}},rules:{}};
for(const name of Object.keys(triggerRules)){
  const rows=records.map(x=>x.perRule[name]);
  const sum=k=>rows.reduce((n,r)=>n+r[k],0);
  summary.rules[name]={triggered:sum('triggered'),triggeredTrue:sum('triggeredTrue'),falseAlarms:sum('triggeredFalse'),
    acceptedTrue:sum('acceptedTrue'),acceptedFalse:sum('acceptedFalse'),
    meanExtraScreens:sum('extraScreens')/seeds,p95ExtraScreens:p95(rows.map(r=>r.extraScreens)),
    extraPlayerComparisons:sum('extraComparisons'),meanExtraPlayerComparisons:sum('extraComparisons')/seeds,
    meanTotalScreens:(rows.reduce((n,r,i)=>n+r.extraScreens+records[i].baseScreens,0))/seeds,
    p95TotalScreens:p95(rows.map((r,i)=>r.extraScreens+records[i].baseScreens)),
    meanTop9:sum('hits')/seeds,exact9:rows.filter(r=>r.hits===9).length,
    newlyLostTrue:sum('newlyLostTrue'),displacedTrue:sum('displacedTrue'),
    triggerSessions:rows.filter(r=>r.triggered>0).length};
  assert.equal(summary.rules[name].newlyLostTrue,0);
}
console.log(JSON.stringify(summary,null,2));
