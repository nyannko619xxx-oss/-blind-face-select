import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {chromium} from 'playwright';
import {createSelection,nextQuestion,submitChoice} from './selection-engine.js';
const TEST='https://blind-face-select-invite-test-v01.nyannko619xxx.workers.dev';
const PROD='https://blind-face-select-prod-v01.nyannko619xxx.workers.dev';
const oldToken='a'.repeat(64);
const db=new DatabaseSync(':memory:');db.exec(readFileSync('production/schema.sql','utf8'));
const d1={prepare(sql){return {bind(...params){const s=db.prepare(sql);return {async first(){return s.get(...params)||null},async run(){return s.run(...params)}}}}}};
const worker=(await import('./production/worker.mjs')).default;
const env={APP_ORIGIN:PROD,TEST_ORIGIN:TEST,INVITE_DB:d1,TEST_SESSION:{fetch:async request=>new Response(JSON.stringify({owner:request.headers.get('Authorization')==='Bearer '+oldToken,active:true}),{status:request.headers.get('Authorization')==='Bearer '+oldToken?200:401,headers:{'Content-Type':'application/json'}})}};
const ids=Array.from({length:263},(_,i)=>'S'+String(i+1).padStart(3,'0'));
const cards=ids.map((id,i)=>({candidate_id:id,identity_id:'I'+id,display_name:'Person '+id,group:'Group',official_profile_url:'https://example.com/profile/'+id,image_source_url:'https://example.com/image/'+id+'.jpg'}));
const master={schema_version:3,master_version:'starto-junior-2026-09-28',candidate_master:cards,candidate_sets:{
  STARTO_SELECT:{version:'starto-105-2026-09-28',ids:ids.slice(0,105)},
  JUNIOR_SELECT:{version:'junior-158-2026-09-28',ids:ids.slice(105)},
  ALL_SELECT:{version:'all-263-2026-09-28',ids}
}};
const setIds=master.candidate_sets.STARTO_SELECT.ids,state=createSelection(setIds,{seed:8,lateSize:3,recheckMode:'baseline'});
while(true){const q=nextQuestion(state);if(!q)break;submitChoice(state,q.ids.slice(0,q.max))}
assert.equal(state.phase,'complete');
const saved={setId:'STARTO_SELECT',setVersion:'starto-105-2026-09-28',startedAt:'2026-09-28T00:00:00Z',completedAt:'2026-09-28T00:15:00Z',revealCount:9,snapshot:{masterVersion:master.master_version,setId:'STARTO_SELECT',setVersion:'starto-105-2026-09-28',candidates:cards.slice(0,105)},engine:state};
const jrState=createSelection(master.candidate_sets.JUNIOR_SELECT.ids,{seed:9,lateSize:3,recheckMode:'baseline'});
const jrSaved={setId:'JUNIOR_SELECT',setVersion:'junior-158-2026-09-28',startedAt:'2026-09-28T01:00:00Z',completedAt:null,revealCount:0,snapshot:{masterVersion:master.master_version,setId:'JUNIOR_SELECT',setVersion:'junior-158-2026-09-28',candidates:cards.slice(105)},engine:jrState};
const mime=path=>path.endsWith('.html')?'text/html':path.endsWith('.css')?'text/css':'text/javascript';
let browser;
try{
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext();
  const routeRequest=async route=>{
    const req=route.request(),url=new URL(req.url()),isTest=url.origin===TEST,isProd=url.origin===PROD;
    if(url.hostname==='example.com'&&url.pathname.startsWith('/image/'))return route.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==','base64')});
    if(!isTest&&!isProd)return route.abort();
    if(url.pathname.startsWith('/v1/')){
      if(isTest){
        const valid=req.headers().authorization==='Bearer '+oldToken;
        return route.fulfill({status:valid?200:401,contentType:'application/json',body:JSON.stringify(valid?{owner:true,active:true,expiresAt:Date.now()+3600000}:{error:'session_required'})});
      }
      const r=await worker.fetch(new Request(req.url(),{method:req.method(),headers:req.headers(),body:['GET','HEAD'].includes(req.method())?undefined:req.postData()||undefined}),env);
      return route.fulfill({status:r.status,headers:Object.fromEntries(r.headers),body:await r.text()});
    }
    const root=isTest?'invite-sample-assets':'production/assets',name=url.pathname==='/'?'index.html':url.pathname.slice(1);
    if(!/^[\w.-]+$/.test(name))return route.abort();
    try{return route.fulfill({status:200,contentType:mime(name),body:readFileSync(root+'/'+name)})}catch{return route.fulfill({status:404,body:'not_found'})}
  };
  await context.route('**/*',routeRequest);
  const setup=await context.newPage();
  await setup.goto(TEST+'/migration.html');
  await setup.evaluate(async({master,saved,jrSaved,oldToken})=>{
    localStorage.setItem('bfs-invite-sample-session-v0.1',oldToken);
    const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('bfs-owner-real-test-v01',1);r.onupgradeneeded=()=>r.result.createObjectStore('private');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(oldToken))),b=>b.toString(16).padStart(2,'0')).join('');
    await new Promise((resolve,reject)=>{const tx=db.transaction('private','readwrite'),s=tx.objectStore('private');s.put(master,'owner-master:2026-09-28');s.put(saved,'owner-progress:'+hash);s.put(jrSaved,'owner-progress:'+hash+':JUNIOR_SELECT');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
    db.close();
  },{master,saved,jrSaved,oldToken});
  await setup.close();
  const page=await context.newPage();await page.goto(PROD+'/');
  const [popup]=await Promise.all([
    context.waitForEvent('page',{timeout:10000}),
    page.getByRole('button',{name:'以前の結果を引き継ぐ'}).click()
  ]);
  await popup.getByRole('button',{name:'引き継ぎを開始'}).waitFor({state:'visible'});
  await popup.getByRole('button',{name:'引き継ぎを開始'}).click();
  await page.getByRole('button',{name:/STARTO/}).waitFor({timeout:15000});
  assert.match(await page.getByRole('button',{name:/STARTO/}).innerText(),/TOP9を見る/);
  assert.match(await page.getByRole('button',{name:/Junior/}).innerText(),/続きから/);
  await page.getByRole('button',{name:/STARTO/}).click();
  await page.getByRole('heading',{name:'あなたのTOP9'}).waitFor();
  assert.equal(await page.locator('.board-card.is-revealed').count(),9);
  await page.getByRole('button',{name:'もう一度Reveal'}).click();
  await page.waitForFunction(()=>document.querySelectorAll('.board-card').length===9&&document.querySelectorAll('.board-card.is-revealed').length===0);
  assert.equal(await page.locator('.board-card.is-revealed').count(),0);
  await page.reload();await page.getByRole('button',{name:/STARTO/}).click();
  assert.equal(await page.locator('.board-card.is-revealed').count(),0);
  await page.getByRole('button',{name:'ホームへ'}).click();
  await page.getByRole('button',{name:/Junior/}).click();
  await page.waitForFunction(()=>document.querySelector('.owner-selection')?.textContent?.includes('1回目'));
  assert.match(await page.locator('.owner-selection').innerText(),/1回目/);
  const unchanged=await context.newPage();await unchanged.goto(TEST+'/migration.html');
  const original=await unchanged.evaluate(async oldToken=>{
    const db=await new Promise(resolve=>{const r=indexedDB.open('bfs-owner-real-test-v01');r.onsuccess=()=>resolve(r.result)});
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(oldToken))),b=>b.toString(16).padStart(2,'0')).join('');
    return await new Promise(resolve=>{const tx=db.transaction('private','readonly');tx.objectStore('private').get('owner-progress:'+hash).onsuccess=e=>resolve(e.target.result)});
  },oldToken);
  assert.equal(original.revealCount,9);
  await page.getByRole('button',{name:'ホームへ'}).click();
  await page.getByRole('button',{name:'友だちを招待する'}).click();
  await page.getByRole('button',{name:'招待リンクを作る'}).click();
  await page.waitForFunction(()=>document.querySelector('#inviteLink')?.value?.includes('#invite='),null,{timeout:15000}).catch(async()=>{throw Error('invite_link_missing_'+await page.locator('#status').innerText())});
  const link=await page.locator('#inviteLink').inputValue();
  assert.match(link,/#invite=[a-f0-9]{64}&key=[A-Za-z0-9_-]{43}/);
  const recipient=await browser.newContext();await recipient.route('**/*',routeRequest);
  const guest=await recipient.newPage();await guest.goto(link);
  await guest.getByRole('button',{name:'招待を受け取る'}).click();
  await guest.getByRole('button',{name:/STARTO/}).waitFor({timeout:15000});
  await guest.waitForFunction(()=>document.querySelectorAll('#modes .mode-card').length===3);
  assert.equal(await guest.getByRole('button',{name:/Junior/}).count(),1);
  assert.equal(await guest.getByRole('button',{name:/ALL/}).count(),1);
  await guest.getByRole('button',{name:/STARTO/}).click();
  await guest.locator('.owner-intro button').waitFor({state:'visible',timeout:15000}).catch(async()=>{throw Error('recipient_game_missing_'+await guest.locator('#status').innerText())});
  await guest.locator('.owner-intro button').click();
  await guest.locator('.game-face:not([disabled])').first().waitFor({timeout:15000});
  await guest.locator('.game-face:not([disabled])').first().click();
  await guest.getByRole('button',{name:'次へ進む'}).click();
  await guest.waitForFunction(()=>document.querySelector('.owner-selection')?.textContent?.includes('2回目'));
  await guest.reload();await guest.getByRole('button',{name:/STARTO/}).click();
  assert.match(await guest.locator('.owner-selection').innerText(),/2回目/);
  for(let step=0;step<100;step++){
    if(await guest.locator('.owner-result').isVisible())break;
    const before=await guest.locator('.owner-selection p').first().innerText();
    const max=Number(before.match(/から(\d+)人まで選択/)?.[1]||1);
    await guest.waitForFunction(count=>document.querySelectorAll('.game-face:not([disabled])').length>=count,max);
    const cards=guest.locator('.game-face:not([disabled])');
    for(let i=0;i<max;i++)await cards.nth(i).click();
    await guest.getByRole('button',{name:'次へ進む'}).click();
    await guest.waitForFunction(text=>document.querySelector('.owner-result')?.hidden===false||document.querySelector('.owner-selection p')?.textContent!==text,before);
  }
  await guest.getByRole('heading',{name:'あなたのTOP9'}).waitFor({state:'visible'});
  assert.equal(await guest.locator('.board-card').count(),9);
  await guest.reload();await guest.getByRole('button',{name:/STARTO/}).click();
  await guest.locator('.board-card').first().waitFor({state:'visible'});
  assert.equal(await guest.locator('.board-card').count(),9);
  for(let rank=9;rank>=1;rank--)await guest.locator(`.board-card[data-rank="${rank}"]`).click();
  await guest.getByRole('button',{name:'もう一度Reveal'}).waitFor({state:'visible'});
  await guest.getByRole('button',{name:'もう一度Reveal'}).click();
  await guest.waitForFunction(()=>document.querySelectorAll('.board-card.is-revealed').length===0);
  assert.equal(await guest.locator('.board-card.is-revealed').count(),0);
  await guest.getByRole('button',{name:'ホームへ'}).click();await guest.getByRole('button',{name:'友だちを招待する'}).click();
  assert.equal(await guest.getByRole('button',{name:'招待リンクを作る'}).isEnabled(),true);
  console.log('cross-origin migration, saved TOP9, Junior resume, Test preservation, encrypted recipient STARTO selection/resume/TOP9/replay and re-invite PASS');
}finally{if(browser)await browser.close();db.close()}
