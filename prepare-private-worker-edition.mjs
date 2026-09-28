// Human deployment staging only. Output contains the real-person mapping.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {webcrypto} from 'node:crypto';
import {validateMaster,digest} from './candidate-provision.js';
const [input,output]=process.argv.slice(2);
if(!input||!output){console.error('Usage: node prepare-private-worker-edition.mjs PRIVATE_MASTER.json PRIVATE_OUTPUT_DIR');process.exit(2)}
const bytes=await readFile(resolve(input)),data=validateMaster(JSON.parse(bytes.toString('utf8')));
if(!/^[A-Za-z0-9_-]{1,100}$/.test(data.master_version))throw Error('Version cannot be used as an object key');
const root=resolve(output),object=join(root,'masters',data.master_version+'.json');
await mkdir(join(root,'masters'),{recursive:true,mode:0o700});
await writeFile(object,bytes,{flag:'wx',mode:0o600});
const manifest={schema_version:1,master_version:data.master_version,master_url:'/v1/master/'+data.master_version,sha256:await digest(bytes,webcrypto),editions:[]};
await writeFile(join(root,'worker-manifest.json'),JSON.stringify(manifest)+'\n',{flag:'wx',mode:0o600});
console.log('Private Worker edition staged:',data.master_version,data.candidate_master.length,'candidates; upload object only to a private bucket after approval.');
