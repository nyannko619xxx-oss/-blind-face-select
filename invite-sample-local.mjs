// Local-only runnable sample. The production Worker uses a separate D1 binding.
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import worker from './invite-sample-worker.mjs';

const root=dirname(fileURLToPath(import.meta.url));
export function localDb(){
  const db=new DatabaseSync(':memory:');db.exec(readFileSync(join(root,'invite-sample-schema.sql'),'utf8'));
  return {prepare(sql){return {bind(...args){const stmt=db.prepare(sql);return {async first(){return stmt.get(...args)||null},async run(){return stmt.run(...args)}}}}},close(){db.close()}};
}
export function localEnv(origin,db=localDb()){return {APP_ORIGIN:origin,INVITE_DB:db,ADMIN_SECRET:randomBytes(32).toString('hex')}}
export function startLocalSample({port=8788}={}){
  const origin=`http://127.0.0.1:${port}`,env=localEnv(origin);
  const server=createServer(async(req,res)=>{
    try{
      const url=new URL(req.url,origin);
      if(req.method==='GET'&&url.pathname==='/dev/owner'){
        const bootstrap=await worker.fetch(new Request(origin+'/v1/sample/admin/bootstrap',{method:'POST',headers:{Authorization:'Bearer '+env.ADMIN_SECRET}}),env);
        const {sessionToken}=await bootstrap.json();res.writeHead(302,{Location:'/index.html#session='+sessionToken,'Cache-Control':'no-store'});res.end();return;
      }
      const assets={'/index.html':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8']};
      if(req.method==='GET'&&assets[url.pathname]){
        const [name,type]=assets[url.pathname];res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'none'"});res.end(readFileSync(join(root,'invite-sample-assets',name)));return;
      }
      const body=[];for await(const chunk of req)body.push(chunk);
      const request=new Request(origin+req.url,{method:req.method,headers:req.headers,body:body.length?Buffer.concat(body):undefined});
      const response=await worker.fetch(request,env);
      res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
    }catch{res.writeHead(500,{'Content-Type':'application/json'});res.end('{"error":"sample_server_error"}')}
  });
  server.listen(port,'127.0.0.1');return {server,env,origin};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
  const port=Number(process.env.BFS_SAMPLE_PORT||8788);
  startLocalSample({port});console.log(`Invite Sample: http://127.0.0.1:${port}/index.html (Owner: /dev/owner)`);
}
