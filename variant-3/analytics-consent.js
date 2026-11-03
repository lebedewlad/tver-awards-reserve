(()=>{'use strict';
 const counter=113814329,key='tver_analytics_consent_v1',version='2026-10-27.1',ttl=90*86400000;
 const panel=document.getElementById('analytics-consent'),settings=document.getElementById('analytics-settings');
 if(!panel||!settings)return;
 let allowed=false,started=false,library=null,returnFocus=null;
 const production=location.hostname==='tver-awards.ru'&&location.protocol==='https:';
 function read(){try{const x=JSON.parse(localStorage.getItem(key));return x&&x.version===version&&typeof x.allowed==='boolean'&&x.until>Date.now()&&x.until<=Date.now()+ttl?x:null;}catch{return null;}}
 function clearIdentifiers(){
  try{for(const storage of [localStorage,sessionStorage])for(const k of Object.keys(storage))if(k.startsWith('_ym')||['tver_visit_v1','tver_browser_v1'].includes(k))storage.removeItem(k);}catch{}
  for(const entry of document.cookie.split(';')){const name=entry.trim().split('=')[0];if(!name.startsWith('_ym'))continue;for(const domain of ['',location.hostname,'.'+location.hostname])document.cookie=name+'=; Max-Age=0; path=/'+(domain?'; domain='+domain:'')+'; SameSite=Lax; Secure';}
 }
 function stop(){
  allowed=false;document.dispatchEvent(new Event('premier:analytics-stop'));
  if(production&&window.ym){if(Array.isArray(window.ym.a))window.ym.a.length=0;window.ym(counter,'destruct');}
  library?.remove();clearIdentifiers();
 }
 function goal(name){if(allowed&&production&&started&&window.ym)window.ym(counter,'reachGoal',name);}
 function start(){
  if(started||!production||!allowed)return;started=true;
  window.ym=window.ym||function(){(window.ym.a=window.ym.a||[]).push(arguments);};window.ym.l=Date.now();
  let referrer='';try{referrer=new URL(document.referrer).origin+'/';}catch{}
  // Only the canonical URL and referrer origin: no query strings, form fields or user IDs.
  window.ym(counter,'init',{defer:true,ssr:true,webvisor:false,clickmap:false,trackLinks:false,trackHash:false,ecommerce:false,disableYtm:true,accurateTrackBounce:true,url:'https://tver-awards.ru/',referrer});
  window.ym(counter,'hit','https://tver-awards.ru/',{title:'Tver Awards 2026',referer:referrer});
  library=document.createElement('script');library.async=true;library.src='https://mc.yandex.ru/metrika/tag.js?id='+counter;library.referrerPolicy='origin';document.head.append(library);
 }
 function close(){panel.hidden=true;if(returnFocus){returnFocus.focus({preventScroll:true});returnFocus=null;}}
 function choose(value){
  const wasStarted=started;allowed=value;
  try{localStorage.setItem(key,JSON.stringify({version,allowed:value,at:Date.now(),until:Date.now()+ttl}));}catch{}
  panel.dataset.choice=value?'accepted':'declined';settings.textContent='Настройки аналитики';
  if(value){if(wasStarted&&!window.ym?.a){location.reload();return;}start();}else{stop();if(wasStarted){location.reload();return;}}
  close();
 }
 document.getElementById('analytics-accept').addEventListener('click',()=>choose(true));
 document.getElementById('analytics-decline').addEventListener('click',()=>choose(false));
 settings.addEventListener('click',()=>{returnFocus=settings;panel.hidden=false;document.getElementById('analytics-decline').focus({preventScroll:true});});
 window.addEventListener('storage',e=>{if(e.key!==key)return;const consent=read();if(!consent?.allowed){stop();if(started)location.reload();}else if(!allowed){allowed=true;start();close();}});
 document.addEventListener('premier:form-open',e=>{const type=e.detail?.dialog?.querySelector('form[data-request-type]')?.dataset.requestType;if(['nominee','guest'].includes(type))goal('open_'+type);});
 document.addEventListener('premier:form-success',e=>{if(['nominee','guest'].includes(e.detail?.type))goal('success_'+e.detail.type);});
 document.addEventListener('premier:ticket-change',e=>{if(['single','pair'].includes(e.detail?.plan))goal('plan_'+e.detail.plan);});
 const consent=read();if(consent){allowed=consent.allowed;panel.hidden=true;if(allowed)start();else clearIdentifiers();}else{clearIdentifiers();panel.hidden=false;}
})();
