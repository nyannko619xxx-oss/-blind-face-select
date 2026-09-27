import assert from 'node:assert/strict';
import {createSelection} from './selection-engine.js';

// Follow-up to verify-finalist-pool.mjs. Only B/D are rerun because the prior
// JSONL stores aggregates, not per-seed candidate and stage outcomes.
const thresholds=[16,18,21,24,28,30,40,53];
const rankScore=(id,seed,count)=>(Number(id.slice(1))*977+seed*131)%count;
const p95=a=>[...a].sort((x,y)=>x-y)[Math.ceil(a.length*.95)-1];
function run(count,seed,target,protect){
  const ids=Array.from({length:count},(_,i)=>`c${i}`),score=id=>rankScore(id,seed,count);
  const order=createSelection(ids,{seed,lateSize:count>200?4:3}).remaining;
  const truth=[...ids].sort((a,b)=>score(b)-score(a)).slice(0,9),trueSet=new Set(truth);
  const shown={},stageScreens={preliminary:0,main:0,screen:0,boundary:0,pairwise:0};
  function record(group,stage){stageScreens[stage]++;for(const id of group)shown[id]=(shown[id]||0)+1}
  function choose(group,n,stage){record(group,stage);return [...group].sort((a,b)=>score(b)-score(a)).slice(0,Math.min(n,group.length))}
  function batch(items,size,n,stage){const out=[];for(let i=0;i<items.length;i+=size)out.push(...choose(items.slice(i,i+size),n,stage));return out}
  const prelim=batch(order,5,2,'preliminary'),main=batch(prelim,4,2,'main');
  let pool=[...main],protectedIds=[],tagScreens=0;
  while(pool.length>target){const next=[];for(let i=0;i<pool.length;i+=4){
    const group=pool.slice(i,i+4),selected=choose(group,3,'screen');next.push(...selected);
    if(protect&&group.length===4){const omitted=group.find(id=>!selected.includes(id));
      // This is the simulated player's optional close call, not an engine score.
      if(protectedIds.length<6&&score(selected.at(-1))-score(omitted)<=count*.10){protectedIds.push(omitted);tagScreens++}
    }
  }pool=next}
  const screened=[...pool];pool.push(...protectedIds.filter(id=>!pool.includes(id)));
  const finalist=[...pool],sorted=[];
  function compare(a,b,stage){record([a,b],stage);return score(a)>score(b)?a:b}
  function insert(id){let lo=0,hi=sorted.length;while(lo<hi){const mid=Math.floor((lo+hi)/2);if(compare(id,sorted[mid],'pairwise')===id)hi=mid;else lo=mid+1}sorted.splice(lo,0,id)}
  for(const id of finalist){if(sorted.length<9)insert(id);else if(compare(id,sorted[8],'boundary')===id){insert(id);sorted.pop()}}
  assert.equal(sorted.length,9);assert.equal(new Set(sorted).size,9);
  assert.deepEqual(sorted,[...sorted].sort((a,b)=>score(b)-score(a)));
  const preSet=new Set(prelim),mainSet=new Set(main),screenSet=new Set(screened),finalSet=new Set(finalist),selectedSet=new Set(sorted);
  const stage=truth.map(id=>!preSet.has(id)?'preliminary':!mainSet.has(id)?'main':!screenSet.has(id)&&!finalSet.has(id)?'screen':!selectedSet.has(id)?'ranking':'recovered');
  return {count,seed,target,protect,truth,misses:truth.filter(id=>!selectedSet.has(id)).map(id=>({id,rank:truth.indexOf(id)+1,stage:stage[truth.indexOf(id)]})),
    stage,poolSize:finalist.length,screenedSize:screened.length,screenRounds:stageScreens.screen,
    screens:Object.values(stageScreens).reduce((a,b)=>a+b,0),stageScreens,
    maxAppearance:Math.max(...Object.values(shown)),tags:protectedIds.length,tagScreens,
    rankingMiss:truth.filter(id=>finalSet.has(id)&&!selectedSet.has(id)).length,
    finalHits:truth.filter(id=>selectedSet.has(id)).length};
}
const lines=[];
for(const count of [140,263]){
  // Distinct thresholds only, retain the requested 24-person reference.
  for(const target of thresholds.filter(t=>t<=count)){
    const paired=[];for(let seed=0;seed<500;seed++)paired.push([run(count,seed,target,false),run(count,seed,target,true)]);
    for(const protection of [false,true]){
      const a=paired.map(x=>x[Number(protection)]),mean=k=>a.reduce((v,r)=>v+r[k],0)/a.length;
      const stageMiss=Object.fromEntries(['preliminary','main','screen','ranking'].map(stage=>[stage,a.reduce((n,r)=>n+r.misses.filter(x=>x.stage===stage).length,0)/a.length]));
      const byRank=Object.fromEntries(Array.from({length:9},(_,i)=>i+1).map(rank=>[rank,Object.fromEntries(['preliminary','main','screen','ranking','recovered'].map(stage=>[stage,a.filter(r=>r.stage[rank-1]===stage).length]))]));
      const idMiss=new Map();for(const r of a)for(const x of r.misses)idMiss.set(x.id,(idMiss.get(x.id)||0)+1);
      const summary={count,target,mode:protection?'D':'B',runs:500,meanScreenedPool:mean('screenedSize'),meanFinalistPool:mean('poolSize'),meanScreens:mean('screens'),p95Screens:p95(a.map(r=>r.screens)),meanTop9:mean('finalHits'),exact9:a.filter(r=>r.finalHits===9).length,
        meanScreeningScreens:mean('screenRounds'),meanRankingScreens:a.reduce((n,r)=>n+r.stageScreens.boundary+r.stageScreens.pairwise,0)/a.length,
        meanTags:mean('tags'),maxAppearance:Math.max(...a.map(r=>r.maxAppearance)),stageMiss,byRank,
        rankingMiss:mean('rankingMiss'),mostRepeatedId:[...idMiss.entries()].sort((x,y)=>y[1]-x[1]).slice(0,3)};
      lines.push(summary);console.log(JSON.stringify(summary));
    }
    if(target===24){
      let both=0,bOnly=0,dOnly=0,neither=0,corrected=0,newlyMissed=0;
      const missedRanks={B:{},D:{}};
      for(const [b,d] of paired){const bm=new Set(b.misses.map(x=>x.id)),dm=new Set(d.misses.map(x=>x.id));
        for(let i=0;i<9;i++){const id=b.truth[i],x=bm.has(id),y=dm.has(id);if(x&&y)both++;else if(x)bOnly++;else if(y)dOnly++;else neither++;
          if(x&&!y)corrected++;if(!x&&y)newlyMissed++;
          if(x)missedRanks.B[i+1]=(missedRanks.B[i+1]||0)+1;if(y)missedRanks.D[i+1]=(missedRanks.D[i+1]||0)+1;
        }
      }
      const detail={count,target,paired:{both,bOnly,dOnly,neither,corrected,newlyMissed},missedRanks};
      lines.push(detail);console.log(JSON.stringify(detail));
    }
  }
}
