// Private staging helper. Do not commit the output: it contains real person mapping.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {webcrypto} from 'node:crypto';
import {digest,validateMaster} from './candidate-provision.js';
const [input,output]=process.argv.slice(2);
if(!input||!output){console.error('Usage: node build-candidate-distribution.mjs PRIVATE_MASTER.json PRIVATE_OUTPUT_DIR');process.exit(2)}
const bytes=await readFile(resolve(input)),data=validateMaster(JSON.parse(bytes.toString('utf8')));
const file='candidate-master-'+data.master_version+'.json',sha256=await digest(bytes,webcrypto);
await mkdir(resolve(output),{recursive:true,mode:0o700});
await writeFile(join(resolve(output),file),bytes,{mode:0o600,flag:'wx'});
await writeFile(join(resolve(output),'candidate-distribution.json'),JSON.stringify({
  schema_version:1,master_version:data.master_version,master_url:'./'+file,sha256
})+'\n',{mode:0o600,flag:'wx'});
console.log('Private package prepared:',data.master_version,data.candidate_master.length,'candidates; SHA-256 verified. Do not publish without a distribution decision.');
