// UI-only synthetic Owner session; no real catalog or image URL is used by CI.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const origin=process.env.SAMPLE_ORIGIN;if(!origin)throw Error('test_origin_missing');
const ids=Array.from({length:263},(_,i)=>'fake-'+i);
const master={schema_version:3,master_version:'starto-junior-2026-09-28',candidate_master:ids.map((id,i)=>({candidate_id:id,identity_id:'person-'+i,display_name:'架空氏名'+i,group:'架空組',image_source_url:'https://example.invalid/face-'+i+'.svg',official_profile_url:'https://example.invalid/profile-'+i})),candidate_sets:{STARTO_SELECT:{version:'starto-105-2026-09-28',ids:ids.slice(0,105)},JUNIOR_SELECT:{version:'junior-158-2026-09-28',ids:ids.slice(105)},ALL_SELECT:{version:'all-263-2026-09-28',ids}}};
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext(),page=await context.newPage();let candidateUpload=0;
  page.on('request',r=>{if(r.method()!=='GET'&&r.postData()?.includes('fake-'))candidateUpload++});
  await page.route('**/v1/sample/session',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({active:true,owner:true,inviteAvailable:true,expiresAt:Date.now()+3600000})}));
  await page.route('**/v1/sample/fixture',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({cards:[1,2,3,4,5]})}));
  await page.route('https://example.invalid/**',route=>route.fulfill({status:200,contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="120" height="160"><rect width="120" height="160" fill="#34445a"/></svg>'}));
  await page.goto(origin+'/#session='+'a'.repeat(64));
  await page.locator('.mode-card[data-set="STARTO_SELECT"]').click();
  await page.locator('.owner-setup input[type=file]').waitFor();
  await page.locator('.owner-setup input[type=file]').setInputFiles({name:'private-test.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(master))});
  await page.getByRole('button',{name:'選考を始める'}).click();
  let seen=new Set(),resumed=false,screens=0;
  for(;screens<110;screens++){
    if(await page.locator('.owner-result').isVisible())break;
    const cards=page.locator('.owner-selection .game-face'),n=await cards.count();seen.add(n);
    assert.equal(await page.getByText('架空氏名0').count(),0,'blind_name_leak');
    const before=await page.locator('.owner-selection p').first().textContent();
    await cards.first().click();
    await page.getByRole('button',{name:'次へ進む'}).click();
    await page.waitForFunction(previous=>!document.querySelector('.owner-result').hidden||document.querySelector('.owner-selection p')?.textContent!==previous,before);
    if(screens===11){await page.reload();await page.locator('.mode-card[data-set="STARTO_SELECT"]').click();await page.locator('.owner-selection .game-face').first().waitFor();resumed=true}
  }
  assert.equal(await page.locator('.board-card').count(),9);assert(seen.has(5)&&seen.has(4)&&seen.has(3)&&resumed);assert.equal(candidateUpload,0);
  assert.equal(await page.locator('.board-card.is-revealed').count(),0);
  assert((await page.locator('.board-caption').allTextContents()).every(x=>!x));
  assert.equal(await page.locator('.board-card.is-next').getAttribute('data-rank'),'9');
  for(const rank of [9,8])await page.locator(`.board-card[data-rank="${rank}"]`).click();
  await page.locator('.board-card.is-next[data-rank="7"]').waitFor();
  assert.equal(await page.locator('.board-card.is-revealed').count(),2);
  await page.reload();await page.locator('.mode-card[data-set="STARTO_SELECT"]').click();
  await page.locator('.board-card.is-next[data-rank="7"]').waitFor();
  assert.equal(await page.locator('.board-card.is-revealed').count(),2);
  assert.equal(await page.locator('.board-card.is-next').getAttribute('data-rank'),'7');
  for(const rank of [7,6,5,4,3,2,1]){
    const started=Date.now();await page.locator(`.board-card[data-rank="${rank}"]`).click();
    if(rank>1)await page.locator(`.board-card.is-next[data-rank="${rank-1}"]`).waitFor();
    else await page.locator('.board.is-final').waitFor();
    if(rank===3)assert(Date.now()-started>=300,'third_place_beat_missing');
    if(rank===2)assert(Date.now()-started>=450,'second_place_beat_missing');
    if(rank===1)assert(Date.now()-started>=750,'first_place_beat_missing');
  }
  await page.locator('.board.is-final .board-card.is-revealed').first().waitFor();assert.equal(await page.locator('.board-card.is-revealed').count(),9);
  await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.board-card[data-rank="1"]')).transform.match(/matrix\(([^,]+)/)?.[1])>1.06);
  const emphasis=await page.locator('.board-card[data-rank="1"],.board-card[data-rank="2"]').evaluateAll(cards=>cards.map(c=>Number(getComputedStyle(c).transform.match(/matrix\(([^,]+)/)?.[1])));
  assert(emphasis[0]>emphasis[1],'first_place_focus_missing');
  await page.reload();await page.locator('.mode-card[data-set="STARTO_SELECT"]').click();await page.locator('.board.is-final').waitFor();assert.equal(await page.locator('.board-card.is-revealed').count(),9);
  await page.getByRole('button',{name:'もう一度Reveal'}).click();await page.locator('.board-card.is-next[data-rank="9"]').waitFor();assert.equal(await page.locator('.board-card.is-revealed').count(),0);
  assert.equal(await page.locator('.board-card.is-next').getAttribute('data-rank'),'9');
  for(let rank=9;rank>=1;rank--)await page.locator(`.board-card[data-rank="${rank}"]`).click();
  await page.locator('.board.is-final').waitFor();
  // A result saved by the prior auto-Reveal version has no revealCount.
  await page.evaluate(async()=>{
    const token='a'.repeat(64),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');
    const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('bfs-owner-real-test-v01',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
    await new Promise((resolve,reject)=>{const tx=db.transaction('private','readwrite'),store=tx.objectStore('private'),key='owner-progress:'+hash,req=store.get(key);
      req.onsuccess=()=>{const record=req.result;delete record.revealCount;store.put(record,key)};tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
    });db.close();
  });
  await page.reload();await page.locator('.mode-card[data-set="STARTO_SELECT"]').click();await page.locator('.board.is-final').waitFor();assert.equal(await page.locator('.board-card.is-revealed').count(),9);
  await page.getByRole('button',{name:'もう一度Reveal'}).click();await page.locator('.board-card.is-next[data-rank="9"]').waitFor();
  await page.getByRole('button',{name:'ホームへ'}).click();
  for(const setId of ['JUNIOR_SELECT','ALL_SELECT']){
    await page.locator(`.mode-card[data-set="${setId}"]`).click();
    await page.getByRole('button',{name:'選考を始める'}).click();
    await page.locator('.owner-selection .game-face').first().waitFor();
    assert.equal(await page.locator('.owner-selection .game-face').count(),5);
    await page.reload();await page.locator(`.mode-card[data-set="${setId}"]`).click();
    await page.locator('.owner-selection .game-face').first().waitFor();
    assert.equal(await page.locator('.owner-selection .game-face').count(),5);
    await page.getByRole('button',{name:'ホームへ'}).click();
  }
  assert.equal(candidateUpload,0);
  console.log(JSON.stringify({result:'PASS',syntheticOwner:true,startoScreens:screens,display5_4_3:true,resume:true,top9:true,junior158:true,all263:true,candidateUpload:false}));
}finally{await browser.close()}
