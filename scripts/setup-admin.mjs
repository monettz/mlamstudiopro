import { createInterface } from 'node:readline/promises';
import { stdin,stdout } from 'node:process';
import { existsSync,readFileSync,writeFileSync } from 'node:fs';
import { dirname,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const normalizeEmail=(value)=>{
  if(typeof value!=='string') return null;
  const email=value.trim().toLowerCase();
  return email.length<=254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
};

const projectRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const envPath=resolve(projectRoot,'.env.local');
if(!existsSync(envPath)) throw new Error('Create .env.local from .env.example and configure Supabase first.');
const source=readFileSync(envPath,'utf8');
const configured=(name)=>new RegExp(`^\\s*${name}=(.+)$`,'m').test(source);
if(!(configured('SUPABASE_URL')||configured('NEXT_PUBLIC_SUPABASE_URL')) || !(configured('SUPABASE_PUBLISHABLE_KEY')||configured('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')||configured('NEXT_PUBLIC_SUPABASE_ANON_KEY'))) {
  throw new Error('Supabase URL and publishable key must be configured in .env.local before setting up Admin.');
}

const rl=createInterface({input:stdin,output:stdout});
let answer='';
try { answer=await rl.question('Confirmed Supabase email allowed to manage this website: '); }
finally { rl.close(); }
const email=normalizeEmail(answer);
if(!email) throw new Error('Enter a valid email address.');

const line=`MLAM_ADMIN_EMAIL=${email}`;
const keyPattern=/^\s*MLAM_ADMIN_EMAIL=.*$/m;
const updated=keyPattern.test(source) ? source.replace(keyPattern,line) : `${source.replace(/\s*$/,'')}\n${line}\n`;
writeFileSync(envPath,updated,{encoding:'utf8'});
console.log('Admin allowlist saved in .env.local. Restart the website, then sign in using this confirmed Supabase account.');
