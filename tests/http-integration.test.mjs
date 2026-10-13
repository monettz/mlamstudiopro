import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import { createSupabaseFixture } from './supabase-fixture.mjs';

test('single-site HTTP flow: owner/customer isolation, checkout, media and licenses', { timeout: 120000 }, async () => {
  const folder = mkdtempSync(resolve(tmpdir(), 'mlam-http-test-')); process.env.MLAM_DATA_DIR = folder;
  const { migrate, rawDatabase } = await import('../lib/node-runtime.mjs');
  const { passwordHash } = await import('../lib/auth-core.mjs');
  const { quotaKey, resetQuota, INVALID_CREDENTIALS } = await import('../lib/rate-limit.mjs');
  migrate(); const password = randomBytes(32).toString('hex');
  rawDatabase().prepare('INSERT INTO admin_accounts VALUES (?,?,?,?)').run('test-owner','owner@example.test',passwordHash(password),new Date().toISOString());
  const base = 'http://127.0.0.1:4181'; let output = '';
  const supabase=await createSupabaseFixture();
  const server = spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p','4181'], { cwd:process.cwd(),env:{...process.env,MLAM_ORIGIN:base,MLAM_TRUST_PROXY_IP:'0',SUPABASE_URL:supabase.url,SUPABASE_PUBLISHABLE_KEY:supabase.key,NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore','pipe','pipe'],windowsHide:true });
  server.stdout.on('data',chunk=>output+=chunk); server.stderr.on('data',chunk=>output+=chunk);
  try {
    let ready = false;
    for(let i=0;i<80;i++){if(server.exitCode!==null) throw new Error(output); try { if((await fetch(base)).ok){ready=true;break;} }catch{} await new Promise(r=>setTimeout(r,250));}
    assert.ok(ready,output);
    const html = await (await fetch(base)).text(); assert.ok(html.includes('MLAM Studio Pro')); assert.ok(!html.includes('https://mlam-plugins.'));
    assert.ok(html.includes('Turn your voice, humming and melodies into editable MIDI inside your DAW.'));assert.ok(!html.includes('Geuza sauti, humming na melody'));
    for(const [language,copy] of [['sw','Geuza sauti yako, humming na melodi'],['fr','Transformez votre voix, vos fredonnements'],['ar','حوّل صوتك وهمهماتك وألحانك'],['ja','声、ハミング、メロディーを']]){
      const localized=await(await fetch(base,{headers:{Cookie:`mlam_language=${language}`}})).text();assert.ok(localized.includes(copy),language);
      const catalog=await(await fetch(`${base}/api/products?language=${language}`)).json();assert.ok(catalog.products.find(product=>product.id==='voice-midi').description.startsWith(copy),language);
    }
    assert.ok((await (await fetch(`${base}/admin/login`)).text()).includes('Studio administration'));
    assert.equal((await fetch(`${base}/admin`,{redirect:'manual'})).headers.get('location'),'/admin/login');
    assert.ok(!html.includes('Administration — owner login'));assert.ok(!html.includes('href="/admin"'));assert.ok(html.includes('width=device-width'));
    for(const section of ['products','releases','videos'])assert.equal((await fetch(`${base}/admin?section=${section}`,{redirect:'manual'})).headers.get('location'),`/admin/login?section=${section}`);
    assert.equal((await fetch(`${base}/admin?section=https://evil.example`,{redirect:'manual'})).headers.get('location'),'/admin/login');
    assert.equal((await fetch(`${base}/api/orders`,{headers:{'oai-authenticated-user-id':'spoof','oai-authenticated-user-email':'melaninentertainment255@gmail.com'}})).status,401);
    assert.equal((await fetch(`${base}/api/products`,{method:'POST',headers:{Origin:'https://evil.example'}})).status,403);
    let cookie = '';
    const request = (path,options={}) => fetch(base+path,{...options,headers:{Origin:base,...(cookie?{Cookie:cookie}:{}),...options.headers}});
    for (const body of ['{', JSON.stringify({password:null}), JSON.stringify({password:'wrong'}), 'x'.repeat(4097)]) {
      const rejected = await request('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body});
      assert.ok([400,401].includes(rejected.status)); assert.equal((await rejected.json()).error,INVALID_CREDENTIALS); assert.equal(rejected.headers.get('cache-control'),'no-store');
    }
    const login = await request('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})}); assert.equal(login.status,200);
    const setCookie=login.headers.get('set-cookie'); assert.match(setCookie,/HttpOnly/i); assert.match(setCookie,/Secure/i); assert.match(setCookie,/SameSite=strict/i); cookie=setCookie.split(';')[0];
    const adminHtml=await (await request('/admin')).text(); assert.ok(adminHtml.includes('MLAM STUDIO PRO ADMINISTRATION'));
    for(const [section,title] of [['products','Add plugin'],['releases','Upload plugin ZIP'],['videos','Upload How to use video']]){const direct=await(await request(`/admin?section=${section}`)).text();assert.ok(direct.includes(title),section);assert.ok(direct.includes('aria-label="Products"'));assert.ok(direct.includes('admin-nav-label'));}
    const created=await request('/api/products',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Test-only localized plugin',slug:'test-localized-plugin',description:'Owner English description',description_translations:{fr:'Description française de test',sw:'Maelezo ya majaribio'},price_cents:7300,status:'published'})});assert.equal(created.status,201);const createdId=(await created.json()).id;
    let localizedCatalog=await(await fetch(`${base}/api/products?language=fr`)).json();assert.equal(localizedCatalog.products.find(product=>product.id===createdId).description,'Description française de test');
    const patchDescriptions=body=>request(`/api/products/${createdId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    assert.equal((await patchDescriptions({description_translations:{xx:'Unsupported language'}})).status,400);assert.equal((await patchDescriptions({description_translations:{fr:'x'.repeat(4001)}})).status,400);
    assert.equal((await patchDescriptions({description_translations:{en:'Revised English',fr:'Description mise à jour',ja:'テストの説明'},price_cents:0,image:'/replace-me.png'})).status,200);
    const savedCopy=rawDatabase().prepare('SELECT description,price_cents,image,description_translations FROM products WHERE id=?').get(createdId);assert.equal(savedCopy.description,'Owner English description');assert.equal(savedCopy.price_cents,7300);assert.equal(savedCopy.image,'/plugins/mlam-voice-midi.png');assert.equal(JSON.parse(savedCopy.description_translations).ja,'テストの説明');
    localizedCatalog=await(await fetch(`${base}/api/products?language=ja`)).json();assert.equal(localizedCatalog.products.find(product=>product.id===createdId).description,'テストの説明');
    const unauthorizedTranslation=await fetch(`${base}/api/products/${createdId}`,{method:'PATCH',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({description_translations:{en:'Unauthorized'}})});assert.equal(unauthorizedTranslation.status,401);
    const products = (await (await request('/api/products')).json()).products; assert.ok(products.some(x=>x.id==='mlam-daw'));
    const checkoutPage=await (await fetch(`${base}/checkout?product=voice-midi`)).text();assert.ok(checkoutPage.includes('Email address'));assert.ok(checkoutPage.includes('Full name'));
    const details={productId:'voice-midi',email:'checkout-fixture@example.test',fullName:'Test Customer',paymentMethod:'mpesa',paid:true,amount:0};
    const prepare=body=>request('/api/checkout/prepare',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    for(let attempt=0;attempt<5;attempt++){
      const preview=await prepare({...details,email:attempt%2?' CHECKOUT-FIXTURE@EXAMPLE.TEST ':details.email});assert.equal(preview.status,503);assert.equal((await preview.json()).code,'PAYMENT_NOT_CONFIGURED');
    }
    const limitedCheckout=await prepare(details);assert.equal(limitedCheckout.status,429);assert.ok(Number(limitedCheckout.headers.get('retry-after'))>0);
    assert.equal((await prepare({...details,email:'invalid'})).status,400);
    assert.equal((await prepare({...details,email:'other@example.test',productId:'mlam-daw'})).status,404);
    const oversized=await request('/api/checkout/prepare',{method:'POST',body:'x'.repeat(4097)});assert.equal(oversized.status,400);
    assert.equal(rawDatabase().prepare('SELECT COUNT(*) AS count FROM orders').get().count,0);
    assert.equal(rawDatabase().prepare('SELECT COUNT(*) AS count FROM licenses').get().count,0);
    assert.ok(!rawDatabase().prepare('SELECT key FROM auth_throttle').all().some(row=>row.key.includes(details.email)));
    rawDatabase().prepare('INSERT INTO auth_throttle (key,failures,reset_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET failures=excluded.failures,reset_at=excluded.reset_at')
      .run(quotaKey('checkout-source','untrusted-shared'),20,Date.now()+900000);
    const sourceBlocked=await request('/api/checkout/prepare',{method:'POST',headers:{'x-forwarded-for':'203.0.113.252'},body:'{'});assert.equal(sourceBlocked.status,429);
    const image = new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64'));
    const imageForm = new FormData(); imageForm.set('file',new File([image],'test.png',{type:'image/png'}));
    const uploadedImage=await request('/api/product-images',{method:'POST',body:imageForm}); assert.equal(uploadedImage.status,201); const imagePath=(await uploadedImage.json()).image;
    assert.deepEqual(new Uint8Array(await (await fetch(base+imagePath)).arrayBuffer()),image);
    assert.equal((await request('/api/products/voice-midi',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:imagePath})})).status,200);
    const videoBytes=new Uint8Array([0,0,0,24,102,116,121,112,105,115,111,109,0,0,0,0,105,115,111,109,109,112,52,50]);
    const form=new FormData();form.set('product_id','voice-midi');form.set('title','Test-only tutorial');form.set('file',new File([videoBytes],'fixture.mp4',{type:'video/mp4'}));
    const uploadedVideo=await request('/api/tutorials',{method:'POST',body:form});assert.equal(uploadedVideo.status,201);const videoId=(await uploadedVideo.json()).id;
    assert.equal((await fetch(`${base}/api/tutorials/${videoId}/video`)).status,404);
    assert.equal((await request(`/api/tutorials/${videoId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({published:true})})).status,200);
    const seek=await fetch(`${base}/api/tutorials/${videoId}/video`,{headers:{Range:'bytes=4-7'}});assert.equal(seek.status,206);assert.equal(await seek.text(),'ftyp');
    const zipBytes=new Uint8Array([80,75,3,4,0,0,0,0]); const zipForm=new FormData();zipForm.set('product_id','voice-midi');zipForm.set('version','test-only');zipForm.set('file',new File([zipBytes],'fixture.zip'));
    const uploadedZip=await request('/api/releases',{method:'POST',body:zipForm});assert.equal(uploadedZip.status,201); const releaseId=(await uploadedZip.json()).id;
    assert.equal((await request(`/api/releases/${releaseId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({active:true})})).status,200);
    const issued=await request('/api/licenses',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_id:'voice-midi',customer_email:'fixture@example.test',max_downloads:1})});assert.equal(issued.status,201);const key=(await issued.json()).license_key;
    const downloads=await Promise.all([1,2].map(()=>request('/api/download',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({licenseKey:key})})));
    assert.deepEqual(downloads.map(r=>r.status).sort(),[200,403]); await Promise.all(downloads.map(r=>r.arrayBuffer()));
    rawDatabase().prepare('INSERT INTO auth_throttle (key,failures,reset_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET failures=excluded.failures,reset_at=excluded.reset_at')
      .run(quotaKey('admin-protected-api','test-owner'),120,Date.now()+60000);
    const limited = await request('/api/orders'); assert.equal(limited.status,429); assert.ok(Number(limited.headers.get('retry-after'))>0);
    // A valid session is not a way around the account-level quota.
    assert.equal((await request('/api/licenses')).status,429);
    resetQuota('admin-protected-api','test-owner'); assert.equal((await request('/api/orders')).status,200);
    assert.equal((await request('/api/admin/logout',{method:'POST'})).status,200);assert.equal((await request('/api/orders')).status,401);
    const signInPage=await (await fetch(`${base}/account/login`)).text();assert.ok(signInPage.includes('Welcome back.'));assert.ok(signInPage.includes('Create account'));assert.ok(signInPage.includes('Language'));assert.ok(signInPage.includes('Continue with Google / Gmail'));assert.ok(signInPage.includes('or continue with'));assert.ok(signInPage.includes('access-mode-tabs'));assert.ok(signInPage.includes('Show password'));assert.ok(!signInPage.includes('href="/admin"'));assert.ok(signInPage.indexOf('customer-access-form')<signInPage.indexOf('access-google'));
    const swPage=await (await fetch(`${base}/account/register`,{headers:{Cookie:'mlam_language=sw'}})).text();assert.ok(swPage.includes('Fungua akaunti'));assert.ok(swPage.includes('lang="sw"'));
    assert.equal((signInPage.match(/<select /g)||[]).length,1);assert.ok(signInPage.includes('<option value="en"'));assert.ok(!signInPage.includes('English — English'));
    for(const [code,title,direction] of [['fr','Bienvenue à nouveau.','ltr'],['ja','おかえりなさい。','ltr'],['ar','مرحباً بعودتك.','rtl']]){
      const localized=await (await fetch(`${base}/account/login`,{headers:{Cookie:`mlam_language=${code}`}})).text();assert.ok(localized.includes(title),code);assert.ok(localized.includes(`lang="${code}" dir="${direction}"`),code);assert.ok(!localized.includes('translation is not available yet'),code);
    }
    const unsupported=await (await fetch(`${base}/account/login`,{headers:{Cookie:'mlam_language=aa'}})).text();assert.ok(unsupported.includes('Welcome back.'));assert.ok(unsupported.includes('lang="en" dir="ltr"'));
    const customerPassword=randomBytes(24).toString('hex');const customerDetails={email:'customer-fixture@example.test',fullName:'Test Customer',password:customerPassword,role:'admin'};
    const accountPost=(action,body)=>request(`/api/account/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const signedUp=await accountPost('register',customerDetails);assert.equal(signedUp.status,202);const signupMessage=(await signedUp.json()).message;
    const duplicate=await accountPost('register',{...customerDetails,password:randomBytes(24).toString('hex')});assert.equal(duplicate.status,202);assert.equal((await duplicate.json()).message,signupMessage);
    assert.equal(rawDatabase().prepare('SELECT COUNT(*) AS n FROM customers').get().n,0);
    assert.equal((await accountPost('login',customerDetails)).status,401);
    supabase.confirm(customerDetails.email);
    const wrong=await accountPost('login',{...customerDetails,password:'wrong'});const absent=await accountPost('login',{email:'absent-customer@example.test',password:'wrong'});assert.equal(wrong.status,401);assert.equal(absent.status,401);assert.equal((await wrong.json()).error,(await absent.json()).error);
    const customerLogin=await accountPost('login',customerDetails);assert.equal(customerLogin.status,200);const customerCookie=customerLogin.headers.get('set-cookie');assert.match(customerCookie,/HttpOnly/i);assert.match(customerCookie,/SameSite=lax/i);assert.ok(!/; Secure/i.test(customerCookie));cookie=customerLogin.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');
    assert.equal((await request('/api/account/session')).status,200);const session=(await (await request('/api/account/session')).json()).user;assert.equal(session.email,customerDetails.email);assert.equal(session.emailVerified,true);
    const accountHtml=await(await request('/account')).text();assert.ok(!accountHtml.includes('Email verification pending'));assert.ok(accountHtml.includes('account-dashboard'));assert.ok(accountHtml.includes('Account details'));assert.ok(accountHtml.includes('Email verified'));assert.ok(accountHtml.includes('customer-library-card'));assert.ok(!accountHtml.includes('href="/admin"'));
    assert.equal((await request('/api/orders')).status,401);assert.equal((await request('/admin',{redirect:'manual'})).headers.get('location'),'/admin/login');
    const signedOut=await accountPost('logout',{});assert.equal(signedOut.status,200);assert.ok(signedOut.headers.getSetCookie().some(value=>value.includes('Max-Age=0') || value.includes('Expires=Thu, 01 Jan 1970')));cookie=signedOut.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');assert.equal((await (await request('/api/account/session')).json()).user,null);
    cookie='';
    const confirm=await request('/auth/confirm?token_hash=fixture-email-confirmation&type=email&next=//evil.example',{redirect:'manual'});assert.equal(confirm.status,303);assert.equal(confirm.headers.get('location'),`${base}/account`);assert.match(confirm.headers.get('cache-control'),/no-store/);assert.equal(confirm.headers.get('referrer-policy'),'no-referrer');
    cookie=confirm.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');assert.equal((await (await request('/api/account/session')).json()).user.email,customerDetails.email);await accountPost('logout',{});cookie='';
    const google=await accountPost('google',{next:'/checkout?product=voice-midi'});assert.equal(google.status,200);const googleUrl=(await google.json()).url;assert.ok(new URL(googleUrl).searchParams.get('code_challenge'));supabase.allowGoogle(googleUrl);
    const verifier=google.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');assert.match(verifier,/code-verifier/);
    const missingVerifier=await request('/auth/callback?code=fixture-google-code',{redirect:'manual'});assert.equal(missingVerifier.status,303);assert.ok(missingVerifier.headers.get('location').includes('error=auth'));
    cookie=verifier;
    const callback=await request('/auth/callback?code=fixture-google-code&next=/checkout?product=voice-midi',{redirect:'manual',headers:{'x-forwarded-host':'evil.example'}});assert.equal(callback.status,303);assert.equal(callback.headers.get('location'),`${base}/checkout?product=voice-midi`);assert.match(callback.headers.get('cache-control'),/no-store/);
    cookie=callback.headers.getSetCookie().map(value=>value.split(';')[0]).join('; ');assert.equal((await (await request('/api/account/session')).json()).user.email,'google-fixture@example.test');assert.equal((await request('/api/orders')).status,401);
    assert.equal((await request('/admin',{redirect:'manual'})).headers.get('location'),'/admin/login');await accountPost('logout',{});
    assert.equal((await fetch(`${base}/api/account/google`,{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:'{}'})).status,403);
    rawDatabase().prepare('INSERT INTO auth_throttle (key,failures,reset_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET failures=excluded.failures,reset_at=excluded.reset_at')
      .run(quotaKey('admin-login-source','untrusted-shared'),30,Date.now()+900000);
    const blocked=await request('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json','x-forwarded-for':'203.0.113.250','x-mlam-client-ip':'203.0.113.251'},body:'{'});
    assert.equal(blocked.status,429); assert.ok(Number(blocked.headers.get('retry-after'))>0);
  } finally {
    server.kill(); if(server.exitCode===null) await once(server,'exit'); await supabase.close(); rawDatabase().close();
    assert.equal(dirname(folder),resolve(tmpdir())); assert.ok(folder.includes('mlam-http-test-')); rmSync(folder,{recursive:true,force:true});
  }
});
