// Explicit local visual-QA helper, never imported by the website. Disposable
// provider + SQLite directory; no real customer, purchase or cloud write.
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname,resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createSupabaseFixture } from './supabase-fixture.mjs';
const folder=mkdtempSync(resolve(tmpdir(),'mlam-account-visual-'));
const fixture=await createSupabaseFixture();
const seed=await fetch(`${fixture.url}/auth/v1/signup`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'visual-fixture@example.test',password:randomBytes(24).toString('hex'),data:{full_name:'Visual QA Customer'}})});
if(!seed.ok)throw new Error('Local test provider setup failed');
fixture.confirm('visual-fixture@example.test');
const origin='http://127.0.0.1:4183';
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p','4183'],{cwd:process.cwd(),env:{...process.env,MLAM_ORIGIN:origin,MLAM_DATA_DIR:folder,SUPABASE_URL:fixture.url,SUPABASE_PUBLISHABLE_KEY:fixture.key,MLAM_TRUST_PROXY_IP:'0',NEXT_TELEMETRY_DISABLED:'1'},windowsHide:true,stdio:['ignore','pipe','pipe']});
let ready=false;
server.stdout.on('data',chunk=>{if(!ready&&chunk.toString().includes('Ready')){ready=true;console.log('Isolated customer visual QA ready on http://127.0.0.1:4183');}});
server.stderr.on('data',chunk=>{const value=chunk.toString();if(value.includes('EADDRINUSE'))console.error('QA port already in use; no other process was stopped.');});
let closing=false;
async function close(){
  if(closing)return;closing=true;
  if(server.exitCode===null){server.kill();await once(server,'exit');}
  await fixture.close();
  const target=resolve(folder);
  if(dirname(target)!==resolve(tmpdir())||!target.includes('mlam-account-visual-'))throw new Error('Unsafe QA cleanup path');
  rmSync(target,{recursive:true,force:true});console.log('Disposable visual QA data removed.');process.exit(0);
}
process.stdin.setEncoding('utf8');process.stdin.on('data',value=>{if(value.trim()==='stop')void close();});
process.on('SIGINT',()=>void close());process.on('SIGTERM',()=>void close());
server.on('exit',()=>{if(!closing)void close();});
