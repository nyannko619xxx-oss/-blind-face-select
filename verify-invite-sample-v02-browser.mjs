import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import crypto from 'node:crypto';
import {chromium} from 'playwright';

const cfg=JSON.parse(readFileSync('.owner-repair.wrangler.json','utf8'));
const origin=process.env.SAMPLE_ORIGIN;
if(!origin||!process.env.CLOUDFLARE_API_TOKEN)throw Error('test_environment_missing');
const query=async(sql,params=[])=>{
  const url=`https://api.cloudflare.com/client/v4/accounts/${cfg.account_id}/d1/database/${cfg.d1_databases[0].database_id}/query`;
  const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({sql,params})});
  if(!response.ok)throw Error('d1_http_'+response.status);
  const data=await response.json();if(!data.success||!data.result?.[0]?.success)throw Error('d1_query_failed');return data.result[0].results;
};
const random=()=>crypto.randomBytes(32).toString('hex');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const token=random(),id=random(),now=Date.now();let inviteHash=null,browser;
const play=async page=>{
  await page.getByRole('button',{name:'選考を始める'}).click();
  let saw5=false,saw4=false,saw3=false,reloaded=false;
  for(let i=0;i<140;i++){
    if(await page.getByRole('heading',{name:'あなたのTOP9'}).isVisible()){assert.equal(await page.locator('#gameRanking li').count(),9);return {screens:i,saw5,saw4,saw3,reloaded}}
    const cards=page.locator('.game-face');const n=await cards.count();saw5 ||= n===5;saw4 ||= n===4;saw3 ||= n===3;
    const progress=await page.locator('#gameProgress').innerText();
    await cards.first().click();if(progress.includes('2人まで')&&n>=2)await cards.nth(1).click();
    await page.getByRole('button',{name:'次へ進む'}).click();
    if(i===10){await page.reload();await page.getByRole('button',{name:'顔だけで選ぶ｜体験版'}).click();await page.locator('.game-face').first().waitFor();reloaded=true}
  }
  throw Error('top9_not_reached');
};
try{
  await query('INSERT INTO anonymous_sessions (session_id, token_hash, claimed_invite_hash, created_at, expires_at) VALUES (?, ?, NULL, ?, ?)',[id,hash(token),now,now+3600000]);
  browser=await chromium.launch({headless:true});
  const sender=await browser.newContext(),page=await sender.newPage();
  await page.goto(origin+'/#session='+token);
  await page.getByRole('button',{name:'顔だけで選ぶ｜体験版'}).click();
  await page.getByRole('heading',{name:'顔だけで選んでみる'}).waitFor();
  const first=await play(page);assert(first.saw5&&first.saw4&&first.saw3&&first.reloaded);
  await page.getByRole('button',{name:'ホームへ'}).click();
  await page.getByRole('button',{name:'友だちを招待する'}).click();
  await page.getByRole('button',{name:'招待リンクを作る'}).click();
  await page.locator('#shareArea').waitFor({state:'visible'});
  const link=await page.locator('#inviteLink').inputValue();assert(link.startsWith(origin+'/index.html#invite='));inviteHash=hash(link.split('#invite=')[1]);
  const recipient=await browser.newContext(),second=await recipient.newPage();
  await second.goto(link);await second.getByRole('button',{name:'招待を受け取る'}).click();
  await second.getByRole('button',{name:'顔だけで選ぶ｜体験版'}).click();
  await second.getByRole('heading',{name:'顔だけで選んでみる'}).waitFor();
  const secondRun=await play(second);await second.getByRole('button',{name:'ホームへ'}).click();await second.getByRole('button',{name:'友だちを招待する'}).click();assert.equal(await second.getByRole('button',{name:'招待リンクを作る'}).isEnabled(),true);
  const reuse=await browser.newContext(),third=await reuse.newPage();await third.goto(link);await third.getByRole('button',{name:'招待を受け取る'}).click();
  await third.getByText('この招待は使用済み、または期限切れです。').waitFor();
  console.log(JSON.stringify({result:'PASS',senderScreens:first.screens,recipientScreens:secondRun.screens,sender5_4_3:first.saw5&&first.saw4&&first.saw3,recipientTop9:9,oneTime:true}));
}finally{
  if(browser)await browser.close();
  try{
    const child=inviteHash?await query('SELECT session_id FROM anonymous_sessions WHERE claimed_invite_hash = ?',[inviteHash]):[];
    const ids=[id,...child.map(row=>row.session_id)];
    for(const sessionId of ids)await query('DELETE FROM single_use_invites WHERE issuer_session_id = ?',[sessionId]);
    if(inviteHash)await query('DELETE FROM anonymous_sessions WHERE claimed_invite_hash = ?',[inviteHash]);
    await query('DELETE FROM anonymous_sessions WHERE session_id = ?',[id]);
  }catch{console.error('temp_fixture_cleanup_failed');process.exitCode=1}
}
