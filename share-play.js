import {SET_IDS} from './candidate-provision.js';
export function newPlayerUrl(shared,fromUrl){
  const next=new URL('app.html',fromUrl);
  if(SET_IDS.includes(shared.setId))next.searchParams.set('set',shared.setId);
  if(shared.masterVersion)next.searchParams.set('version',shared.masterVersion);
  if(shared.version)next.searchParams.set('setVersion',shared.version);
  if(shared.provisionCapability)next.hash='invite='+shared.provisionCapability;
  return next.href;
}
