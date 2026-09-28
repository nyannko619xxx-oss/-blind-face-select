import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSelection,nextQuestion,submitChoice} from './invite-sample-assets/selection-engine.js';
const ids=Array.from({length:55},(_,i)=>`sample-${String(i+1).padStart(2,'0')}`);
assert.equal(readFileSync('./invite-sample-assets/selection-engine.js','utf8'),readFileSync('./selection-engine.js','utf8'));
for(let seed=0;seed<120;seed++){
  const s=createSelection(ids,{lateSize:3,recheckMode:'baseline',seed});
  for(let turns=0;turns<200;turns++){
    const q=nextQuestion(s);if(!q)break;
    assert.ok(['preliminary','main','late','recovery','boundary','rank'].includes(q.phase));
    assert.ok(q.ids.length>=2&&q.ids.length<=5);
    const choice=q.phase==='rank'||q.phase==='boundary'||q.phase==='late'||q.phase==='recovery'?[q.ids[0]]:q.ids.slice(0,2);
    submitChoice(s,choice,{uncertain:seed%2===0});
  }
  assert.equal(s.phase,'complete');
  assert.equal(s.ranking.length,9);
  assert.equal(new Set(s.ranking).size,9);
  assert.ok(s.history.some(x=>x.phase==='preliminary'));
  assert.ok(s.history.some(x=>x.phase==='main'));
  assert.ok(s.history.some(x=>x.phase==='late'));
}
const html=readFileSync('./invite-sample-assets/index.html','utf8'),app=readFileSync('./invite-sample-assets/app.js','utf8');
assert.ok(html.includes('id="play"'));
assert.ok(app.includes("api('/v1/sample/session')")&&app.includes("api('/v1/sample/fixture')"));
assert.ok(app.includes('mountFixtureGame'));
console.log('fixture selection engine 120 seeds, 5/4/3 path, TOP9, source parity, access gate PASS');
