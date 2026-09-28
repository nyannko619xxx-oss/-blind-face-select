import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=readFileSync(new URL('./catalog.html',import.meta.url),'utf8');
const script=source.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const elements=Object.fromEntries(['catalog','status','faces','backup'].map(id=>[id,{disabled:true,textContent:'',replaceChildren(){}}]));
let clicked=false,blob;
class TestURL extends URL {static createObjectURL(value){blob=value;return 'blob:fixture'}static revokeObjectURL(){}}
const context=vm.createContext({URL:TestURL,Blob,console,setTimeout(){},document:{getElementById:id=>elements[id],body:{append(){}},createElement:()=>({click(){clicked=true},remove(){}})},indexedDB:{open(){const req={result:{transaction(){return {objectStore(){return {get(){return {}}}},set oncomplete(fn){fn()}}},close(){}}};queueMicrotask(()=>req.onsuccess());return req}},queueMicrotask});
vm.runInContext(script,context);
const candidates=Array.from({length:18},(_,i)=>({candidate_id:`fixture-${i}`,display_name:`Fixture ${i}`,image_source_url:`https://example.org/${i}.jpg`,official_profile_url:`https://example.org/${i}`}));
const fixture={master_version:'fixture-2026-09-28',candidate_master:candidates,candidate_sets:{STARTO_SELECT:{version:'s',ids:candidates.slice(0,9).map(c=>c.candidate_id)},JUNIOR_SELECT:{version:'j',ids:candidates.slice(9).map(c=>c.candidate_id)},ALL_SELECT:{version:'a',ids:candidates.map(c=>c.candidate_id)}}};
assert.equal(vm.runInContext('check',context)(fixture),fixture);
context.fixture=fixture;
vm.runInContext('record=async()=>fixture',context);
await elements.backup.onclick();
assert.ok(clicked);
assert.deepEqual(JSON.parse(await blob.text()),fixture);
console.log('Catalog import validation and private JSON backup PASS (synthetic fixture)');
