// Read-only structural validation. Pass a private JSON path; never commit that file.
import {readFileSync} from 'node:fs';

export function validateMaster(d) {
  const fail = message => { throw new Error(message) };
  if (d?.schema_version !== 3 || !/^\d{4}-\d{2}-\d{2}$/.test(d.snapshot_frozen_at || '')) fail('schema or frozen date');
  if (!Array.isArray(d.candidate_master) || d.candidate_master.length < 9) fail('candidate master');
  const ids = new Set(), profiles = new Set();
  for (const c of d.candidate_master) {
    if (!c.candidate_id || c.identity_id !== c.candidate_id || ids.has(c.identity_id)) fail('duplicate/missing permanent identity');
    ids.add(c.identity_id);
    if (!c.display_name || !c.official_profile_url?.startsWith('https://') || !c.image_source_url?.startsWith('https://')) fail('profile/image source');
    if (profiles.has(c.official_profile_url)) fail('duplicate profile');
    profiles.add(c.official_profile_url);
    if (!['STARTO','JUNIOR'].includes(c.official_category) || c.current_affiliation?.category !== c.official_category) fail('category');
    if (!Array.isArray(c.affiliation_history) || !Array.isArray(c.identity_source_keys)) fail('history/identity schema');
    for (const e of [c.current_affiliation.category_evidence,c.current_affiliation.group_evidence,c.image_evidence,...c.affiliation_history.map(h=>h.evidence)]) {
      if (!e?.source_type || !e.source_url?.startsWith('https://') || !e.observed_at || !e.status || !Object.hasOwn(e,'effective_at')) fail('evidence');
    }
  }
  const sets = d.candidate_sets, a=sets?.STARTO_SELECT, j=sets?.JUNIOR_SELECT, all=sets?.ALL_SELECT;
  if (![a,j,all].every(s=>s?.version && s.frozen_at===d.snapshot_frozen_at && Array.isArray(s.ids))) fail('frozen sets');
  for (const s of [a,j,all]) if (new Set(s.ids).size!==s.ids.length || s.ids.some(id=>!ids.has(id))) fail('set IDs');
  if (a.ids.some(id=>j.ids.includes(id)) || all.ids.length!==ids.size || new Set([...a.ids,...j.ids]).size!==ids.size || all.ids.some(id=>![...a.ids,...j.ids].includes(id))) fail('set partition');
  const byId=new Map(d.candidate_master.map(c=>[c.identity_id,c]));
  if (a.ids.some(id=>byId.get(id).official_category!=='STARTO') || j.ids.some(id=>byId.get(id).official_category!=='JUNIOR')) fail('category membership');
  return {master_version:d.master_version, frozen_at:d.snapshot_frozen_at, total:ids.size, starto:a.ids.length, junior:j.ids.length, all:all.ids.length, identity_duplicates:0};
}

if (process.argv[1]?.endsWith('validate-private-master.mjs')) {
  if (!process.argv[2]) {console.error('Usage: node validate-private-master.mjs /private/path/master.json');process.exit(2)}
  // Print only counts and versions, never candidate names or URLs.
  console.log(JSON.stringify(validateMaster(JSON.parse(readFileSync(process.argv[2],'utf8'))),null,2));
}
