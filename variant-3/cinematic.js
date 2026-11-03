/* Shared scroll clock, cached geometry, compositor-only card movement. */
(()=>{
 const root=document.documentElement,engine=window.PremierMotion,reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const process=document.querySelector('#process'),screen=process.querySelector('.process-screen'),steps=[...process.querySelectorAll('.steps li')],count=process.querySelector('.process-count'),nav=[...process.querySelectorAll('[data-stage]')],media=process.querySelector('.media-note'),words=[...media.querySelectorAll('h3 span')];
 const history=document.querySelector('#history'),historyScreen=history.querySelector('.history-screen'),gallery=history.querySelector('.history-gallery'),photos=[...gallery.children],bottom=history.querySelector('.archive-bottom');
 const clamp=x=>Math.min(1,Math.max(0,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
 count.replaceChildren(...steps.map((_,i)=>{const el=document.createElement('span');el.textContent=`0${i+1}`;return el}));
 const digits=[...count.children];let enabled=false,metrics=null,processTravel=1,galleryTravel=1,p=0,h=0,w=0,first=true,lastIndex=-1,viewportWidth=0,viewportHeight=0;
 function configure(){
  const next=!reduce.matches&&!root.classList.contains('motion-paused')&&innerHeight>=620;
  enabled=next;root.classList.toggle('cinema-ready',next);
  if(next){
   const sh=screen.offsetHeight,hh=historyScreen.offsetHeight,mh=media.offsetHeight,bh=bottom.offsetHeight;
   processTravel=Math.round(sh*1.7);galleryTravel=Math.round(hh*.7);
   process.style.height=`${sh+processTravel+mh}px`;media.style.marginTop=`${processTravel}px`;
   history.style.height=`${hh+galleryTravel+bh+60}px`;bottom.style.marginTop=`${galleryTravel}px`;
  }else{
   [process,media,history,bottom].forEach(el=>{el.style.height='';el.style.marginTop=''});
   steps.forEach(el=>{el.style.opacity='';el.style.transform='';el.inert=false;el.removeAttribute('aria-hidden')});
   words.forEach(el=>{el.style.removeProperty('--word-color');el.style.transform=''});photos.forEach(el=>el.style.removeProperty('transform'));
  }
  first=true;lastIndex=-1;metrics=null;viewportWidth=innerWidth;viewportHeight=innerHeight;engine.invalidate();
 }
 engine.subscribe(state=>{
  if(!enabled)return null;
  if(state.layout||!metrics){
   const cardWidth=gallery.offsetHeight*2/3,finalScale=Math.min(1,(gallery.clientWidth-24)/(3*cardWidth));
   metrics={offset:state.width<=680?60:64,pt:process.getBoundingClientRect().top+state.y,ph:process.offsetHeight,ht:history.getBoundingClientRect().top+state.y,hh:history.offsetHeight,mt:media.getBoundingClientRect().top+state.y,mh:media.offsetHeight,finalScale,spread:cardWidth*finalScale+12};
  }
  const g=metrics,pt=clamp((state.y+g.offset-g.pt)/processTravel),ht=clamp((state.y+g.offset-g.ht)/galleryTravel),wt=clamp((state.y+state.height*.86-g.mt)/(state.height*.62));
  const ap=state.y+state.height>g.pt&&state.y<g.pt+g.ph,ah=state.y+state.height>g.ht&&state.y<g.ht+g.hh,aw=state.y+state.height>g.mt&&state.y<g.mt+g.mh;
  p=first||!ap?pt:engine.damp(p,pt,state.dt);h=first||!ah?ht:engine.damp(h,ht,state.dt,105);w=first||!aw?wt:engine.damp(w,wt,state.dt);first=false;
  return()=>{
   if(ap){
    const position=Math.max(0,Math.min(3,p*3.55-.25)),index=Math.round(position);
    digits.forEach((el,i)=>{const d=position-i;el.style.opacity=String(1-smooth((Math.abs(d)-.2)/.7));el.style.transform=`translate3d(0,${-d*70}%,0)`});
    steps.forEach((el,i)=>{const delta=position-i;el.style.opacity=String(1-smooth((Math.abs(delta)-.12)/.38));el.style.transform=`translate3d(0,${-delta*65}px,0)`});
    nav.forEach((el,i)=>el.style.setProperty('--fill',String(clamp(position-i+1))));
    if(index!==lastIndex){steps.forEach((el,i)=>{el.inert=i!==index;el.setAttribute('aria-hidden',String(i!==index))});nav.forEach((el,i)=>{if(i===index)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current')});lastIndex=index}
   }
   if(aw)words.forEach((el,i)=>{const progress=smooth((w-i*.2)/.4),a=[139,132,116],b=[239,210,145];el.style.setProperty('--word-color',`rgb(${a.map((v,j)=>Math.round(v+(b[j]-v)*progress)).join(',')})`);el.style.transform=`translate3d(0,${(1-progress)*10}px,0)`});
   if(ah){const hp=smooth(h);photos.forEach((el,i)=>{const side=i-1;el.style.setProperty('transform',`translate3d(calc(-50% + ${side*(20+(g.spread-20)*hp)}px),${Math.abs(side)*18*(1-hp)}px,0) rotate(${side*12*(1-hp)}deg) scale(${(1-Math.abs(side)*.06)*(1-hp)+g.finalScale*hp})`,'important')})}
   return(ap&&Math.abs(p-pt)>.00015)||(ah&&Math.abs(h-ht)>.00015)||(aw&&Math.abs(w-wt)>.00015);
  };
 });
 nav.forEach((el,i)=>el.addEventListener('click',()=>{if(enabled&&metrics)window.scrollTo({top:metrics.pt-metrics.offset+processTravel*((i+.25)/3.55),behavior:reduce.matches?'instant':'smooth'})}));
 addEventListener('resize',()=>{if(innerWidth!==viewportWidth||Math.abs(innerHeight-viewportHeight)>120)configure()});
 document.addEventListener('premier:motion',configure);document.fonts.ready.then(configure);configure();
})();
