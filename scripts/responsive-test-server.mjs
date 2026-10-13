// Isolated, loopback-only QA. Never configures the real owner account or uses real uploads.
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,dirname,basename} from 'node:path';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
const temporaryRoot=resolve(tmpdir());const folder=mkdtempSync(resolve(temporaryRoot,'mlam-responsive-qa-'));
process.env.MLAM_DATA_DIR=folder;
const {migrate,rawDatabase}=await import('../lib/node-runtime.mjs');
const {passwordHash}=await import('../lib/auth-core.mjs');
migrate();const password=randomBytes(24).toString('hex');
rawDatabase().prepare('INSERT INTO admin_accounts VALUES (?,?,?,?)').run('responsive-test-owner','layout-fixture@example.test',passwordHash(password),new Date().toISOString());
const origin='http://127.0.0.1:4183';
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p','4183'],{cwd:process.cwd(),env:{...process.env,MLAM_ORIGIN:origin,NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe'],windowsHide:true});
let output='';server.stdout.on('data',chunk=>output+=chunk);server.stderr.on('data',chunk=>output+=chunk);
let cleaning=false;
async function cleanup(){
  if(cleaning)return;cleaning=true;server.kill();if(server.exitCode===null)await once(server,'exit');rawDatabase().close();
  if(dirname(folder)!==temporaryRoot||!basename(folder).startsWith('mlam-responsive-qa-'))throw new Error('Unexpected QA cleanup path');
  rmSync(folder,{recursive:true,force:true});
}
try{
  let ready=false;for(let attempt=0;attempt<80;attempt++){
    if(server.exitCode!==null)throw new Error(output);
    try{if((await fetch(origin)).ok){ready=true;break;}}catch{}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  if(!ready)throw new Error('QA server did not start');
  // A random disposable test credential, NOT a default password for the real website.
  console.log(JSON.stringify({qaOrigin:origin,fixturePassword:password}));
  await new Promise(resolve=>{process.once('SIGINT',resolve);process.once('SIGTERM',resolve);});
}finally{await cleanup();}
