// Experimental pilot scheduling and audit only. No production engine imports.
export const ARM = Object.freeze({SINGLE:'single', SAME:'same_repeat', REFRAME:'reframed_confirmation'});
export function validatePairs(data, catalogIds) {
  const pairs=data?.pairs;
  if(!Array.isArray(pairs)||pairs.length<20||pairs.length>30||pairs.length%3!==0)
    throw Error('Pairは20〜30組、3条件へ均等に割り付けられる数（21/24/27/30組）にしてください。');
  const pairIds=new Set(),keys=new Set();
  for(const p of pairs){
    if(!p||typeof p.pair_id!=='string'||!/^[A-Za-z0-9_-]{1,48}$/.test(p.pair_id)||pairIds.has(p.pair_id))throw Error('pair_idが未設定または重複しています。');
    const a=p.a_id,b=p.b_id;
    if(typeof a!=='string'||typeof b!=='string'||a===b||!catalogIds.has(a)||!catalogIds.has(b))throw Error(`Pair ${p.pair_id} の候補IDをCatalogと照合できません。`);
    const key=[a,b].sort().join('\u0000');if(keys.has(key))throw Error('同じ候補Pairが重複しています。');
    pairIds.add(p.pair_id);keys.add(key);
  }
  return pairs.map(p=>({pair_id:p.pair_id,a_id:p.a_id,b_id:p.b_id}));
}
export function shuffle(items,random=Math.random){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
export function buildSchedule(pairs,random=Math.random){
  if(pairs.length%3)throw Error('均等割付が必要です。');
  const shuffled=shuffle(pairs,random),n=pairs.length/3;
  const arms=shuffle([...Array(n).fill(ARM.SINGLE),...Array(n).fill(ARM.SAME),...Array(n).fill(ARM.REFRAME)],random);
  const assigned=shuffled.map((p,i)=>({...p,condition:arms[i],firstLeft:i%2===0?p.a_id:p.b_id}));
  // Randomize first-side assignment independently from condition and pair order.
  for(const arm of Object.values(ARM)){
    const subset=shuffle(assigned.filter(p=>p.condition===arm),random);
    subset.forEach((p,i)=>p.firstLeft=i%2===0?p.a_id:p.b_id);
  }
  const first=assigned.map(p=>({pair_id:p.pair_id,condition:p.condition,pass:'first',left_id:p.firstLeft,right_id:p.firstLeft===p.a_id?p.b_id:p.a_id}));
  // Keeping the randomized first-pass order in the confirmation pass guarantees
  // at least 13 intervening displays even with the minimum 21-pair manifest.
  const confirms=assigned.filter(p=>p.condition!==ARM.SINGLE).map(p=>({pair_id:p.pair_id,condition:p.condition,pass:'confirmation',left_id:p.condition===ARM.REFRAME?(p.firstLeft===p.a_id?p.b_id:p.a_id):p.firstLeft,right_id:p.condition===ARM.REFRAME?p.firstLeft:(p.firstLeft===p.a_id?p.b_id:p.a_id)}));
  const schedule=[...first,...confirms];
  for(const entry of confirms){const a=schedule.findIndex(x=>x.pair_id===entry.pair_id);const b=schedule.indexOf(entry);if(b-a-1<12)throw Error('確認までの間隔が不足しています。')}
  return {assigned,schedule};
}
export function exportData(session){
  const first=new Map(session.responses.filter(r=>r.pass==='first').map(r=>[r.pair_id,r]));
  const confirmations=new Map(session.responses.filter(r=>r.pass==='confirmation').map(r=>[r.pair_id,r]));
  return {schema:'human-boundary-pilot-v0.1',pilot_id:session.pilot_id,manifest_version:session.manifest_version,
    created_at:session.created_at,exported_at:new Date().toISOString(),completed:session.responses.length===session.schedule.length,
    pair_count:session.assigned.length,sequence_count:session.schedule.length,
    presentation_order:session.schedule.map((s,i)=>({sequence:i+1,pair_id:s.pair_id,condition:s.condition,pass:s.pass,left_id:s.left_id,right_id:s.right_id})),
    pairs:session.assigned.map(p=>{const f=first.get(p.pair_id),c=confirmations.get(p.pair_id);return {pair_id:p.pair_id,condition:p.condition,
      first_choice:f?.choice_id??null,confirmation_choice:c?.choice_id??null,agreement:f&&c?f.choice_id===c.choice_id:null,flip:f&&c?f.choice_id!==c.choice_id:null,
      first_left_id:f?.left_id??p.firstLeft,confirmation_left_id:c?.left_id??null,first_response_ms:f?.response_ms??null,confirmation_response_ms:c?.response_ms??null,
      first_sequence:f?.sequence??null,confirmation_sequence:c?.sequence??null,first_timestamp:f?.timestamp??null,confirmation_timestamp:c?.timestamp??null}}),
    responses:session.responses.map(r=>({...r}))};
}
