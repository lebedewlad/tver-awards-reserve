/* Different motion materials, one restrained rhythm. Content stays visible by default. */
(()=>{
 const root=document.documentElement,reduce=matchMedia('(prefers-reduced-motion:reduce)');
 const paused=()=>root.classList.contains('motion-paused')||reduce.matches;
 const ease='cubic-bezier(.22,1,.36,1)',active=new Set(),seen=new WeakSet();
 function play(el,frames,options={}){
  if(!el||paused())return null;
  const animation=el.animate(frames,{duration:480,easing:ease,...options});
  active.add(animation);animation.finished.catch(()=>{}).finally(()=>active.delete(animation));return animation;
 }
 const enter=new IntersectionObserver(entries=>{
  entries.filter(e=>e.isIntersecting&&!seen.has(e.target)).forEach((e,index)=>{
   const el=e.target;seen.add(el);enter.unobserve(el);if(paused())return;
   const delay=Math.min(index*35,140);
   switch(el.dataset.motion){
    case 'headline':
     play(el,[{opacity:.45,translate:'0 10px'},{opacity:1,translate:'0 0'}],{duration:540});
     if(el.querySelector('span'))play(el.querySelector('span'),[{opacity:.35},{opacity:1}],{duration:650,delay:70});break;
    case 'nomination':
     play(el.querySelector('.nom-text'),[{opacity:.35,translate:'-12px 0'},{opacity:1,translate:'0 0'}],{duration:430,delay});
     play(el.querySelector('.nom-arrow'),[{opacity:.3,scale:'.84'},{opacity:1,scale:'1'}],{duration:350,delay:delay+60});break;
    case 'step':
     play(el.querySelector('.step-number'),[{opacity:.3,scale:'.9'},{opacity:1,scale:'1'}],{duration:400,delay});
     play(el.querySelector('h3'),[{opacity:.4,translate:'8px 0'},{opacity:1,translate:'0 0'}],{duration:450,delay});
     play(el.querySelector('p'),[{opacity:.35},{opacity:1}],{duration:550,delay:delay+60});break;
    case 'photo':
     // Opacity and a smaller-to-natural image avoid revealing cropped faces.
     play(el,[{opacity:.3},{opacity:1}],{duration:650,delay});
     play(el.querySelector('img'),[{scale:'.97'},{scale:'1'}],{duration:760,delay});
     play(el.querySelector('span'),[{opacity:.3,translate:'0 7px'},{opacity:1,translate:'0 0'}],{duration:420,delay:delay+80});break;
    case 'media':
     play(el,[{opacity:.45},{opacity:1}],{duration:600});
     play(el,[{transform:'scaleX(.08)'},{transform:'scaleX(1)'}],{duration:700,pseudoElement:'::before'});
     play(el.querySelector('h3'),[{translate:'0 8px'},{translate:'0 0'}],{duration:480});break;
    case 'detail':
     play(el,[{opacity:.5,translate:'12px 0'},{opacity:1,translate:'0 0'}],{duration:460,delay});break;
    case 'ticket':
     play(el,[{opacity:.5,transform:'perspective(900px) translateY(24px) rotateX(7deg)'},{opacity:1,transform:'perspective(900px) translateY(0) rotateX(0deg)'}],{duration:650});
     el.querySelectorAll('.ticket-includes li').forEach((item,i)=>play(item,[{opacity:.4,translate:'8px 0'},{opacity:1,translate:'0 0'}],{duration:360,delay:80+i*45}));break;
    case 'question':
     play(el.querySelector('summary'),[{opacity:.4,translate:'8px 0'},{opacity:1,translate:'0 0'}],{duration:380,delay});break;
    case 'partner':
     play(el,[{opacity:.55,translate:'0 14px'},{opacity:1,translate:'0 0'}],{duration:580,delay});break;
    case 'footer':
     play(el,[{opacity:.4},{opacity:1}],{duration:650});break;
   }
  });
 },{threshold:.18});
 const groups={headline:'.nominations .section-heading h2,.tickets .section-heading h2,.evening-heading h2,.questions h2',nomination:'.nomination-item',detail:'.event-details>div',ticket:'.ticket-picker',question:'.questions details',partner:'.partner-link',footer:'.footer'};
 Object.entries(groups).forEach(([type,selector])=>document.querySelectorAll(selector).forEach(el=>{el.dataset.motion=type;enter.observe(el);}));
 // Keep the accepted opening composition; only its initial entrance is softened.
 ['.intro-label','.story-intro h1','.story-intro>p','.story-intro>.button'].forEach((selector,i)=>play(document.querySelector(selector),[{opacity:.4,translate:'0 9px'},{opacity:1,translate:'0 0'}],{duration:560,delay:i*55}));
 document.querySelectorAll('.steps li').forEach(step=>{step.classList.add('is-current');step.style.setProperty('--step-progress','1')});
 // One source of tab feedback, whether changed by touch, keyboard or the form select.
 document.addEventListener('premier:ticket-change',e=>{
  const direction=e.detail.direction||1;
  const summary=document.querySelector('.ticket-summary');
  summary.getAnimations().forEach(a=>a.cancel());
  play(summary,[{opacity:.4,translate:`${direction*10}px 0`},{opacity:1,translate:'0 0'}],{duration:260});
 });
 document.addEventListener('premier:form-open',e=>{
  const dialog=e.detail.dialog;
  play(dialog.querySelector('.request-dialog-body'),[{opacity:.55,translate:'0 6px'},{opacity:1,translate:'0 0'}],{duration:260,delay:35});
 });
 // Accordion height is measured once per action, never during scroll.
 document.querySelectorAll('.questions details').forEach(details=>{
  const summary=details.querySelector('summary');let desired=details.open,revision=0,animation=null;
  summary.addEventListener('click',event=>{
   event.preventDefault();const currentHeight=details.getBoundingClientRect().height;
   desired=!desired;const version=++revision;animation?.cancel();
   if(paused()){details.open=desired;details.style.overflow='';return;}
   details.open=true;details.style.overflow='hidden';
   const border=parseFloat(getComputedStyle(details).borderBottomWidth)||0;
   const height=desired?details.getBoundingClientRect().height:summary.getBoundingClientRect().height+border;
   if(desired)play(details.querySelector('p'),[{opacity:0,translate:'0 -5px'},{opacity:1,translate:'0 0'}],{duration:240});
   animation=play(details,[{height:`${currentHeight}px`},{height:`${height}px`}],{duration:desired?300:210});
   animation?.finished.catch(()=>{}).finally(()=>{if(version===revision){details.open=desired;details.style.overflow='';animation=null;}});
  });
 });
 new MutationObserver(()=>{if(paused())active.forEach(a=>a.cancel());}).observe(root,{attributes:true,attributeFilter:['class']});
 reduce.addEventListener('change',()=>{if(paused())active.forEach(a=>a.cancel());});
})();
