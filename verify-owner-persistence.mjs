import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('./invite-sample-assets/app.js',import.meta.url),'utf8');
const state=new Map(),key='bfs-invite-sample-owner-code-v0.1';
const storage={getItem:k=>state.get(k)??null,setItem:(k,v)=>state.set(k,String(v)),removeItem:k=>state.delete(k)};
const sessionStorage={getItem:()=>null,removeItem(){}};
const createPage=({validCode=null}={})=>{
  const elements=new Map(),get=id=>{if(!elements.has(id))elements.set(id,{hidden:false,disabled:false,value:'',textContent:'',children:[],focus(){},replaceChildren(){this.children=[]},append(x){this.children.push(x)},setAttribute(){}});return elements.get(id)};
  const calls=[];
  const context={mountFixtureGame:async()=>{},document:{getElementById:get,createElement:()=>({setAttribute(){}})},location:{href:'https://sample.example/',hostname:'sample.example',hash:'',pathname:'/',search:''},history:{replaceState(){}},localStorage:storage,sessionStorage,navigator:{clipboard:{}},crypto:globalThis.crypto,URL,Date,Set,Promise,console,fetch:async(path,init)=>{
    calls.push({path,body:init.body});
    if(path.endsWith('/v1/sample/owner/claim')){
      const code=JSON.parse(init.body).ownerCode;
      return {ok:code===validCode,status:code===validCode?201:403,json:async()=>code===validCode?{sessionToken:'a'.repeat(64)}:{error:'invalid_owner_code'}};
    }
    return {ok:true,status:200,json:async()=>path.endsWith('/session')?{jstDay:'2026-09-28',inviteAvailable:true,expiresAt:Date.now()+100000}:{cards:['FACE 01']}};
  }};
  vm.runInNewContext(source.replace(/^import[^\n]+\n/,''),context);
  return {get,calls};
};
let page=createPage();await new Promise(resolve=>setImmediate(resolve));
const oldCode='b'.repeat(64);
page.get('restoreOwner').onclick();
page.get('ownerCode').value=oldCode;
page.get('ownerCode').oninput();
assert.equal(state.get(key),oldCode);
page=createPage({validCode:oldCode});await new Promise(resolve=>setImmediate(resolve));
assert.equal(page.get('ownerCode').value,oldCode);
await page.get('ownerClaim').onclick();
assert.equal(state.has(key),false);
state.clear();
page=createPage();await new Promise(resolve=>setImmediate(resolve));
await page.get('ownerSetup').onclick();
const code=state.get(key);assert.match(code,/^[a-f0-9]{64}$/);
page=createPage();await new Promise(resolve=>setImmediate(resolve));
assert.equal(page.get('ownerPanel').hidden,false);assert.equal(page.get('ownerCode').value,code);
assert.equal(page.get('ownerSetup').hidden,true);
page=createPage({validCode:code});await new Promise(resolve=>setImmediate(resolve));
assert.equal(page.get('ownerCode').value,code);
await page.get('ownerClaim').onclick();
assert.equal(page.calls.filter(c=>c.path.endsWith('/owner/claim')).length,1);
assert.equal(state.has(key),false);
assert.equal(state.get('bfs-invite-sample-session-v0.1'),'a'.repeat(64));
page=createPage();await new Promise(resolve=>setImmediate(resolve));
assert.equal(page.get('play').hidden,false);
assert.equal(page.get('ownerPanel').hidden,true);
assert.equal(page.get('makeInvite').disabled,false);
console.log('owner storage reload/new-tab restoration, successful claim cleanup, session and invite controls PASS');
