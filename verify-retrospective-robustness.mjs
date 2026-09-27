import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSelection} from './selection-engine.js';

// The latent order is evaluation-only. Policies receive a simulated player's
// chosen groups, optional close tags, and binary comparison answers.
const COUNT=140, RUNS=500;
const scenarios=[
  {name:'stable',kind:'stable',level:0},
  ...['near_flip','close_jitter','cycle','drift'].flatMap(kind=>[1,2].map(level=>({name:`${kind}_${level}`,kind,level}))),
];
const score=(id,seed)=>(Number(id.slice(1))*977+seed*131)%COUNT;
function hash(...parts){let h=2166136261;for(const c of parts.join('|')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0)/4294967296}
const p95=a=>[...a].sort((x,y)=>x-y)[Math.ceil(a.length*.95)-1];
function trial(seed,scenario){
  const ids=Array.from({length:COUNT},(_,i)=>`c${i}`);
  const latent=[...ids].sort((a,b)=>score(b,seed)-score(a,seed));
  const rank=new Map(latent.map((id,i)=>[id,i+1])),trueTop=new Set(latent.slice(0,9));
  const order=createSelection(ids,{seed}).remaining;
  const range=scenario.level===1?2:5;
  const drift=new Map(ids.map(id=>[id,(hash('drift',seed,id)*2-1)*(scenario.level===1?2:4)]));
  const subjective=(id,phase)=>score(id,seed)+(scenario.kind==='drift'&&phase==='ranking'?drift.get(id):0);
  const lateTop=new Set([...ids].sort((a,b)=>subjective(b,'ranking')-subjective(a,'ranking')).slice(0,9));
  const cycleBlocks=scenario.kind==='cycle'?(scenario.level===1?[[8,9,10]]:[[5,6,7],[8,9,10],[11,12,13]]):[];
  function cyclicWinner(a,b){for(const [x,y,z] of cycleBlocks){const ar=rank.get(a),br=rank.get(b);
    if(ar===z&&br===x||ar===x&&br===y||ar===y&&br===z)return a;
    if(br===z&&ar===x||br===x&&ar===y||br===y&&ar===z)return b;
  }return null}
  function answer(a,b,phase,occurrence=0){
    const aScore=subjective(a,phase),bScore=subjective(b,phase);
    let winner=aScore>=bScore?a:b;
    if(scenario.kind==='cycle')winner=cyclicWinner(a,b)??winner;
    if(scenario.kind==='near_flip'&&Math.min(rank.get(a),rank.get(b))<=14&&Math.max(rank.get(a),rank.get(b))>=6&&Math.abs(aScore-bScore)<=4){
      const pair=[a,b].sort();if(hash('flip',seed,scenario.level,phase,...pair,occurrence)<(scenario.level===1?.06:.18))winner=winner===a?b:a;
    }
    if(scenario.kind==='close_jitter'&&Math.abs(aScore-bScore)<=range*2){
      const pair=[a,b].sort();
      const aNoise=(hash('pair',seed,scenario.level,...pair,phase,occurrence,a)*2-1)*range;
      const bNoise=(hash('pair',seed,scenario.level,...pair,phase,occurrence,b)*2-1)*range;
      winner=aScore+aNoise>=bScore+bNoise?a:b;
    }
    return winner;
  }
  const displays=new Map(ids.map(id=>[id,0]));
  const show=group=>{for(const id of group)displays.set(id,displays.get(id)+1)};
  const selectedEvents=[];let screeningScreens=0,tagCount=0;
  function choose(group,n,stage){
    screeningScreens++;show(group);
    const perception=new Map(group.map(id=>[id,subjective(id,'screening')]));
    if(scenario.kind==='near_flip')for(const id of group)if(rank.get(id)>=6&&rank.get(id)<=14)
      perception.set(id,perception.get(id)+(hash('group-flip',seed,scenario.level,stage,group.join(','),id)*2-1)*(scenario.level===1?2:5));
    if(scenario.kind==='close_jitter')for(const id of group)
      perception.set(id,perception.get(id)+(hash('group-jitter',seed,scenario.level,stage,group.join(','),id)*2-1)*range);
    if(scenario.kind==='cycle')for(const id of group)for(const other of group)if(id!==other&&cyclicWinner(id,other)===id)
      perception.set(id,perception.get(id)+.45);
    const selected=[...group].sort((a,b)=>perception.get(b)-perception.get(a)||a.localeCompare(b)).slice(0,Math.min(n,group.length));
    return {selected,perception};
  }
  function batch(items,size,n,stage){const out=[];for(let i=0;i<items.length;i+=size)out.push(...choose(items.slice(i,i+size),n,stage).selected);return out}
  const preliminary=batch(order,5,2,'preliminary'),main=batch(preliminary,4,2,'main');
  let pool=[...main],protectedIds=[];
  while(pool.length>21){const next=[];for(let i=0;i<pool.length;i+=4){
    const group=pool.slice(i,i+4),{selected,perception}=choose(group,3,'screen');next.push(...selected);
    if(group.length===4){const omitted=group.find(id=>!selected.includes(id));selectedEvents.push({omitted,selected});
      // This is the simulated player's subjective optional tag, handed to D
      // as a boolean. The policy never reads the perception or latent score.
      const closest=Math.min(...selected.map(id=>perception.get(id)))-perception.get(omitted);
      if(protectedIds.length<6&&closest<=14){protectedIds.push(omitted);tagCount++}
    }
  }pool=next}
  assert.equal(pool.length,21);assert.equal(selectedEvents.length,7);
  function ranking(finalists,applyTrigger,baseline=null){
    const displaysHere=new Map(displays),shown=group=>{for(const id of group)displaysHere.set(id,displaysHere.get(id)+1)};
    const pairSeen=new Map(),history=[];let rankingScreens=0,pairFlips=0;
    function compare(a,b,phase){rankingScreens++;shown([a,b]);const key=[a,b].sort().join('|'),past=pairSeen.get(key)||[];
      const winner=answer(a,b,phase,past.length),loser=winner===a?b:a;
      if(past.length&&past.some(x=>x!==winner))pairFlips++;
      past.push(winner);pairSeen.set(key,past);history.push({winner,loser,phase});return winner;
    }
    const sorted=[];
    function insert(id){let lo=0,hi=sorted.length;while(lo<hi){const mid=Math.floor((lo+hi)/2);if(compare(id,sorted[mid],'ranking')===id)hi=mid;else lo=mid+1}sorted.splice(lo,0,id)}
    for(const id of finalists){if(sorted.length<9)insert(id);else if(compare(id,sorted[8],'ranking')===id){insert(id);sorted.pop()}}
    let triggerCount=0,falseTrigger=0,acceptedOutside=0,acceptedTrue=0,evictedTrue=0,evictedAny=0,triggerScreens=0;
    if(applyTrigger){
      const frozen=new Map(sorted.map((id,i)=>[id,i+1]));
      for(const event of selectedEvents){if(!event.selected.every(id=>frozen.has(id)))continue;
        triggerCount++;if(!trueTop.has(event.omitted))falseTrigger++;
        const id=event.omitted,before=rankingScreens;
        if(compare(id,sorted[8],'trigger')===id){let lo=0,hi=9;
          while(lo<hi){const mid=Math.floor((lo+hi)/2);if(compare(id,sorted[mid],'trigger')===id)hi=mid;else lo=mid+1}
          sorted.splice(lo,0,id);const evicted=sorted.pop();evictedAny++;if(trueTop.has(evicted))evictedTrue++;
          if(trueTop.has(id))acceptedTrue++;else acceptedOutside++;
        }
        triggerScreens+=rankingScreens-before;
      }
    }
    const finalSet=new Set(sorted),position=new Map(sorted.map((id,i)=>[id,i]));
    const contradiction=history.filter(x=>finalSet.has(x.winner)&&finalSet.has(x.loser)&&position.get(x.winner)>position.get(x.loser)).length;
    const oracleDiscordance=sorted.reduce((n,id,i)=>n+sorted.slice(i+1).filter(other=>answer(id,other,'ranking',0)!==id).length,0);
    const maxDisplay=Math.max(...displaysHere.values()),repeatDisplays=[...displaysHere.values()].reduce((n,v)=>n+Math.max(0,v-1),0);
    const result={screens:screeningScreens+rankingScreens,rankingScreens,hits:sorted.filter(id=>trueTop.has(id)).length,
      lateHits:sorted.filter(id=>lateTop.has(id)).length,
      final:sorted,maxDisplay,repeatDisplays,contradiction,pairFlips,oracleDiscordance,
      triggerCount,falseTrigger,acceptedOutside,acceptedTrue,evictedTrue,evictedAny,triggerScreens,
      displacedBaselineTrue:baseline?baseline.final.filter(id=>trueTop.has(id)&&!finalSet.has(id)).length:0};
    return result;
  }
  const b=ranking(pool,false),d=ranking([...pool,...protectedIds.filter(id=>!pool.includes(id))],false);
  const dFinal=new Set(d.final),bFinal=new Set(b.final);
  d.displacedBaselineTrue=b.final.filter(id=>trueTop.has(id)&&!dFinal.has(id)).length;
  d.acceptedOutside=protectedIds.filter(id=>dFinal.has(id)&&!bFinal.has(id)&&!trueTop.has(id)).length;
  d.acceptedTrue=protectedIds.filter(id=>dFinal.has(id)&&!bFinal.has(id)&&trueTop.has(id)).length;
  const r=ranking(pool,true,b);
  return {seed,tagCount,latentLateOverlap:[...trueTop].filter(id=>lateTop.has(id)).length,B:b,D:d,R:r};
}
const output={count:COUNT,seeds:RUNS,scenarios:[]};
for(const scenario of scenarios){const rows=[];for(let seed=0;seed<RUNS;seed++)rows.push(trial(seed,scenario));
  const mean=(xs,key)=>xs.reduce((n,x)=>n+x[key],0)/xs.length;
  const summary={scenario:scenario.name,kind:scenario.kind,level:scenario.level,
    DmeanTags:mean(rows,'tagCount'),meanLatentLateTop9Overlap:mean(rows,'latentLateOverlap'),policies:{}};
  for(const mode of ['B','D','R']){const vals=rows.map(x=>x[mode]),bvals=rows.map(x=>x.B);
    summary.policies[mode]={meanScreens:mean(vals,'screens'),p95Screens:p95(vals.map(x=>x.screens)),
      meanExtraScreens:mean(vals.map((x,i)=>({delta:x.screens-bvals[i].screens})),'delta'),
      p95ExtraScreens:p95(vals.map((x,i)=>x.screens-bvals[i].screens)),
      meanTop9:mean(vals,'hits'),exact9:vals.filter(x=>x.hits===9).length,meanLateTop9:mean(vals,'lateHits'),
      triggers:vals.reduce((n,x)=>n+x.triggerCount,0),falseTriggers:vals.reduce((n,x)=>n+x.falseTrigger,0),
      triggerComparisons:vals.reduce((n,x)=>n+x.triggerScreens,0),
      acceptedOutside:vals.reduce((n,x)=>n+x.acceptedOutside,0),acceptedTrue:vals.reduce((n,x)=>n+x.acceptedTrue,0),
      evictedBaselineTrue:vals.reduce((n,x)=>n+x.displacedBaselineTrue,0),
      evictedDuringTriggerTrue:vals.reduce((n,x)=>n+x.evictedTrue,0),
      evictedDuringTriggerAny:vals.reduce((n,x)=>n+x.evictedAny,0),
      meanMaxDisplay:mean(vals,'maxDisplay'),p95MaxDisplay:p95(vals.map(x=>x.maxDisplay)),absoluteMaxDisplay:Math.max(...vals.map(x=>x.maxDisplay)),
      meanRepeatDisplays:mean(vals,'repeatDisplays'),meanContradictoryComparisons:mean(vals,'contradiction'),
      sessionsWithContradiction:vals.filter(x=>x.contradiction>0).length,
      sessionsWithPairFlip:vals.filter(x=>x.pairFlips>0).length,meanOracleDiscordance:mean(vals,'oracleDiscordance')};
  }
  summary.paired={RbetterThanB:rows.filter(x=>x.R.hits>x.B.hits).length,RworseThanB:rows.filter(x=>x.R.hits<x.B.hits).length,
    DbetterThanB:rows.filter(x=>x.D.hits>x.B.hits).length,DworseThanB:rows.filter(x=>x.D.hits<x.B.hits).length,
    RbetterThanD:rows.filter(x=>x.R.hits>x.D.hits).length,RworseThanD:rows.filter(x=>x.R.hits<x.D.hits).length};
  output.scenarios.push(summary);
}
const stable=output.scenarios[0].policies;
for(const [mode,screens,hits,exact] of [['B',102.324,8.696,366],['D',107.334,8.758,388],['R',103.248,8.758,388]]){
  assert.equal(stable[mode].meanScreens,screens);assert.equal(stable[mode].meanTop9,hits);assert.equal(stable[mode].exact9,exact);
}
console.log(JSON.stringify(output,null,2));
