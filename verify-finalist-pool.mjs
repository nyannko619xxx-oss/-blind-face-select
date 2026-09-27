import assert from 'node:assert/strict';
import {createSelection,nextQuestion,submitChoice,selectionAudit} from './selection-engine.js';

// Experimental simulation only. Preference values are available solely to the
// simulated player's choices and the evaluator, never to candidate scheduling.
const counts=[140,263],modes=['A baseline','B finalist pool','C protected late','D finalist + protected'];
const p95=a=>[...a].sort((x,y)=>x-y)[Math.ceil(.95*a.length)-1];
for(const count of counts){
  const rows=Object.fromEntries(modes.map(x=>[x,[]]));
  for(let seed=0;seed<500;seed++){
    const ids=Array.from({length:count},(_,i)=>`c${i}`);
    const score=id=>(Number(id.slice(1))*977+seed*131)%count;
    const truth=[...ids].sort((a,b)=>score(b)-score(a));
    const isTop=new Set(truth.slice(0,9)),near=new Set(truth.slice(7,12));
    for(const mode of modes){
      const initial=createSelection(ids,{seed,lateSize:count>200?4:3});
      const pool=[...initial.remaining],history=[],show={};
      const compare=(a,b,stage)=>{record([a,b],stage);return score(a)>score(b)?a:b};
      const record=(shown,stage)=>{history.push({shown:[...shown],stage});for(const id of shown)show[id]=(show[id]||0)+1};
      const choose=(shown,n,stage)=>{record(shown,stage);return [...shown].sort((a,b)=>score(b)-score(a)).slice(0,n)};
      const round=(items,size,n,stage)=>{const out=[];for(let i=0;i<items.length;i+=size){const group=items.slice(i,i+size);out.push(...choose(group,Math.min(n,group.length),stage))}return out};
      // Same preliminary and Main grouping/choices in all four policies.
      const preliminary=round(pool,5,2,'preliminary');
      const main=round(preliminary,4,2,'main');
      let candidates=[...main],finalists=[],protectedIds=[],lateSurvivors=null;
      const insert=(sorted,id)=>{
        let low=0,high=sorted.length;
        while(low<high){const mid=Math.floor((low+high)/2);if(compare(id,sorted[mid],'pairwise')===id)high=mid;else low=mid+1}
        sorted.splice(low,0,id);
      };
      const rankTop9=items=>{
        const ranked=[];
        for(const id of items){
          if(ranked.length<9){insert(ranked,id);continue}
          if(compare(id,ranked[8],'boundary')===id){insert(ranked,id);ranked.pop()}
        }
        return ranked;
      };
      if(mode.startsWith('B')||mode.startsWith('D')){
        // 4-to-3 screening only until 18–24 remain; no exhaustive pairwise round.
        while(candidates.length>24){const next=[];for(let i=0;i<candidates.length;i+=4){
          const group=candidates.slice(i,i+4),chosen=choose(group,Math.min(3,group.length),'screen');next.push(...chosen);
          if(mode.startsWith('D')&&group.length===4){const omitted=group.find(id=>!chosen.includes(id));
            // Optional player signal: close to the last retained face. At most six protected.
            if(protectedIds.length<6&&score(chosen.at(-1))-score(omitted)<=count*.10)protectedIds.push(omitted);
          }
        }candidates=next}
        candidates.push(...protectedIds.filter(id=>!candidates.includes(id)));
        finalists=[...candidates];
        candidates=rankTop9(candidates);
      }else{
        // The current rotating Late rule; C permits a second, explicitly tagged
        // face from a close comparison to challenge the ninth finalist later.
        const tagged=[];
        while(candidates.length>9){const size=Math.min(count>200?4:3,candidates.length-8),group=candidates.splice(0,size);
          const [winner,runner]=[...group].sort((a,b)=>score(b)-score(a));record(group,'late');candidates.push(winner);
          if(mode.startsWith('C')&&runner!==undefined&&score(winner)-score(runner)<=count*.10&&!tagged.includes(runner))tagged.push(runner);
        }
        if(mode.startsWith('C'))protectedIds=[...tagged];
        lateSurvivors=[...candidates];
        finalists=mode.startsWith('C')?[...candidates,...tagged]:[...candidates];
        if(mode.startsWith('C'))candidates=rankTop9(finalists);
        else{
          // Baseline's two post-Late boundary matches are reproduced via the
          // real engine below; this local branch is replaced after run.
          candidates=rankTop9(candidates);
        }
      }
      if(mode==='A baseline'){
        const s=createSelection(ids,{seed,lateSize:count>200?4:3});let q;
        while((q=nextQuestion(s))){if(q.phase==='boundary'&&!lateSurvivors)lateSurvivors=[...s.pool];const picked=[...q.ids].sort((a,b)=>score(b)-score(a)).slice(0,q.max===2?2:1);submitChoice(s,picked)}
        candidates=s.ranking;history.length=0;Object.keys(show).forEach(k=>delete show[k]);
        for(const h of s.history){history.push({shown:h.shown,stage:h.phase});for(const id of h.shown)show[id]=(show[id]||0)+1}
        finalists=s.finalists;
      }
      assert.equal(candidates.length,9);assert.equal(new Set(candidates).size,9);
      assert(candidates.every(id=>ids.includes(id)));
      assert.deepEqual(candidates,[...candidates].sort((a,b)=>score(b)-score(a)));
      const final=new Set(candidates),pre=new Set(preliminary),ma=new Set(main),fi=new Set(finalists),late=new Set(lateSurvivors||[]);
      const stageByRank=truth.slice(0,9).map(id=>!pre.has(id)?'preliminary':!ma.has(id)?'main':final.has(id)?'recovered':mode.startsWith('A')&&!late.has(id)?'late':!fi.has(id)?mode.startsWith('B')||mode.startsWith('D')?'screen':'late':'finalist');
      rows[mode].push({screens:history.length,hits:candidates.filter(id=>isTop.has(id)).length,near:candidates.filter(id=>near.has(id)).length,max:Math.max(...Object.values(show)),
        preliminaryLost:truth.slice(0,9).filter(id=>!pre.has(id)).length,mainLost:truth.slice(0,9).filter(id=>pre.has(id)&&!ma.has(id)).length,
        finalistReached:truth.slice(0,9).filter(id=>fi.has(id)).length,finalistRecovered:truth.slice(0,9).filter(id=>fi.has(id)&&final.has(id)).length,
        lateLost:mode.startsWith('A')?truth.slice(0,9).filter(id=>ma.has(id)&&!late.has(id)).length:mode.startsWith('C')?truth.slice(0,9).filter(id=>ma.has(id)&&!fi.has(id)).length:0,
        screenLost:mode.startsWith('B')||mode.startsWith('D')?truth.slice(0,9).filter(id=>ma.has(id)&&!fi.has(id)).length:0,
        poolSize:finalists.length,protected:protectedIds.length,stageByRank});
    }
  }
  for(const mode of modes){const a=rows[mode],mean=k=>a.reduce((v,r)=>v+r[k],0)/a.length;
    const rankStage=Object.fromEntries(Array.from({length:9},(_,i)=>i+1).map(rank=>[rank,Object.fromEntries(['preliminary','main','late','screen','finalist','recovered'].map(stage=>[stage,a.filter(r=>r.stageByRank[rank-1]===stage).length]))]));
    console.log(JSON.stringify({count,mode,runs:a.length,meanScreens:mean('screens'),p95Screens:p95(a.map(r=>r.screens)),top9:mean('hits'),exact9:a.filter(r=>r.hits===9).length,rank8to12:mean('near'),maxAppearances:Math.max(...a.map(r=>r.max)),preliminaryLost:mean('preliminaryLost'),mainLost:mean('mainLost'),lateLost:mean('lateLost'),screenLost:mean('screenLost'),finalistPoolSize:mean('poolSize'),finalistReached:mean('finalistReached'),finalistRecovered:mean('finalistRecovered'),finalistRecoveryRate:mean('finalistRecovered')/mean('finalistReached'),meanProtected:mean('protected'),rankStage}));
  }
}
