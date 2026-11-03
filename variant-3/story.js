(()=>{
 const root=document.documentElement,engine=window.PremierMotion,media=matchMedia('(prefers-reduced-motion:reduce)'),toggle=document.querySelector('#motion-toggle');
 const story=document.querySelector('.scroll-story'),storyScreen=story.querySelector('.story-screen'),disc=story.querySelector('.story-disc'),copies=[...story.querySelectorAll('.story-copy')];
 const memory=document.querySelector('.memory-story'),screen=memory.querySelector('.memory-screen'),portrait=memory.querySelector('.memory-portrait'),caption=memory.querySelector('.memory-copy'),progress=document.querySelector('.reading-progress');
 const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)},range=(x,a,b)=>smooth((x-a)/(b-a));
 let paused=media.matches,metrics=null,p=0,m=0,first=true,lastScene=-2;
 function update(){
  root.classList.toggle('motion-paused',paused);root.classList.add('memory-unified');
  toggle.setAttribute('aria-pressed',String(paused));toggle.setAttribute('aria-label',paused?'Включить анимации':'Отключить анимации');
  toggle.firstElementChild.textContent=paused?'▷':'Ⅱ';toggle.querySelector('.motion-label').textContent=paused?'Без движения':'Анимация';
  if(paused)copies.forEach(el=>el.inert=false);
  first=true;lastScene=-2;engine.invalidate();document.dispatchEvent(new Event('premier:motion'));
 }
 engine.subscribe(state=>{
  if(state.layout||!metrics){
   const offset=state.width<681?60:64;
   metrics={offset,storyTop:story.getBoundingClientRect().top+state.y,storyHeight:story.offsetHeight,storyTravel:Math.max(1,story.offsetHeight-storyScreen.offsetHeight),memoryTop:memory.getBoundingClientRect().top+state.y,memoryHeight:memory.offsetHeight,memoryTravel:Math.max(1,memory.offsetHeight-screen.offsetHeight),photoHeight:portrait.offsetHeight,screenHeight:screen.offsetHeight,max:Math.max(1,root.scrollHeight-state.height)};
  }
  const g=metrics,target=clamp((state.y+g.offset-g.storyTop)/g.storyTravel),mt=clamp((state.y+g.offset-g.memoryTop)/g.memoryTravel);
  const inStory=state.y+state.height>g.storyTop&&state.y<g.storyTop+g.storyHeight;
  const inMemory=state.y+state.height>g.memoryTop&&state.y<g.memoryTop+g.memoryHeight;
  p=first||!inStory?target:engine.damp(p,target,state.dt,90);
  m=first||!inMemory?mt:engine.damp(m,mt,state.dt,110);first=false;
  return()=>{
   progress.style.transform=`scaleX(${clamp(state.y/g.max)})`;
   if(paused)return false;
   if(inStory){
    // Keep the medal visible behind the copy throughout the scroll story.
    const intro=range(p,0,.22);
    disc.style.transform=`translate3d(0,${-intro*28}px,0) scale(${1+intro*1.25}) rotate(${-12+p*110}deg)`;
    disc.style.opacity=String(1-.84*range(p,.035,.23));
    const phases=[[.07,.20,.34,.45],[.45,.56,.65,.76],[.76,.87,1.04,1.16]];
    let current=-1;
    copies.forEach((el,i)=>{
     const [a,b,c,d]=phases[i],enter=range(p,a,b),exit=range(p,c,d),alpha=enter*(1-exit);
     el.style.opacity=alpha.toFixed(4);el.style.transform=`translate3d(0,calc(-50% + ${(1-enter)*30-exit*26}px),0)`;
     if(alpha>.5)current=i;
    });
    if(current!==lastScene){copies.forEach((el,i)=>{el.inert=i!==current;el.style.pointerEvents=i===current?'auto':'none'});lastScene=current;}
   }
   if(inMemory){
    const reveal=range(m,0,.82),mobile=state.width<=680;
    const scale=mobile?.56+.44*reveal:.64+.36*reveal;
    portrait.style.transform=`translate3d(0,${mobile?-(1-reveal)*g.screenHeight*.1:(1-reveal)*12}px,0) scale(${scale})`;
    // Mobile image fills the sticky screen; the readable caption stays on top.
    caption.style.transform=mobile?`translate3d(0,${(1-reveal)*10}px,0)`:'none';
   }
   return (inStory&&Math.abs(p-target)>.00015)||(inMemory&&Math.abs(m-mt)>.00015);
  };
 });
 toggle.addEventListener('click',()=>{paused=!paused;update()});media.addEventListener('change',()=>{paused=media.matches;update()});update();
})();
