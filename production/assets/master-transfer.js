import {validateOwnerMaster} from './owner-master.js';
const enc=new TextEncoder(),dec=new TextDecoder(),AAD=enc.encode('blind-face-select:private-master-invite:v1');
const b64=bytes=>{let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')};
const unb64=text=>Uint8Array.from(atob(text.replaceAll('-','+').replaceAll('_','/')+'='.repeat((4-text.length%4)%4)),c=>c.charCodeAt(0));
export async function sealMaster(master){
  validateOwnerMaster(master);
  const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:AAD},key,enc.encode(JSON.stringify(master)));
  return {key:b64(new Uint8Array(await crypto.subtle.exportKey('raw',key))),bundle:{version:master.master_version,iv:b64(iv),ciphertext:b64(new Uint8Array(ciphertext))}};
}
export async function openMaster(bundle,keyText){
  if(bundle?.version!=='starto-junior-2026-09-28'||!(/^[A-Za-z0-9_-]{43}$/).test(keyText||'')||!(/^[A-Za-z0-9_-]{16}$/).test(bundle.iv||'')||!(/^[A-Za-z0-9_-]{1,1800000}$/).test(bundle.ciphertext||''))throw Error('候補データを確認できませんでした。');
  try{
    const key=await crypto.subtle.importKey('raw',unb64(keyText),{name:'AES-GCM'},false,['decrypt']);
    const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(bundle.iv),additionalData:AAD},key,unb64(bundle.ciphertext));
    return validateOwnerMaster(JSON.parse(dec.decode(bytes)));
  }catch{throw Error('候補データを確認できませんでした。')}
}
