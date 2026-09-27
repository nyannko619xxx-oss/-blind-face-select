import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSelection} from './selection-engine.js';

// Event-level replay of verify-retrospective-robustness.mjs, held to its saved
// aggregates below. Counterfactuals are analyst-only and never enter a policy.
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
  const selectedEvents=[],selectionLog=[];let screeningScreens=0,tagCount=0;
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
    selectionLog.push({stage,group:[...group],selected:[...selected]});
    return {selected,perception};
  }
  function batch(items,size,n,stage){const out=[];for(let i=0;i<items.length;i+=size)out.push(...choose(items.slice(i,i+size),n,stage).selected);return out}
  const preliminary=batch(order,5,2,'preliminary'),main=batch(preliminary,4,2,'main');
  let pool=[...main],protectedIds=[];
  while(pool.length>21){const next=[];for(let i=0;i<pool.length;i+=4){
    const group=pool.slice(i,i+4),{selected,perception}=choose(group,3,'screen');next.push(...selected);
    if(group.length===4){const omitted=group.find(id=>!selected.includes(id));selectedEvents.push({omitted,selected,group,
      oracleSelected:[...group].sort((a,b)=>score(b,seed)-score(a,seed)).slice(0,3)});
      // This is the simulated player's subjective optional tag, handed to D
      // as a boolean. The policy never reads the perception or latent score.
      const closest=Math.min(...selected.map(id=>perception.get(id)))-perception.get(omitted);
      if(protectedIds.length<6&&closest<=14){protectedIds.push(omitted);tagCount++}
    }
  }pool=next}
  assert.equal(pool.length,21);assert.equal(selectedEvents.length,7);
  function ranking(finalists,applyTrigger,baseline=null,options={}){
    const displaysHere=new Map(displays),shown=group=>{for(const id of group)displaysHere.set(id,displaysHere.get(id)+1)};
    const pairSeen=new Map(),history=[];let rankingScreens=0,pairFlips=0;
    function compare(a,b,phase){rankingScreens++;shown([a,b]);const key=[a,b].sort().join('|'),past=pairSeen.get(key)||[];
      const oracleWinner=score(a,seed)>score(b,seed)?a:b;
      const isOracle=options.oracleRanking&&phase==='ranking'||options.oracleBoundary&&phase==='trigger-boundary'||options.oracleInsertion&&phase==='trigger-insertion';
      const winner=isOracle?oracleWinner:answer(a,b,phase==='ranking'?'ranking':'trigger',past.length),loser=winner===a?b:a;
      if(past.length&&past.some(x=>x!==winner))pairFlips++;
      past.push(winner);pairSeen.set(key,past);history.push({a,b,winner,loser,oracleWinner,phase});return winner;
    }
    const sorted=[];
    function insert(id){let lo=0,hi=sorted.length;while(lo<hi){const mid=Math.floor((lo+hi)/2);if(compare(id,sorted[mid],'ranking')===id)hi=mid;else lo=mid+1}sorted.splice(lo,0,id)}
    for(const id of finalists){if(sorted.length<9)insert(id);else if(compare(id,sorted[8],'ranking')===id){insert(id);sorted.pop()}}
    let triggerCount=0,falseTrigger=0,acceptedOutside=0,acceptedTrue=0,evictedTrue=0,evictedAny=0,triggerScreens=0;
    const frozenStart=[...sorted],triggerEvents=[];
    if(applyTrigger){
      const frozen=new Map((options.membership??sorted).map((id,i)=>[id,i+1]));
      for(const event of selectedEvents){const trace={...event,triggered:event.selected.every(id=>frozen.has(id)),
        peerPositions:event.selected.map(id=>frozen.get(id)??null)};
        triggerEvents.push(trace);if(!trace.triggered)continue;
        triggerCount++;if(!trueTop.has(event.omitted))falseTrigger++;
        const id=event.omitted,before=rankingScreens;trace.before=[...sorted];trace.boundary=sorted[8];
        trace.boundaryOracleWinner=score(id,seed)>score(trace.boundary,seed)?id:trace.boundary;
        trace.boundaryWinner=compare(id,sorted[8],'trigger-boundary');
        if(trace.boundaryWinner===id){let lo=0,hi=9;
          const start=history.length;
          while(lo<hi){const mid=Math.floor((lo+hi)/2);if(compare(id,sorted[mid],'trigger-insertion')===id)hi=mid;else lo=mid+1}
          trace.insertion=history.slice(start);trace.insertIndex=lo;
          sorted.splice(lo,0,id);const evicted=sorted.pop();trace.evicted=evicted;trace.after=[...sorted];evictedAny++;if(trueTop.has(evicted))evictedTrue++;
          if(trueTop.has(id))acceptedTrue++;else acceptedOutside++;
        }else trace.after=[...sorted];
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
      displacedBaselineTrue:baseline?baseline.final.filter(id=>trueTop.has(id)&&!finalSet.has(id)).length:0,
      frozenStart,triggerEvents,history};
    return result;
  }
  const b=ranking(pool,false),d=ranking([...pool,...protectedIds.filter(id=>!pool.includes(id))],false);
  const dFinal=new Set(d.final),bFinal=new Set(b.final);
  d.displacedBaselineTrue=b.final.filter(id=>trueTop.has(id)&&!dFinal.has(id)).length;
  d.acceptedOutside=protectedIds.filter(id=>dFinal.has(id)&&!bFinal.has(id)&&!trueTop.has(id)).length;
  d.acceptedTrue=protectedIds.filter(id=>dFinal.has(id)&&!bFinal.has(id)&&trueTop.has(id)).length;
  const r=ranking(pool,true,b);
  const oraclePoolRanking=ranking(pool,false,null,{oracleRanking:true});
  const counterfactuals={trigger:ranking(pool,true,b,{membership:oraclePoolRanking.final}),
    boundary:ranking(pool,true,b,{oracleBoundary:true}),
    insertion:ranking(pool,true,b,{oracleInsertion:true})};
  return {seed,tagCount,latentLateOverlap:[...trueTop].filter(id=>lateTop.has(id)).length,
    selectionLog,pool,rank,oraclePoolRanking,counterfactuals,B:b,D:d,R:r};
}
const prior=JSON.parse(fs.readFileSync(new URL('./retrospective-robustness-results.json',import.meta.url),'utf8'));
const stableCache=Array.from({length:RUNS},(_,seed)=>trial(seed,scenarios[0]));
const allCases=[],byScenario=[];
const key=x=>[...x].sort().join('|');
function firstDeparture(actual,stable){
  for(let i=0;i<Math.max(actual.selectionLog.length,stable.selectionLog.length);i++){
    const a=actual.selectionLog[i],b=stable.selectionLog[i];
    if(!a||!b||key(a.group)!==key(b.group))return {stage:a?.stage??b?.stage,screen:i,kind:'different_roster'};
    if(key(a.selected)!==key(b.selected))return {stage:a.stage,screen:i,kind:'different_selection'};
    if(a.group.join('|')!==b.group.join('|'))return {stage:a.stage,screen:i,kind:'different_roster_order'};
    if(a.selected.join('|')!==b.selected.join('|'))return {stage:a.stage,screen:i,kind:'different_selection_order'};
  }
  const a=actual.B.history,b=stable.B.history;
  for(let i=0;i<Math.max(a.length,b.length);i++){
    if(!a[i]||!b[i]||key([a[i].a,a[i].b])!==key([b[i].a,b[i].b]))return {stage:'ranking',comparison:i,kind:'different_pair'};
    if(a[i].winner!==b[i].winner)return {stage:'ranking',comparison:i,kind:'different_answer'};
  }
  return {stage:'retrospective',kind:'same_B_path'};
}
function classifyCase(row,trace,evicted,stable){
  const rank=id=>row.rank.get(id),oracleMembers=new Set(row.oraclePoolRanking.final);
  const chosen=trace.selected,omitted=trace.omitted;
  const A=key(chosen)!==key(trace.oracleSelected);
  const B=!chosen.every(id=>oracleMembers.has(id));
  const C=trace.boundaryWinner!==trace.boundaryOracleWinner;
  const D=trace.insertion.some(x=>x.winner!==x.oracleWinner);
  const F=trace.before.at(-1)!==[...trace.before].sort((a,b)=>rank(b)-rank(a))[0];
  const target=evicted;
  const preserved=Object.fromEntries(Object.entries(row.counterfactuals).map(([k,v])=>[k,v.final.includes(target)]));
  const categories={A,B,C,D,F};
  const contributing=Object.entries(categories).filter(([,v])=>v).map(([k])=>k);
  const firstLocal=['A','B','F','C','D'].find(k=>categories[k])??'UNCLASSIFIED';
  return {seed:row.seed,scenario:row.scenario,level:row.level,
    screen:{group:trace.group,selected:chosen,omitted,oracleSelected:trace.oracleSelected,changedFromSameGroupOracle:A},
    trigger:{actual:trace.triggered,peerPositions:trace.peerPositions,oraclePoolMembership:chosen.map(id=>oracleMembers.has(id)),changedByRankingNoise:B},
    boundary:{id:trace.boundary,winner:trace.boundaryWinner,oracleWinner:trace.boundaryOracleWinner,reversed:C},
    insertion:{comparisons:trace.insertion.map(x=>({a:x.a,b:x.b,winner:x.winner,oracleWinner:x.oracleWinner})),index:trace.insertIndex,reversed:D},
    before:trace.before,after:trace.after,initialTop9:row.B.final,finalTop9:row.R.final,
    rescued:omitted,evicted,rank:{rescued:rank(omitted),evicted:rank(evicted),gap:rank(omitted)-rank(evicted),boundary:rank(trace.boundary)},
    harmful:rank(omitted)>rank(evicted),categories,compound:contributing.length>1,firstLocal,
    firstGlobalDeparture:firstDeparture(row,stable),counterfactualPreserved:preserved};
}
for(const scenario of scenarios){
  const rows=scenario.kind==='stable'?stableCache: Array.from({length:RUNS},(_,seed)=>trial(seed,scenario));
  const expected=prior.scenarios.find(x=>x.scenario===scenario.name);assert.ok(expected);
  const summary={scenario:scenario.name,displaced:0,cases:0};
  for(const mode of ['B','D','R']){
    const vals=rows.map(x=>x[mode]);const avg=k=>vals.reduce((n,v)=>n+v[k],0)/RUNS;
    assert.equal(avg('screens'),expected.policies[mode].meanScreens);
    assert.equal(avg('hits'),expected.policies[mode].meanTop9);
    assert.equal(vals.filter(x=>x.hits===9).length,expected.policies[mode].exact9);
    if(mode==='R'){
      for(const field of ['displacedBaselineTrue','triggerCount','falseTrigger','acceptedOutside']){
        const reference={displacedBaselineTrue:'evictedBaselineTrue',triggerCount:'triggers',falseTrigger:'falseTriggers',acceptedOutside:'acceptedOutside'}[field];
        assert.equal(vals.reduce((n,v)=>n+v[field],0),expected.policies.R[reference]);
      }
    }
  }
  for(const row of rows){row.scenario=scenario.name;row.level=scenario.level;
    const missing=row.B.final.filter(id=>row.rank.get(id)<=9&&!row.R.final.includes(id));
    summary.displaced+=missing.length;
    for(const evicted of missing){
      const candidates=row.R.triggerEvents.filter(t=>t.evicted===evicted);
      assert.equal(candidates.length,1,'Each final omitted baseline face must have one eviction event');
      allCases.push(classifyCase(row,candidates[0],evicted,stableCache[row.seed]));summary.cases++;
    }
  }
  summary.failureRate=summary.cases/RUNS;
  summary.affectedTrials=new Set(allCases.filter(x=>x.scenario===scenario.name).map(x=>x.seed)).size;
  summary.harmful=allCases.filter(x=>x.scenario===scenario.name&&x.harmful).length;
  summary.harmfulRate=summary.harmful/RUNS;
  summary.recallLoss=allCases.filter(x=>x.scenario===scenario.name&&x.harmful&&x.rank.rescued>9).length;
  byScenario.push(summary);
}
const tally=(xs,fn)=>Object.fromEntries([...Map.groupBy(xs,fn)].map(([k,v])=>[k,v.length]));
const gaps=tally(allCases,x=>x.rank.gap);
const harmfulCases=allCases.filter(x=>x.harmful);
const summarize=cases=>({total:cases.length,
  categories:Object.fromEntries(['A','B','C','D','F'].map(k=>[k,cases.filter(x=>x.categories[k]).length])),
  ECompound:cases.filter(x=>x.compound).length,
  overlaps:tally(cases,x=>Object.entries(x.categories).filter(([,v])=>v).map(([k])=>k).join('+')||'NONE'),
  firstLocal:tally(cases,x=>x.firstLocal),firstGlobal:tally(cases,x=>x.firstGlobalDeparture.stage+':'+x.firstGlobalDeparture.kind),
  counterfactualPrevented:Object.fromEntries(['trigger','boundary','insertion'].map(k=>[k,cases.filter(x=>x.counterfactualPreserved[k]).length])),
  rankGapDistribution:tally(cases,x=>x.rank.gap),
  meanRankGap:cases.length?cases.reduce((n,x)=>n+x.rank.gap,0)/cases.length:null});
const output={source:'retrospective-robustness-results.json',seeds:RUNS,byScenario,
  total:allCases.length,harmful:harmfulCases.length,
  harmfulRecallLoss:harmfulCases.filter(x=>x.rank.rescued>9).length,
  harmfulWithinTrueTop9:harmfulCases.filter(x=>x.rank.rescued<=9).length,
  allDisplacements:summarize(allCases),harmfulDisplacements:summarize(harmfulCases),
  nonHarmfulDisplacements:summarize(allCases.filter(x=>!x.harmful)),
  rankGapDistribution:gaps,rankPairs:tally(allCases,x=>`${x.rank.rescued}->${x.rank.evicted}`),cases:allCases};
console.log(JSON.stringify(output,null,2));
