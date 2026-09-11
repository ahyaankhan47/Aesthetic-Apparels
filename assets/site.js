(function () {
  'use strict';
  const form = document.getElementById('inquiry-form');
  const copy = document.getElementById('copy-site-link');
  if(copy) copy.addEventListener('click', async () => {
    const status = document.getElementById('share-status');
    try {await navigator.clipboard.writeText('https://ahyaankhan47.github.io/Aesthetic-Apparels/');status.textContent='Website link copied.';}
    catch {status.textContent='Could not copy automatically. Website: https://ahyaankhan47.github.io/Aesthetic-Apparels/';}
  });
  if(!form) return;
  const status = document.getElementById('form-status');
  const summary = document.getElementById('error-summary');
  const enable = document.getElementById('enable-verification');
  const disable = document.getElementById('disable-verification');
  const captchaStatus = document.getElementById('captcha-status');
  const submit = form.querySelector('[type="submit"]');
  const reset = form.querySelector('[type="reset"]');
  submit.disabled=false;
  let loading = false, pending = false, widget = null, loader = null, loadTimeout = null;
  let lastAttempt = 0, blockedUntil = 0;
  function setStatus(message, state='') {status.textContent=message;status.dataset.state=state;}
  function clearErrors() {
    summary.hidden=true;summary.replaceChildren();
    form.querySelectorAll('[aria-invalid]').forEach(el=>el.removeAttribute('aria-invalid'));
    form.querySelectorAll('.field-error').forEach(el=>{el.textContent='';});
  }
  function showErrors(errors) {
    const heading=document.createElement('strong');heading.textContent='Please check the following:';
    const list=document.createElement('ul');
    Object.entries(errors).forEach(([key,message])=>{
      const field=form.elements.namedItem(key);const item=document.createElement('li');
      if(field && field.id) {
        field.setAttribute('aria-invalid','true');
        const error=document.getElementById(field.id+'-error');if(error)error.textContent=message;
        const link=document.createElement('a');link.href='#'+field.id;link.textContent=message;
        link.addEventListener('click',e=>{e.preventDefault();const details=field.closest('details');if(details)details.open=true;field.focus();});item.append(link);
      } else item.textContent=message;
      list.append(item);
    });
    summary.append(heading,list);summary.hidden=false;summary.focus();
  }
  function captchaFailure() {
    loading=false;clearTimeout(loadTimeout);
    captchaStatus.textContent='Verification could not load. Reload to try again, or email us instead. Reloading clears the form.';
    enable.hidden=true;disable.hidden=false;
  }
  window.AAOnCaptchaLoaded=function () {
    if(!loading) return;
    try {
      widget=window.hcaptcha.render('captcha-widget',{
        sitekey:'50b2fe65-b00b-4b9e-ad62-3ba471098be2',theme:'dark',size:'compact',
        callback:()=>{captchaStatus.textContent='Verification complete. You can send your inquiry.';},
        'expired-callback':()=>{captchaStatus.textContent='Verification expired. Please complete it again.';},
        'chalexpired-callback':()=>{captchaStatus.textContent='Verification timed out. Please try again.';},
        'error-callback':()=>{captchaStatus.textContent='Verification could not be completed. Please try again or email us.';}
      });
      clearTimeout(loadTimeout);loading=false;enable.hidden=true;disable.hidden=false;
      captchaStatus.textContent='Complete the verification below before sending.';
    } catch {captchaFailure();}
  };
  enable.addEventListener('click',()=>{
    if(loading || widget!==null) return;
    loading=true;enable.disabled=true;captchaStatus.textContent='Loading verification…';
    // No hCaptcha script, preconnect or iframe is created before this explicit choice.
    loader=document.createElement('script');
    loader.src='https://js.hcaptcha.com/1/api.js?onload=AAOnCaptchaLoaded&render=explicit&recaptchacompat=off';
    loader.async=true;loader.onerror=captchaFailure;
    loadTimeout=setTimeout(captchaFailure,20000);document.head.append(loader);
    disable.hidden=false;
  });
  disable.addEventListener('click',()=>{if(!pending)window.location.reload();});
  function resetCaptcha(){try{if(widget!==null && window.hcaptcha){window.hcaptcha.reset(widget);captchaStatus.textContent='Complete a fresh verification before sending.';}}catch{}}
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(pending)return;clearErrors();
    const input={};window.AAInquiry.fields.forEach(key=>{const field=form.elements.namedItem(key);input[key]=key==='consent'?field.checked:field.value;});
    const checked=window.AAInquiry.validate(input);
    if(Object.keys(checked.errors).length){showErrors(checked.errors);return;}
    const now=Date.now();
    if(now<blockedUntil || now-lastAttempt<10000){setStatus('Please wait a moment before trying again.','error');return;}
    if(navigator.onLine===false){setStatus('You appear to be offline. Your details are still here. Reconnect and try again.','error');return;}
    let captcha='';try{if(widget!==null && window.hcaptcha)captcha=window.hcaptcha.getResponse(widget);}catch{}
    if(!captcha){setStatus('Please enable and complete the verification, or contact us by email.','error');(widget===null?enable:document.getElementById('captcha-widget')).focus();return;}
    const value=checked.value;
    // Allowlisted public submission payload; no page URL, campaign data or arbitrary hidden fields.
    const payload={access_key:form.elements.namedItem('access_key').value,
      subject:'New Website Inquiry — Aesthetic Apparels',from_name:'Aesthetic Apparels Website',
      name:value.name,email:value.email,replyto:value.email,message:value.message,
      consent:'Privacy notice acknowledged; inquiry response only (2026-09-10)',
      'h-captcha-response':captcha,botcheck:''};
    for(const key of ['company','product','quantity','timeline'])if(value[key] && value[key]!=='Not specified')payload[key]=value[key];
    pending=true;lastAttempt=now;submit.disabled=true;reset.disabled=true;disable.disabled=true;submit.textContent='Sending inquiry…';
    setStatus('Sending your inquiry…');
    const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),20000);
    try {
      const response=await fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload),signal:abort.signal,credentials:'omit',referrerPolicy:'no-referrer'});
      if(response.status===429){blockedUntil=Date.now()+60000;setStatus('Too many requests. Please wait at least a minute and try again, or email us.','error');return;}
      if(response.status>=500){setStatus('Our inquiry service is temporarily unavailable. Your details are still here. Please try again later or email us.','error');return;}
      const result=await response.json();
      if(!response.ok || result?.success!==true){setStatus('We couldn’t send your inquiry. Please complete a fresh verification and try again, or email us directly.','error');return;}
      form.reset();blockedUntil=Date.now()+30000;
      setStatus('Thank you — your inquiry has been sent. We’ll reply to the email address you provided, usually within 1–2 business days.','success');
    } catch(error) {
      blockedUntil=Date.now()+60000;
      setStatus(error.name==='AbortError'?'We couldn’t confirm delivery in time. Your details are still here. Please wait before retrying to avoid a duplicate, or email us.':'We couldn’t confirm delivery. Your details are still here. Check your connection before trying again, or email us.','error');
    } finally {
      clearTimeout(timer);resetCaptcha();pending=false;submit.disabled=false;reset.disabled=false;disable.disabled=false;submit.textContent='Send inquiry';
    }
  });
  form.addEventListener('reset',()=>{clearErrors();resetCaptcha();setStatus('Your details are used to respond to this inquiry. You can also email us directly.');});
})();
