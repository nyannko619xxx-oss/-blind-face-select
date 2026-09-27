import assert from 'node:assert/strict';
import {createSelection} from './selection-engine.js';

const count=140,events=[],screenOmissions=[],protectionRescues=[],allTagged=[];
const by=(xs,fn)=>Object.fromEntries([...Map.groupBy(xs,fn)].map(([k,v])=>[k,v.length]));
for(let seed=0;seed<500;seed++){
  const ids=Array.from({length:count},(_,i)=>`c${i}`),score=id=>(Number(id.slice(1))*977+seed*131)%count;
  const truth=[...ids].sort((a,b)=>score(b)-score(a)),rank=id=>truth.indexOf(id)+1;
  const state=new Map(ids.map(id=>[id,{wins:0,losses:0,prior:[]}]));
  const order=createSelection(ids,{seed}).remaining;
  const snapshot=id=>{const s=state.get(id);return {wins:s.wins,losses:s.losses,previousOpponents:s.prior.map(x=>({stage:x.stage,opponentRanks:x.opponents.map(rank),chosenRanks:x.chosen.map(rank)}))}};
  function round(items,size,n,stage){const out=[];for(let i=0;i<items.length;i+=size){
    const group=items.slice(i,i+size),chosen=[...group].sort((a,b)=>score(b)-score(a)).slice(0,Math.min(n,group.length));
    const omitted=group.filter(id=>!chosen.includes(id));
    for(const id of omitted){const e={seed,id,rank:rank(id),stage,groupRanks:group.map(rank),selectedRanks:chosen.map(rank),
      // The cutoff is an analyst's reconstruction; the UI only asks for a set.
      cutoffRank:chosen.length?rank(chosen.at(-1)):null,
      cutoffGap:chosen.length?score(chosen.at(-1))-score(id):null,
      prior:snapshot(id),selectedPrior:chosen.map(snapshot)};
      if(e.rank<=9)events.push(e);
      if(stage==='screen')screenOmissions.push(e);
    }
    for(const id of group){const s=state.get(id);if(chosen.includes(id))s.wins++;else s.losses++;
      s.prior.push({stage,opponents:group.filter(x=>x!==id),chosen})}
    out.push(...chosen);
  }return out}
  const preliminary=round(order,5,2,'preliminary'),main=round(preliminary,4,2,'main');
  const mainWinners=new Set(main);
  const screen=round(main,4,3,'screen');
  assert.equal(screen.length,21);
  for(const e of screenOmissions.filter(x=>x.seed===seed)){
    const p=e.prior.previousOpponents.find(x=>x.stage==='preliminary');
    const fellowSelected=p.chosenRanks.filter(n=>n!==e.rank).map(n=>truth[n-1]);
    e.preliminaryBuddySurvivedMain=fellowSelected.some(id=>mainWinners.has(id));
    e.selectedPriorWins=e.selectedPrior.map(x=>x.wins);
    e.priorDefeatedWins=e.prior.previousOpponents.flatMap(x=>x.opponentRanks.filter(n=>!x.chosenRanks.includes(n)).map(n=>state.get(truth[n-1]).wins));
  }
  const discarded=events.filter(e=>e.seed===seed&&e.stage==='screen');
  let tagged=0;for(const e of screenOmissions.filter(x=>x.seed===seed)){
    if(e.groupRanks.length===4&&e.cutoffGap<=14&&tagged<6){tagged++;allTagged.push(e);if(e.rank<=9)protectionRescues.push(e)}
  }
  assert.equal(discarded.filter(e=>!protectionRescues.some(x=>x.seed===seed&&x.id===e.id)).length,0);
}
const lost=events,screen=lost.filter(x=>x.stage==='screen'),topOutside=screenOmissions.filter(x=>x.rank>9);
const gapHistogram=xs=>by(xs,x=>x.cutoffGap);
function summary(xs){return {total:xs.length,byStage:by(xs,x=>x.stage),byRank:by(xs,x=>x.rank),rankGroups:by(xs,x=>x.rank<=7?'1–7':String(x.rank)),
  cutoffRank:by(xs,x=>x.cutoffRank),cutoffTop9:by(xs,x=>x.cutoffRank<=9?'TOP9':'outside'),
  selectedAllTop9:by(xs,x=>x.selectedRanks.every(n=>n<=9)),
  priorWins:by(xs,x=>x.prior.wins),priorLosses:by(xs,x=>x.prior.losses),
  cutoffGap:{min:Math.min(...xs.map(x=>x.cutoffGap)),max:Math.max(...xs.map(x=>x.cutoffGap)),mean:xs.reduce((n,x)=>n+x.cutoffGap,0)/xs.length},
  repeatedIds:[...Map.groupBy(xs,x=>x.id)].sort((a,b)=>b[1].length-a[1].length).slice(0,5).map(([id,v])=>[id,v.length])};}
const out={count,seeds:500,allTop9Loss:summary(lost),screenTop9Loss:summary(screen),screenOutsideTop9Omitted:summary(topOutside),rescuedByD:summary(protectionRescues),
  localSignals:{screenTop9:{buddyMainWin:by(screen,x=>x.preliminaryBuddySurvivedMain),selectedPriorWins:by(screen,x=>x.selectedPriorWins.join(',')),priorDefeatedWins:by(screen,x=>x.priorDefeatedWins.join(',')),gapHistogram:gapHistogram(screen)},
    outsideTop9:{buddyMainWin:by(topOutside,x=>x.preliminaryBuddySurvivedMain),selectedPriorWins:by(topOutside,x=>x.selectedPriorWins.join(',')),priorDefeatedWins:by(topOutside,x=>x.priorDefeatedWins.join(',')),gapHistogram:gapHistogram(topOutside)}},
  protectionTotals:{rescued:protectionRescues.length,totalTags:allTagged.length,taggedNonTop9:allTagged.filter(x=>x.rank>9).length},
  screenExamples:screen.slice(0,5).map(x=>({seed:x.seed,id:x.id,rank:x.rank,groupRanks:x.groupRanks,selectedRanks:x.selectedRanks,cutoffRank:x.cutoffRank,cutoffGap:x.cutoffGap,priorWins:x.prior.wins,priorLosses:x.prior.losses}))};
console.log(JSON.stringify(out));
