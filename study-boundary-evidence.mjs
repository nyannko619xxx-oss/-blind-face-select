import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSelection} from './selection-engine.js';

// Diagnostic continuation of verify-retrospective-robustness.mjs. Candidate
// pool and mock-player noise remain identical. Only boundary evidence varies.
const COUNT=140, RUNS=500;
const scenarios=[
  {name:'stable',kind:'stable',level:0},
  ...['near_flip','close_jitter','cycle','drift'].flatMap(kind=>[1,2].map(level=>({name:`${kind}_${level}`,kind,level}))),
];
const score=(id,seed)=>(Number(id.slice(1))*977+seed*131)%COUNT;
function hash(...parts){let h=2166136261;for(const c of parts.join('|')){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0)/4294967296}
// Preserve the earlier study's hash for the first answer. Only newly asked
// confirmation answers receive a separately avalanched shock, avoiding the
// near-identical FNV outputs produced by appending occurrence 0 versus 1.
function shock(salt,...parts){const v=hash(...parts);if(!salt)return v;
  let h=(v*4294967296)>>>0;h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);h^=h>>>16;
  return (h>>>0)/4294967296;
}
const p95=a=>[...a].sort((x,y)=>x-y)[Math.ceil(a.length*.95)-1];
function trial(seed,scenario,rho){
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
  function answer(a,b,phase,occurrence=0,noiseFactor=1,noiseSalt=''){
    const aScore=subjective(a,phase),bScore=subjective(b,phase);
    let winner=aScore>=bScore?a:b;
    if(scenario.kind==='cycle')winner=cyclicWinner(a,b)??winner;
    if(scenario.kind==='near_flip'&&Math.min(rank.get(a),rank.get(b))<=14&&Math.max(rank.get(a),rank.get(b))>=6&&Math.abs(aScore-bScore)<=4){
      const pair=[a,b].sort();if(shock(noiseSalt,'flip',seed,scenario.level,phase,...(noiseSalt?[noiseSalt]:[]),...pair,occurrence)<(scenario.level===1?.06:.18)*noiseFactor)winner=winner===a?b:a;
    }
    if(scenario.kind==='close_jitter'&&Math.abs(aScore-bScore)<=range*2){
      const pair=[a,b].sort();
      const aNoise=(shock(noiseSalt,'pair',seed,scenario.level,...pair,phase,...(noiseSalt?[noiseSalt]:[]),occurrence,a)*2-1)*range*noiseFactor;
      const bNoise=(shock(noiseSalt,'pair',seed,scenario.level,...pair,phase,...(noiseSalt?[noiseSalt]:[]),occurrence,b)*2-1)*range*noiseFactor;
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
  function ranking(finalists,policy,baseline=null,rho=0){
    const displaysHere=new Map(displays),shown=group=>{for(const id of group)displaysHere.set(id,displaysHere.get(id)+1)};
    const pairSeen=new Map(),history=[];let rankingScreens=0,pairFlips=0;
    function compare(a,b,phase,repeat={}){rankingScreens++;shown([a,b]);const key=[a,b].sort().join('|'),past=pairSeen.get(key)||[];
      const fresh=answer(a,b,phase==='ranking'?'ranking':'trigger',past.length,repeat.factor??1,repeat.salt??'');
      const stick=repeat.first&&hash('repeat-sticky',seed,scenario.name,...[a,b].sort(),past.length)<rho;
      const winner=stick?repeat.first:fresh,loser=winner===a?b:a;
      if(past.length&&past.some(x=>x!==winner))pairFlips++;
      past.push(winner);pairSeen.set(key,past);history.push({winner,loser,phase});return winner;
    }
    const sorted=[];
    function insert(id){let lo=0,hi=sorted.length;while(lo<hi){const mid=Math.floor((lo+hi)/2);if(compare(id,sorted[mid],'ranking')===id)hi=mid;else lo=mid+1}sorted.splice(lo,0,id)}
    for(const id of finalists){if(sorted.length<9)insert(id);else if(compare(id,sorted[8],'ranking')===id){insert(id);sorted.pop()}}
    let triggerCount=0,falseTrigger=0,acceptedOutside=0,acceptedTrue=0,evictedTrue=0,evictedAny=0,triggerScreens=0;
    let confirmations=0,disagreements=0,hesitations=0,reformatted=0,wrongFirstWins=0,wrongAccepted=0,correctFirstWins=0,correctAccepted=0;
    if(policy!=='B'){
      const frozen=new Map(sorted.map((id,i)=>[id,i+1]));
      for(const event of selectedEvents){if(!event.selected.every(id=>frozen.has(id)))continue;
        triggerCount++;if(!trueTop.has(event.omitted))falseTrigger++;
        const id=event.omitted,before=rankingScreens;
        const boundary=sorted[8],first=compare(id,boundary,'trigger');
        const firstWin=first===id,wrongFirst=firstWin&&score(id,seed)<score(boundary,seed);
        if(firstWin){if(wrongFirst)wrongFirstWins++;else correctFirstWins++}
        const perceivedGap=Math.abs(subjective(id,'ranking')-subjective(boundary,'ranking'));
        // A simulated optional player signal. Policy sees the boolean only.
        const hesitationProbability=perceivedGap<=2?.65:perceivedGap<=5?.30:.02;
        const hesitated=hash('hesitation',seed,scenario.name,...[id,boundary].sort())<hesitationProbability;
        let confirm=policy==='double_all'||(policy==='positive_only'||policy.startsWith('reframe_'))&&firstWin||policy==='hesitation'&&hesitated;
        if(policy==='hesitation'&&hesitated)hesitations++;
        let second=null;
        if(confirm){confirmations++;
          if(policy.startsWith('reframe_'))reformatted++;
          second=compare(id,boundary,'trigger',{first:policy.startsWith('reframe_')?null:first,
            factor:policy==='reframe_half'?.5:1,salt:policy.startsWith('reframe_')?'alternate':'repeat'});
          if(second!==first)disagreements++;
        }
        if(firstWin&&(!confirm||second===id)){if(wrongFirst)wrongAccepted++;else correctAccepted++;
          let lo=0,hi=9;
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
      confirmations,disagreements,hesitations,reformatted,wrongFirstWins,wrongAccepted,correctFirstWins,correctAccepted,
      displacedBaselineTrue:baseline?baseline.final.filter(id=>trueTop.has(id)&&!finalSet.has(id)).length:0};
    return result;
  }
  const b=ranking(pool,'B');
  const policies={single:ranking(pool,'single',b,rho),double_all:ranking(pool,'double_all',b,rho),
    positive_only:ranking(pool,'positive_only',b,rho),hesitation:ranking(pool,'hesitation',b,rho),
    reframe_same:ranking(pool,'reframe_same',b,rho),reframe_half:ranking(pool,'reframe_half',b,rho)};
  return {seed,B:b,policies};
}
const reference=JSON.parse(fs.readFileSync(new URL('./retrospective-robustness-results.json',import.meta.url),'utf8'));
// Saved case-level failure counts, from retrospective-failure-analysis.json.
const priorHarmful={stable:0,near_flip_1:4,near_flip_2:6,close_jitter_1:3,close_jitter_2:4,
  cycle_1:0,cycle_2:0,drift_1:0,drift_2:0};
const names=['single','double_all','positive_only','hesitation','reframe_same','reframe_half'];
const sum=(xs,fn)=>xs.reduce((n,x,i)=>n+fn(x,i),0),mean=(xs,fn)=>sum(xs,fn)/xs.length;
const out={count:COUNT,seeds:RUNS,source:'retrospective-robustness-results.json',
  model:'conservative two-answer acceptance; repeated answer stickiness rho=0 or .75; reframed confirmation is independent, with same or half modeled transient noise',scenarios:[]};
for(const scenario of scenarios)for(const rho of [0,.75]){
  const rows=Array.from({length:RUNS},(_,seed)=>trial(seed,scenario,rho));
  const ref=reference.scenarios.find(x=>x.scenario===scenario.name).policies.R;
  const singles=rows.map(x=>x.policies.single);
  assert.equal(mean(singles,x=>x.screens),ref.meanScreens);
  assert.equal(mean(singles,x=>x.hits),ref.meanTop9);
  assert.equal(singles.filter(x=>x.hits===9).length,ref.exact9);
  assert.equal(sum(singles,x=>x.triggerCount),ref.triggers);
  assert.equal(sum(singles,x=>x.displacedBaselineTrue),ref.evictedBaselineTrue);
  const result={scenario:scenario.name,rho,policies:{},
    doubleVsPositiveIdenticalTrials:rows.filter(x=>x.policies.double_all.final.join('|')===x.policies.positive_only.final.join('|')).length};
  for(const name of names){const vals=rows.map(x=>x.policies[name]);
    const harmful=rows.map((x,i)=>x.B.final.filter(id=>{
      const evicted= !vals[i].final.includes(id),scoreId=score(id,x.seed);
      if(!evicted||scoreId<COUNT-9)return false;
      return vals[i].final.some(challenger=>!x.B.final.includes(challenger)&&score(challenger,x.seed)<scoreId);
    }).length);
    result.policies[name]={meanScreens:mean(vals,x=>x.screens),p95Screens:p95(vals.map(x=>x.screens)),
      extraScreensVsSingle:mean(vals,(x,i)=>x.screens-singles[i].screens),
      meanPairwiseActions:mean(vals,x=>x.triggerScreens),meanExtraUserActionsVsSingle:mean(vals,(x,i)=>x.screens-singles[i].screens+x.hesitations),
      meanTop9:mean(vals,x=>x.hits),exact9:vals.filter(x=>x.hits===9).length,
      triggers:sum(vals,x=>x.triggerCount),falseTriggers:sum(vals,x=>x.falseTrigger),
      confirmations:sum(vals,x=>x.confirmations),disagreements:sum(vals,x=>x.disagreements),
      hesitationTaps:sum(vals,x=>x.hesitations),reformattedScreens:sum(vals,x=>x.reformatted),
      initialWrongBoundaryWins:sum(vals,x=>x.wrongFirstWins),wrongBoundaryWinsAccepted:sum(vals,x=>x.wrongAccepted),
      initialCorrectBoundaryWins:sum(vals,x=>x.correctFirstWins),correctBoundaryWinsAccepted:sum(vals,x=>x.correctAccepted),
      acceptedOutside:sum(vals,x=>x.acceptedOutside),acceptedTrue:sum(vals,x=>x.acceptedTrue),
      displacedBaselineTrue:sum(vals,x=>x.displacedBaselineTrue),
      harmfulRankSubstitutions:sum(harmful,x=>x),
      meanMaxDisplay:mean(vals,x=>x.maxDisplay),p95MaxDisplay:p95(vals.map(x=>x.maxDisplay)),
      meanRepeatDisplays:mean(vals,x=>x.repeatDisplays),sessionsWithPairFlip:vals.filter(x=>x.pairFlips>0).length};
  }
  assert.equal(result.policies.single.harmfulRankSubstitutions,priorHarmful[scenario.name]);
  out.scenarios.push(result);
}
console.log(JSON.stringify(out,null,2));
