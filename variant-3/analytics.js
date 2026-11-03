(()=>{'use strict';
 if(location.hostname!=='tver-awards.ru'||location.protocol!=='https:'||navigator.webdriver)return;
 let stopped=false;
 try{const consent=JSON.parse(localStorage.getItem('tver_analytics_consent_v1'));if(!consent?.allowed||consent.version!=='2026-10-27.1'||consent.until<=Date.now())return;}catch{return;}
 const key='tver_visit_v1',idle=30*60*1000;let visit,queue=[],timer,seen=new Set(),started=new Set();
 const visitorKey='tver_browser_v1',visitorLifetime=90*24*60*60*1000;
 function browserVisitor(){
  try{
   const stored=localStorage.getItem(visitorKey);let record=null;try{record=JSON.parse(stored||'null');}catch{}
   const now=Date.now();
   if(!record||!/^([a-f0-9]{32})$/.test(record.id||'')||!Number.isFinite(record.until)||record.until<=now||record.until>now+visitorLifetime){
    record={id:crypto.randomUUID().replaceAll('-',''),until:now+visitorLifetime};
    localStorage.setItem(visitorKey,JSON.stringify(record));
   }
   return record.id;
  }catch{return undefined;}
 }
 function source(){const known={vk:'vk',vkontakte:'vk',telegram:'telegram',tg:'telegram',instagram:'instagram',ig:'instagram',yandex:'yandex',google:'google'};const utm=new URLSearchParams(location.search).get('utm_source');if(utm&&known[utm.toLowerCase()])return known[utm.toLowerCase()];try{const host=new URL(document.referrer).hostname;if(host===location.hostname)return 'direct';if(/(^|\.)vk\.(com|ru)$/.test(host))return 'vk';if(/(^|\.)(t\.me|telegram\.org)$/.test(host))return 'telegram';if(/(^|\.)instagram\.com$/.test(host))return 'instagram';if(/(^|\.)yandex\.(ru|com)$/.test(host))return 'yandex';if(/(^|\.)google\.[a-z.]+$/.test(host))return 'google';return 'other';}catch{return 'direct';}}
 function newVisit(){return {id:crypto.randomUUID().replaceAll('-',''),at:Date.now(),source:source(),device:innerWidth<768?'mobile':innerWidth<1100?'tablet':'desktop'};}
 try{visit=JSON.parse(sessionStorage.getItem(key)||'null');}catch{}
 if(!visit||!visit.id||Date.now()-visit.at>idle)visit=newVisit();
 function persist(){try{sessionStorage.setItem(key,JSON.stringify(visit));}catch{}}
 function flush(){if(stopped)return;clearTimeout(timer);if(!queue.length)return;const events=queue.splice(0,12),body=JSON.stringify({visitor:browserVisitor(),session:visit.id,source:visit.source,device:visit.device,events});try{navigator.sendBeacon('/api/metrics.php',new Blob([body],{type:'application/json'}));}catch{}if(queue.length)flush();}
 function event(name){if(stopped)return;if(document.visibilityState==='hidden'&&name==='page_view')return;if(Date.now()-visit.at>idle){flush();visit=newVisit();seen.clear();started.clear();queue.push('page_view');}visit.at=Date.now();persist();queue.push(name);clearTimeout(timer);timer=setTimeout(flush,600);if(queue.length>=12)flush();}
 function once(name){if(seen.has(name))return;seen.add(name);event(name);}
 if(document.visibilityState==='visible')event('page_view');else document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')once('page_view');},{once:true});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush();});window.addEventListener('pagehide',flush);
 document.addEventListener('premier:analytics-stop',()=>{stopped=true;queue=[];clearTimeout(timer);observer.disconnect();for(const t of visibilityTimers.values())clearTimeout(t);});
 const visibilityTimers=new Map();const observer=new IntersectionObserver(entries=>{for(const item of entries){const name='section_'+item.target.id;if(item.isIntersecting){if(!visibilityTimers.has(name))visibilityTimers.set(name,setTimeout(()=>{if(document.visibilityState==='visible')once(name);},1000));}else{clearTimeout(visibilityTimers.get(name));visibilityTimers.delete(name);}}},{threshold:0,rootMargin:'-15% 0px -15% 0px'});
 for(const id of ['about','season-2025','nominations','process','history','evening','tickets']){const el=document.getElementById(id);if(el)observer.observe(el);}
 document.addEventListener('premier:form-open',e=>{const form=e.detail.dialog.querySelector('form[data-request-type]'),type=form?.dataset.requestType;if(!type)return;event('open_'+type);if(type==='nominee'){const n=form.elements.nomination.value;if(n)event('nom_'+n);}});
 document.addEventListener('premier:ticket-change',e=>event('plan_'+e.detail.plan));
 document.addEventListener('premier:form-success',e=>{if(['nominee','guest'].includes(e.detail.type))event('success_'+e.detail.type);});
 document.addEventListener('input',e=>{const form=e.target.closest('form[data-request-type]');if(!form)return;const type=form.dataset.requestType;if(!started.has(type)){started.add(type);event('start_'+type);}});
 document.addEventListener('change',e=>{if(e.target.id==='nomination'&&e.target.value)event('nom_'+e.target.value);});
 document.addEventListener('click',e=>{const el=e.target.closest('a,button');if(!el)return;const href=el.getAttribute('href')||'';if(href==='#apply')event('click_apply');else if(href==='#tickets'||href==='#guest')event('click_tickets');else if(el.matches('.gallery-trigger,#archive-button'))event('click_gallery');else if(href.startsWith('https://disk.yandex.ru/'))event('click_album');else if(/yandex\.(ru|com)\/maps/.test(href))event('click_map');});
})();
