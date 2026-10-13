// Test-only GoTrue HTTP double. No production bypass, real credentials or users.
import { createServer } from 'node:http';
import { randomUUID,randomBytes,createHmac,createHash } from 'node:crypto';
import { once } from 'node:events';
export async function createSupabaseFixture() {
  const users=new Map(),tokens=new Map(),refreshes=new Map();const secret=randomBytes(32);
  const requests=[];let challenge='';let failures=false;
  function session(user,expired=false) {
    const expires=Math.floor(Date.now()/1000)+(expired?-120:3600);
    const header=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url');
    const payload=Buffer.from(JSON.stringify({sub:user.id,exp:expires,iat:Math.floor(Date.now()/1000),aud:'authenticated',role:'authenticated',email:user.email})).toString('base64url');
    const access_token=`${header}.${payload}.${createHmac('sha256',secret).update(`${header}.${payload}`).digest('base64url')}`;
    tokens.set(access_token,user);const refresh_token=randomUUID();refreshes.set(refresh_token,user);
    return {access_token,refresh_token,token_type:'bearer',expires_in:expired?-120:3600,expires_at:expires,user};
  }
  const server=createServer(async(request,response)=>{
    const url=new URL(request.url,'http://fixture.test');
    const chunks=[];for await (const chunk of request) chunks.push(chunk);
    let body={};try{body=JSON.parse(Buffer.concat(chunks).toString() || '{}');}catch{}
    requests.push({path:url.pathname,grant:url.searchParams.get('grant_type')});
    const json=(status,value)=>{response.writeHead(status,{'Content-Type':'application/json','X-Supabase-Api-Version':'2024-01-01'});response.end(JSON.stringify(value));};
    const error=(status,code)=>json(status,{code,msg:code});
    if (failures) return error(503,'provider_unavailable');
    if(url.pathname==='/auth/v1/signup') {
      if(users.has(body.email))return error(422,'user_already_exists');
      const user={id:randomUUID(),email:body.email,email_confirmed_at:null,app_metadata:{provider:'email'},user_metadata:body.data||{},created_at:new Date().toISOString(),identities:[]};
      users.set(body.email,{user,password:body.password});return json(200,user);
    }
    if(url.pathname==='/auth/v1/token' && url.searchParams.get('grant_type')==='password') {
      const entry=users.get(body.email);
      if (!entry || body.password!==entry.password)return error(400,'invalid_credentials');
      if (!entry.user.email_confirmed_at)return error(400,'email_not_confirmed');
      return json(200,session(entry.user));
    }
    if(url.pathname==='/auth/v1/token' && url.searchParams.get('grant_type')==='pkce') {
      const calculated=createHash('sha256').update(body.code_verifier||'').digest('base64url');
      if(body.auth_code!=='fixture-google-code' || calculated!==challenge)return error(400,'bad_code_verifier');
      const user={id:randomUUID(),email:'google-fixture@example.test',email_confirmed_at:new Date().toISOString(),user_metadata:{full_name:'Google Fixture',role:'admin'},app_metadata:{provider:'google'}};
      challenge='';return json(200,session(user));
    }
    if(url.pathname==='/auth/v1/token' && url.searchParams.get('grant_type')==='refresh_token') {
      const user=refreshes.get(body.refresh_token);return user?json(200,session(user)):error(400,'refresh_token_not_found');
    }
    if(url.pathname==='/auth/v1/user') {
      const token=(request.headers.authorization||'').replace(/^Bearer /,'');
      const user=tokens.get(token);return user?json(200,user):error(401,'bad_jwt');
    }
    if(url.pathname==='/auth/v1/verify' && body.type==='email' && body.token_hash==='fixture-email-confirmation') {
      const entry=users.values().next().value;
      if (!entry)return error(400,'otp_expired');entry.user.email_confirmed_at=new Date().toISOString();return json(200,session(entry.user));
    }
    if(url.pathname==='/auth/v1/logout') {response.writeHead(204);return response.end();}
    return error(404,'fixture_missing_route');
  });
  server.listen(0,'127.0.0.1');await once(server,'listening');
  return {url:`http://127.0.0.1:${server.address().port}`,key:'sb_publishable_test_fixture_only',requests,
    confirm:email=>{users.get(email).user.email_confirmed_at=new Date().toISOString();},
    allowGoogle:url=>{challenge=new URL(url).searchParams.get('code_challenge');},
    expire:email=>session(users.get(email).user,true),
    fail:()=>{failures=true;},
    close:async()=>{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));},
  };
}
