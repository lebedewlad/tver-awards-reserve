/* One read/write frame pipeline. Native scrolling stays native. */
(()=>{
 const clients=new Set();let frame=0,last=0,layout=true;
 function request(){if(!frame&&!document.hidden)frame=requestAnimationFrame(tick);}
 function tick(now){
  frame=0;
  if(document.hidden||document.body.style.position==='fixed'){last=0;return;}
  const dt=Math.min(last?now-last:16.67,50);last=now;
  const state={now,dt,y:scrollY,width:innerWidth,height:innerHeight,layout};
  // All geometry reads precede all animation writes.
  const paints=[...clients].map(client=>client(state));layout=false;
  let moving=false;for(const paint of paints)if(paint)moving=paint()||moving;
  if(moving)request();else last=0;
 }
 window.PremierMotion={
  subscribe(client){clients.add(client);layout=true;request();return()=>clients.delete(client)},
  invalidate(){layout=true;request()},request,
  damp(value,target,dt,tau=85){return Math.abs(value-target)<.00015?target:value+(target-value)*(1-Math.exp(-dt/tau))}
 };
 addEventListener('scroll',request,{passive:true});
 document.addEventListener('close',request,true);
 let width=innerWidth,height=innerHeight;
 addEventListener('resize',()=>{
  // Mobile browser toolbar motion must not keep rebuilding sticky timelines.
  if(innerWidth!==width||Math.abs(innerHeight-height)>120){width=innerWidth;height=innerHeight;layout=true;}
  request();
 },{passive:true});
 addEventListener('orientationchange',()=>{layout=true;request()});
 addEventListener('pageshow',()=>{layout=true;request()});
 document.addEventListener('visibilitychange',()=>{last=0;if(!document.hidden){layout=true;request()}});
 document.fonts.ready.then(()=>{layout=true;request()});
})();
