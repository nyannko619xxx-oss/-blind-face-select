import assert from 'node:assert/strict';
import {startLocalSample} from './invite-sample-local.mjs';

const {server,origin}=startLocalSample({port:8791});
try{
  await new Promise(resolve=>server.once('listening',resolve));
  const html=await fetch(origin+'/index.html');assert.equal(html.status,200);assert.match(await html.text(),/匿名招待 Sample v0\.1/);
  const script=await fetch(origin+'/app.js');assert.equal(script.status,200);assert.match(await script.text(),/navigator\.share/);
  const denied=await fetch(origin+'/v1/sample/fixture');assert.equal(denied.status,401);
  const boot=await fetch(origin+'/dev/owner',{redirect:'manual'});assert.equal(boot.status,302);
  const sessionToken=new URL(boot.headers.get('location'),origin).hash.slice('#session='.length);
  const fixture=await fetch(origin+'/v1/sample/fixture',{headers:{Authorization:'Bearer '+sessionToken}});assert.equal((await fixture.json()).cards.length,5);
  const invite=await fetch(origin+'/v1/sample/invites',{method:'POST',headers:{Authorization:'Bearer '+sessionToken,Origin:origin}});assert.equal(invite.status,201);
  const {inviteToken}=await invite.json();
  const claim=await fetch(origin+'/v1/sample/claim',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({inviteToken})});assert.equal(claim.status,201);
  const recipient=(await claim.json()).sessionToken;
  const recipientFixture=await fetch(origin+'/v1/sample/fixture',{headers:{Authorization:'Bearer '+recipient}});assert.equal(recipientFixture.status,200);
  const reuse=await fetch(origin+'/v1/sample/claim',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({inviteToken})});assert.equal(reuse.status,410);
  console.log('Invite Sample HTTP PASS: static UI, local owner, protected fixture, issue, recipient claim and reuse rejection');
}finally{await new Promise(resolve=>server.close(resolve))}
