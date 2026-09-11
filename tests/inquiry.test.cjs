const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const validation=require('../assets/validation.js');
const script=fs.readFileSync(path.join(__dirname,'../assets/site.js'),'utf8');
const valid={name:'  Jordan Lee  ',email:'buyer@example.com',message:'Please quote denim jackets for our next collection.',company:'',product:'Not specified',quantity:'',timeline:'Not specified',consent:true,website:''};
test('validates only expected inquiry fields and normalizes text',()=>{
  assert.deepEqual(validation.validate(valid).errors,{});
  assert.equal(validation.validate(valid).value.name,'Jordan Lee');
  for(const [key,value] of [['name',' '],['email','bad'],['message',' '.repeat(30)],['message','x'.repeat(2001)],['quantity','1.5'],['quantity','1e6'],['quantity','10000001'],['product','tampered'],['timeline','tampered'],['consent','true'],['website','spam.example'],['name',{}]])assert.ok(Object.keys(validation.validate({...valid,[key]:value}).errors).length,key);
  assert.ok(validation.validate({...valid,role:'admin'}).errors.form);
  assert.ok(validation.validate({...valid,access_key:'override'}).errors.form);
  assert.ok(validation.validate({...valid,email:'a@b.com\nBcc: x@y.com'}).errors.email);
  assert.ok(validation.validate(null).errors.form);
  assert.ok(validation.validate([]).errors.form);
  assert.deepEqual(validation.validate({...valid,message:'Please use <navy> denim & a "relaxed" fit.'}).errors,{});
});
class Element {
  constructor(id=''){this.id=id;this.value='';this.checked=false;this.disabled=false;this.hidden=false;this.dataset={};this.attrs={};this.listeners={};this.children=[];this.textContent='';}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  async fire(type){for(const fn of this.listeners[type]||[])await fn({preventDefault(){}});}
  append(...els){this.children.push(...els);}
  replaceChildren(...els){this.children=els;}
  setAttribute(k,v){this.attrs[k]=v;}
  removeAttribute(k){delete this.attrs[k];}
  closest(){return null;}
  focus(){this.focused=true;}
}
function harness({response={ok:true,status:200,json:async()=>({success:true})},requestError=null,online=true}={}){
 const nodes={},fields={};
 const node=id=>nodes[id]??=(new Element(id));
 for(const key of validation.fields){fields[key]=node(key);fields[key].value=typeof valid[key]==='string'?valid[key]:'';fields[key].checked=key==='consent';node(key+'-error');}
 fields.access_key=node('access_key');fields.access_key.value='public-test-key';
 const form=node('inquiry-form'),submit=node('submit'),reset=node('reset');
 form.elements={namedItem:key=>fields[key]};
 form.querySelector=selector=>selector==='[type="submit"]'?submit:reset;
 form.querySelectorAll=selector=>selector==='[aria-invalid]'?Object.values(fields).filter(e=>e.attrs['aria-invalid']):Object.entries(nodes).filter(([id])=>id.endsWith('-error')).map(([,el])=>el);
 let resets=0,token='',now=100000,requests=[],scripts=[],renderOptions,loadTimers=[];
 form.reset=()=>{resets++;for(const key of validation.fields){fields[key].value=key==='product'||key==='timeline'?'Not specified':'';fields[key].checked=false;}void form.fire('reset');};
 const context={console,AbortController,Date:{now:()=>now},setTimeout:fn=>{loadTimers.push(fn);return loadTimers.length;},clearTimeout(){},navigator:{onLine:online},document:{getElementById:id=>id==='copy-site-link'?null:node(id),createElement:()=>new Element(),head:{append:el=>scripts.push(el)}},fetch:async(url,opts)=>{requests.push({url,opts});if(requestError)throw requestError;return response;}};
 context.window={AAInquiry:validation,location:{reload:()=>{context.reloaded=true;}},hcaptcha:{render:(_id,opts)=>{renderOptions=opts;return 5;},getResponse:()=>token,reset:()=>{token='';}}};
 vm.runInNewContext(script,context);
 return {nodes,fields,form,submit,requests,scripts,context,get resets(){return resets;},get renderOptions(){return renderOptions;},tick:ms=>{now+=ms;},enable:async()=>{await node('enable-verification').fire('click');context.window.AAOnCaptchaLoaded();},verify:()=>{token='sample-verification-token';},setValid:()=>{for(const key of validation.fields){fields[key].value=typeof valid[key]==='string'?valid[key]:'';fields[key].checked=key==='consent';}}};
}
test('does not load verification or send data until explicit actions',async()=>{
 const h=harness();assert.equal(h.scripts.length,0);assert.equal(h.requests.length,0);
 await h.form.fire('submit');assert.equal(h.requests.length,0);assert.match(h.nodes['form-status'].textContent,/verification/);
 await h.enable();assert.equal(h.scripts.length,1);assert.match(h.scripts[0].src,/^https:\/\/js\.hcaptcha\.com/);
 assert.equal(h.renderOptions.sitekey,'50b2fe65-b00b-4b9e-ad62-3ba471098be2');assert.equal(h.requests.length,0);
});
test('sends only minimized fields and reports confirmed success',async()=>{
 const h=harness();await h.enable();h.verify();await h.form.fire('submit');
 assert.equal(h.requests.length,1);assert.equal(h.requests[0].url,'https://api.web3forms.com/submit');
 const p=JSON.parse(h.requests[0].opts.body);
 assert.deepEqual(Object.keys(p).sort(),['access_key','botcheck','consent','email','from_name','h-captcha-response','message','name','replyto','subject'].sort());
 assert.equal(p.name,'Jordan Lee');assert.equal(h.requests[0].opts.credentials,'omit');
 assert.equal(h.requests[0].opts.referrerPolicy,'no-referrer');assert.equal(h.resets,1);
 assert.equal(h.nodes['form-status'].dataset.state,'success');assert.equal(h.submit.disabled,false);
});
test('invalid values stay local with accessible errors',async()=>{
 const h=harness();h.fields.email.value='invalid';await h.form.fire('submit');
 assert.equal(h.requests.length,0);assert.equal(h.nodes['error-summary'].hidden,false);
 assert.equal(h.fields.email.attrs['aria-invalid'],'true');assert.equal(h.nodes['error-summary'].focused,true);
});
test('rate limits preserve the inquiry and enforce a cooldown',async()=>{
 const h=harness({response:{ok:false,status:429}});await h.enable();h.verify();await h.form.fire('submit');
 assert.match(h.nodes['form-status'].textContent,/Too many/);assert.equal(h.resets,0);
 h.tick(15000);h.verify();await h.form.fire('submit');assert.equal(h.requests.length,1);
});
test('timeout preserves details and prevents immediate uncertain duplicate',async()=>{
 const error=new Error('timeout');error.name='AbortError';const h=harness({requestError:error});
 await h.enable();h.verify();await h.form.fire('submit');assert.match(h.nodes['form-status'].textContent,/confirm delivery in time/);
 assert.equal(h.resets,0);h.tick(21000);h.verify();await h.form.fire('submit');assert.equal(h.requests.length,1);
});
test('offline state makes no provider request',async()=>{
 const h=harness({online:false});await h.form.fire('submit');assert.equal(h.requests.length,0);assert.match(h.nodes['form-status'].textContent,/offline/);
});
test('HTTP and provider errors never show success or clear fields',async()=>{
 for(const response of [{ok:false,status:500},{ok:false,status:400,json:async()=>({success:false})},{ok:true,status:200,json:async()=>({success:'true'})},{ok:true,status:200,json:async()=>{throw Error('invalid JSON');}}]){
 const h=harness({response});await h.enable();h.verify();await h.form.fire('submit');assert.equal(h.resets,0);assert.equal(h.nodes['form-status'].dataset.state,'error');assert.equal(h.submit.disabled,false);
 }
});
test('duplicate clicks share one in-flight request',async()=>{
 let resolve;const result=new Promise(r=>{resolve=r;});const h=harness({response:result});await h.enable();h.verify();
 const first=h.form.fire('submit');await h.form.fire('submit');assert.equal(h.requests.length,1);
 resolve({ok:true,status:200,json:async()=>({success:true})});await first;
});
test('verification can be withdrawn with a reload',async()=>{
 const h=harness();await h.enable();await h.nodes['disable-verification'].fire('click');assert.equal(h.context.reloaded,true);
});
test('visitor data is not rendered as HTML or persisted by the website',()=>{
 assert.doesNotMatch(script,/innerHTML|insertAdjacentHTML|document\.write\(|localStorage|sessionStorage|document\.cookie|console\.(?:log|error)\(/);
});
