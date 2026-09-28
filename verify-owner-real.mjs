import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateOwnerMaster,startoSnapshot} from './invite-sample-assets/owner-master.js';
import {createSelection,nextQuestion,submitChoice,selectionAudit} from './invite-sample-assets/selection-engine.js';
const ids=Array.from({length:263},(_,i)=>'fake-'+i);
const m={schema_version:3,master_version:'starto-junior-2026-09-28',candidate_master:ids.map((id,i)=>({candidate_id:id,identity_id:'identity-'+i,display_name:'架空 '+i,image_source_url:'https://example.invalid/'+i+'.jpg',official_profile_url:'https://example.invalid/'+i})),candidate_sets:{STARTO_SELECT:{version:'starto-105-2026-09-28',ids:ids.slice(0,105)},JUNIOR_SELECT:{version:'junior-158-2026-09-28',ids:ids.slice(105)},ALL_SELECT:{version:'all-263-2026-09-28',ids}}};
assert.equal(validateOwnerMaster(m),m);const snapshot=startoSnapshot(m);assert.equal(snapshot.candidates.length,105);assert.equal(snapshot.setVersion,'starto-105-2026-09-28');
assert.throws(()=>validateOwnerMaster({...m,candidate_sets:{...m.candidate_sets,STARTO_SELECT:{...m.candidate_sets.STARTO_SELECT,ids:[...ids.slice(0,104),ids[105]]}}}));
assert.throws(()=>validateOwnerMaster({...m,candidate_master:[...m.candidate_master.slice(0,262),{...m.candidate_master[262],image_source_url:'http://example.invalid/photo'}]}));
const counts=[];for(let seed=1;seed<=40;seed++){
  const state=createSelection(snapshot.candidates.map(c=>c.candidate_id),{lateSize:3,recheckMode:'baseline',seed});let q;
  while((q=nextQuestion(state))){counts.push(q.ids.length);submitChoice(state,q.ids.slice(0,q.max),{uncertain:false});if(state.history.length>120)throw Error('unbounded_test')}
  assert.equal(state.ranking.length,9);assert.equal(selectionAudit(state).screens,state.history.length);
}
assert([5,4,3].every(n=>counts.includes(n)));
const app=readFileSync('invite-sample-assets/app.js','utf8');
assert(app.includes('me.owner')&&app.includes('mountOwnerRealGame')&&app.includes('mountFixtureGame'));
const source=readFileSync('invite-sample-assets/real-game.js','utf8');
assert(!/fetch\(|sendBeacon|XMLHttpRequest/.test(source));
console.log('owner-only routing, frozen STARTO 105, private schema rejection, unchanged 5/4/3 engine and TOP9 PASS');
