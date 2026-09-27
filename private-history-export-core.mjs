// Read-only projection of existing app sessions. No selection engine import.
export const STORAGE_KEY='blind-face-select-v2';
const isString=v=>typeof v==='string'&&v.length>0;
export function availableSessions(db){
  if(!db||typeof db!=='object'||!db.sessions||typeof db.sessions!=='object')return [];
  const rows=[];
  for(const [playerId,s] of Object.entries(db.sessions))rows.push({playerId,source:'latest',archiveIndex:null,session:s});
  for(const [playerId,list] of Object.entries(db.archive||{}))if(Array.isArray(list))list.forEach((session,archiveIndex)=>rows.push({playerId,source:'archive',archiveIndex,session}));
  return rows.filter(x=>x.session?.type==='catalog'&&x.session?.state?.phase==='complete'&&x.session?.completedAt);
}
export function projectSession(row,exportedAt=new Date().toISOString()){
  const s=row?.session, snap=s?.selectionSnapshot, candidates=snap?.candidates, h=s?.state?.history, ranking=s?.state?.ranking;
  if(!s||!Array.isArray(candidates)||!Array.isArray(h)||!Array.isArray(ranking)||ranking.length!==9||!isString(s.setVersion)||!isString(s.createdAt)||!isString(s.completedAt))throw Error('選考Snapshotまたは履歴が不足しています。');
  const ids=candidates.map(c=>c?.id),known=new Set(ids);
  if(ids.some(id=>!isString(id))||known.size!==ids.length||!ranking.every(id=>known.has(id))||new Set(ranking).size!==9)throw Error('候補IDまたはTOP9が不正です。');
  const events=h.map((e,i)=>{
    if(!['preliminary','main','late','recovery','boundary','rank'].includes(e?.phase)||!Array.isArray(e.shown)||!Array.isArray(e.chosen)||e.shown.some(id=>!known.has(id))||e.chosen.some(id=>!e.shown.includes(id))||new Set(e.shown).size!==e.shown.length||new Set(e.chosen).size!==e.chosen.length)throw Error(`履歴 ${i+1} の参照先が不正です。`);
    return {event_sequence:i+1,phase:e.phase,shown_ids:[...e.shown],chosen_ids:[...e.chosen],uncertain:!!e.uncertain};
  });
  return {schema:'bfs-private-selection-history-v0.1',exported_at:exportedAt,
    provenance:{storage_key:STORAGE_KEY,source:row.source,archive_index:row.archiveIndex,player_id:row.playerId,session_ref:`${row.playerId}:${s.createdAt}`,created_at:s.createdAt,completed_at:s.completedAt,updated_at:s.updatedAt||null,session_type:s.type},
    selection_snapshot:{captured_at:snap.capturedAt||s.createdAt,set_id:snap.setId||s.setId,set_version:snap.setVersion||s.setVersion,master_version:s.masterVersion||null,visual_mode:snap.visualMode||s.visualMode||'NORMAL',candidate_ids:ids},
    final_ranking_ids:[...ranking],events,
    event_time_note:'既存履歴に各回答の時刻はありません。event_sequenceが表示順です。'};
}
