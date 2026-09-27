import assert from 'node:assert/strict';
import {ARM,validatePairs,buildSchedule,exportData} from './human-boundary-core.mjs';
for(const count of [21,24,27,30])for(let seed=1;seed<=100;seed++){
  const ids=new Set(Array.from({length:count*2},(_,i)=>`c${i}`));
  const source={pairs:Array.from({length:count},(_,i)=>({pair_id:`P${i}`,a_id:`c${i*2}`,b_id:`c${i*2+1}`}))};
  let state=seed;const random=()=>((state=Math.imul(state,1664525)+1013904223|0)>>>0)/4294967296;
  const pairs=validatePairs(source,ids),{assigned,schedule}=buildSchedule(pairs,random);
  assert.equal(schedule.length,count+count/3*2);
  for(const arm of Object.values(ARM)){
    const entries=assigned.filter(x=>x.condition===arm);assert.equal(entries.length,count/3);
    const sides=entries.filter(x=>x.firstLeft===x.a_id).length;assert.ok(Math.abs(sides-entries.length/2)<=.5);
  }
  for(const p of assigned){
    const first=schedule.findIndex(x=>x.pair_id===p.pair_id),confirm=schedule.findIndex((x,i)=>i>=count&&x.pair_id===p.pair_id);
    assert.ok(first<count);
    if(p.condition===ARM.SINGLE){assert.equal(confirm,-1);continue}
    assert.ok(confirm-first-1>=12);
    assert.equal(schedule[confirm].left_id,p.condition===ARM.SAME?schedule[first].left_id:schedule[first].right_id);
  }
  const s={pilot_id:'test',manifest_version:'test',created_at:'2026-01-01',assigned,schedule,responses:[
    {sequence:1,pair_id:schedule[0].pair_id,pass:'first',choice_id:schedule[0].left_id,left_id:schedule[0].left_id,response_ms:500,timestamp:'2026-01-01'},
    {sequence:count+1,pair_id:schedule[count].pair_id,pass:'confirmation',choice_id:schedule[count].right_id,left_id:schedule[count].left_id,response_ms:600,timestamp:'2026-01-02'}]};
  const exported=exportData(s);assert.equal(exported.pairs.length,count);
  assert.equal(exported.presentation_order.length,schedule.length);
  assert.equal(exported.responses.length,2);
  const firstPair=exported.pairs.find(p=>p.pair_id===schedule[0].pair_id);
  assert.equal(firstPair.first_choice,schedule[0].left_id);
  assert.equal(firstPair.first_response_ms,500);
  assert.equal(exported.pairs.filter(p=>p.condition===ARM.SINGLE).every(p=>p.confirmation_choice===null),true);
}
const simple={pilot_id:'test',manifest_version:'v',created_at:'now',assigned:[{pair_id:'P',condition:ARM.REFRAME,firstLeft:'a',a_id:'a',b_id:'b'}],schedule:[{pair_id:'P',condition:ARM.REFRAME,pass:'first',left_id:'a',right_id:'b'},{pair_id:'P',condition:ARM.REFRAME,pass:'confirmation',left_id:'b',right_id:'a'}],responses:[{pair_id:'P',pass:'first',choice_id:'a',left_id:'a',response_ms:300,sequence:1,timestamp:'t1'},{pair_id:'P',pass:'confirmation',choice_id:'b',left_id:'b',response_ms:450,sequence:2,timestamp:'t2'}]};
assert.equal(exportData(simple).pairs[0].flip,true);
assert.equal(exportData(simple).pairs[0].agreement,false);
assert.throws(()=>validatePairs({pairs:Array(21).fill({pair_id:'duplicate',a_id:'a',b_id:'b'})},new Set(['a','b'])),/重複/);
console.log('Human Boundary Pilot schedule/schema: 400 configurations PASS');
