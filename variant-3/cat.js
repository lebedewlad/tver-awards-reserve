/* Tver Awards illustrated kitten companion. No remote assets, telemetry or permissions. */
(() => {
  'use strict';
  if (document.querySelector('.awards-cat')) return;
  const key = 'tver-cat-hidden-v1';
  const readHidden = () => { try { return localStorage.getItem(key) === '1'; } catch { return false; } };
  const saveHidden = value => { try { localStorage.setItem(key, value ? '1' : '0'); } catch {} };
  const root = document.createElement('aside');
  root.className = 'awards-cat'; root.hidden = true;
  root.setAttribute('aria-label', 'Кот премии');
  root.innerHTML = `<button class="awards-cat__pet" type="button" aria-label="Кот премии. Погладить или поиграть" aria-expanded="false" aria-controls="awards-cat-panel"><canvas width="256" height="224" aria-hidden="true"></canvas></button>
    <section class="awards-cat__panel" id="awards-cat-panel" aria-label="Поиграть с котом" hidden><strong>Кот премии</strong><button type="button" class="awards-cat__close" aria-label="Закрыть меню кота">×</button><p>Перетащите кота на заголовок.<br>Мячик можно бросить пальцем или мышью.</p><div class="awards-cat__actions"><button type="button" data-cat-action="pet">Погладить</button><button type="button" data-cat-action="play">Мячик</button></div><button type="button" class="awards-cat__hide">Спрятать кота</button></section>
    <span class="awards-cat__bubble" role="status" hidden></span><button class="awards-cat__ball" type="button" aria-label="Мячик. Потяните и отпустите, чтобы бросить. Нажмите, чтобы подбросить." hidden></button><span class="awards-cat__landing" hidden aria-hidden="true"></span>`;
  document.body.append(root);
  const pet = root.querySelector('.awards-cat__pet');
  const panel = root.querySelector('.awards-cat__panel');
  const bubble = root.querySelector('.awards-cat__bubble');
  const ball = root.querySelector('.awards-cat__ball');
  const landing = root.querySelector('.awards-cat__landing');
  const ctx = root.querySelector('canvas').getContext('2d');
  if (!ctx) { root.remove(); return; }
  const setting = document.createElement('button');
  setting.type = 'button'; setting.className = 'awards-cat-setting';
  (document.querySelector('.footer') || document.body).append(setting);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const small = matchMedia('(max-width: 600px)');
  let spriteLoaded = false;
  let hidden = readHidden(), ready = false, blocked = false, menu = false, hovered = false;
  let x = 20, direction = 1, state = 'walk', stateTime = 0, elapsed = 0, last = 0, raf = 0, lastDraw = -1;
  let drag = null, lift = 0, bubbleTimer = 0, suppressClick = false;
  let bubbleWidth=180;
  let bounds = 200, panelWidth = 264, catWidth = 128, catHeight = 112, floorY = 0;
  let perch = null, candidate = null, platforms = [], ballDrag = null, ballMoved = false;
  const toy = { x:0, y:0, vx:0, vy:0, active:false, flying:false, caught:false };
  function floorMetrics() {
    catWidth=small.matches?112:128;catHeight=small.matches?98:112;
    // Match the actual CSS safe-area inset, including iPhone home indicators.
    const bottom=parseFloat(getComputedStyle(pet).bottom)||10;
    floorY=innerHeight-bottom-7*(catWidth/128);
  }
  function fullBound(){return Math.max(12,innerWidth-catWidth-12);}
  function collectPlatforms(){
    platforms=[];
    document.querySelectorAll('main h1,main h2,main h3,main .intro-label,main .scene-label').forEach(el=>{
      const style=getComputedStyle(el),box=el.getBoundingClientRect();
      if(box.bottom<80||box.top>innerHeight-35||style.visibility==='hidden'||Number(style.opacity)<.3)return;
      let parent=el;while(parent&&parent!==document.body){if(Number(getComputedStyle(parent).opacity)<.3)return;parent=parent.parentElement;}
      const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);
      while(walker.nextNode()){
        const node=walker.currentNode;if(!node.textContent.trim())continue;
        const range=document.createRange();range.selectNodeContents(node);
        [...range.getClientRects()].forEach((r,index)=>{
          if(r.width>36&&r.top>85&&r.top<innerHeight-40&&r.right>20&&r.left<innerWidth-20)
            platforms.push({range,index,left:r.left,right:r.right,y:r.top+r.height*.27});
        });
      }
    });
  }
  function findPlatform(px,py){
    let best=null,score=Infinity;
    for(const item of platforms){
      if(px<item.left-22||px>item.right+22)continue;
      const d=Math.abs(py-item.y);
      if(d<65&&d<score){score=d;best=item;}
    }
    return best;
  }
  function previewLanding(item){
    candidate=item;landing.hidden=!item;
    if(item){landing.style.transform=`translate(${Math.max(8,item.left)}px,${item.y}px)`;landing.style.width=`${Math.min(innerWidth-16,item.right)-Math.max(8,item.left)}px`;}
  }
  function updatePerch(){
    if(!perch)return;
    const el=perch.range.startContainer.parentElement;
    const rect=[...perch.range.getClientRects()][perch.index];
    if(!el?.isConnected||!rect){perch=null;state='sit';stateTime=0;return;}
    const out=rect.top<catHeight+65||rect.top>innerHeight-24||Number(getComputedStyle(el).opacity)<.3;
    pet.style.visibility=out?'hidden':'';
    if(out){menu=false;panel.hidden=true;pet.setAttribute('aria-expanded','false');bubble.hidden=true;}
    const feet=rect.top+rect.height*.27;
    x=clamp(rect.left+rect.width*perch.ratio-catWidth/2,12,fullBound());
    lift=Math.max(0,floorY-feet);
  }
  function stopToy(){toy.active=false;toy.flying=false;ball.hidden=true;ballDrag=null;}
  function showToy(){
    closeMenu(true);stopToy();toy.active=true;toy.caught=false;
    toy.x=clamp(x+catWidth+35,30,innerWidth-112);toy.y=floorY-18;toy.vx=0;toy.vy=0;
    ball.hidden=false;state='sit';stateTime=0;say('Потяните мячик и отпустите',3200);position();kick();
  }
  function throwToy(vx,vy){
    perch=null;toy.caught=false;toy.vx=clamp(vx,-1100,1100);toy.vy=clamp(vy,-1250,1250);
    if(calm()) {toy.y=floorY-11;toy.vx=0;toy.vy=0;toy.flying=false;state='sit';}
    else {toy.flying=true;state='chase';}
    stateTime=0;position();kick();
  }
  function toyStep(dt){
    if(!toy.active||!toy.flying||ballDrag)return;
    toy.vy+=1300*dt;toy.x+=toy.vx*dt;toy.y+=toy.vy*dt;
    const radius=11,ground=floorY-radius;
    if(toy.x<radius+8){toy.x=radius+8;toy.vx=Math.abs(toy.vx)*.7;}
    if(toy.x>innerWidth-radius-8){toy.x=innerWidth-radius-8;toy.vx=-Math.abs(toy.vx)*.7;}
    if(toy.y<radius+8){toy.y=radius+8;toy.vy=Math.abs(toy.vy)*.6;}
    if(toy.y>ground){toy.y=ground;toy.vy=-Math.abs(toy.vy)*.58;toy.vx*=.82;if(Math.abs(toy.vy)<45)toy.vy=0;}
    // Keep the bottom-right animation toggle free when the ball lands.
    if(toy.y>ground-45&&toy.x>innerWidth-112){toy.x=innerWidth-112;toy.vx=-Math.max(80,Math.abs(toy.vx)*.65);}
    toy.vx*=Math.exp(-(toy.y>=ground-1?2.3:.12)*dt);
    if(toy.y>=ground-1&&Math.abs(toy.vx)<4&&toy.vy===0){toy.flying=false;}
  }
  ball.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    ballMoved=false;ballDrag={id:e.pointerId,startX:e.clientX,startY:e.clientY,dx:toy.x-e.clientX,dy:toy.y-e.clientY,samples:[{x:e.clientX,y:e.clientY,t:e.timeStamp}]};
    toy.flying=false;ball.setPointerCapture(e.pointerId);bubble.hidden=true;
  });
  ball.addEventListener('pointermove',e=>{
    if(!ballDrag||e.pointerId!==ballDrag.id)return;
    if(Math.hypot(e.clientX-ballDrag.startX,e.clientY-ballDrag.startY)>5)ballMoved=true;
    toy.x=clamp(e.clientX+ballDrag.dx,20,innerWidth-20);toy.y=clamp(e.clientY+ballDrag.dy,24,floorY-11);
    ballDrag.samples.push({x:e.clientX,y:e.clientY,t:e.timeStamp});
    ballDrag.samples=ballDrag.samples.filter(p=>e.timeStamp-p.t<=120);
    position();
  });
  function releaseToy(e){
    if(!ballDrag||e.pointerId!==ballDrag.id)return;
    const points=ballDrag.samples,first=points[0];
    const dt=Math.max(16,e.timeStamp-first.t)/1000;
    const vx=(e.clientX-first.x)/dt,vy=(e.clientY-first.y)/dt;
    if(ball.hasPointerCapture(e.pointerId))ball.releasePointerCapture(e.pointerId);
    ballDrag=null;
    if(e.type==='pointercancel'){toy.y=floorY-11;toy.flying=false;position();return;}
    if(ballMoved)throwToy(vx,vy);
  }
  ball.addEventListener('pointerup',releaseToy);ball.addEventListener('pointercancel',releaseToy);
  ball.addEventListener('click',e=>{
    if(ballMoved&&e.detail!==0){ballMoved=false;return;}
    throwToy(toy.x>innerWidth/2?-300:300,-620);
  });
  const calm = () => reduced.matches || document.documentElement.classList.contains('motion-paused');
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  function metrics() {
    // Reserve the bottom-right corner for the site's animation control.
    floorMetrics();
    const width = catWidth;
    bounds = Math.max(12, innerWidth - width - (innerWidth < 360 ? 100 : 154));
    panelWidth = Math.min(264, innerWidth - 24);
    x = clamp(x, 12, perch?fullBound():bounds);
    if(toy.active){toy.x=clamp(toy.x,20,innerWidth-20);toy.y=Math.min(toy.y,floorY-11);}
    updatePerch();
    position();
  }
  function position() {
    if(!perch)pet.style.visibility='';
    pet.style.transform = `translate3d(${x.toFixed(1)}px,${(-lift).toFixed(1)}px,0)`;
    panel.style.left = `${clamp(x - 20, 12, innerWidth - panelWidth - 12)}px`;
    panel.style.width = `${panelWidth}px`;
    bubble.style.left = `${clamp(x - 10, 12, Math.max(12, innerWidth - bubbleWidth - 12))}px`;
    if(toy.active)ball.style.transform=`translate3d(${toy.x-22}px,${toy.y-22}px,0)`;
    // Keep controls close to a perched cat and inside short mobile viewports.
    const catTop=floorY+7*(catWidth/128)-catHeight-lift;
    if(menu){const h=panel.offsetHeight;panel.style.top=`${clamp(catTop-h-10,12,innerHeight-h-12)}px`;}
    bubble.style.top=`${clamp(catTop-42,12,innerHeight-48)}px`;
  }
  function say(text, ms = 2000) {
    clearTimeout(bubbleTimer); bubble.textContent = text; bubble.hidden = false; bubbleWidth=bubble.offsetWidth;position();
    bubbleTimer = setTimeout(() => { bubble.hidden = true; }, ms);
  }
  function closeMenu(focus = false) {
    menu = false; panel.hidden = true; pet.setAttribute('aria-expanded','false');
    if (focus && !root.hidden) pet.focus({preventScroll:true});
    kick();
  }
  function openMenu() {
    menu = true; state = 'sit'; stateTime = 0; stopToy();
    bubble.hidden = true; panel.hidden = false; pet.setAttribute('aria-expanded','true');
    position(); draw(0); panel.querySelector('[data-cat-action]').focus({preventScroll:true});
  }
  function hide(value) {
    hidden = value; saveHidden(value); closeMenu(); sync();
    setting.textContent = hidden ? 'Вернуть кота' : 'Спрятать кота';
    if (value) setting.focus({preventScroll:true});
  }
  setting.addEventListener('click', () => { ready = true; hide(!hidden); });
  setting.textContent = hidden ? 'Вернуть кота' : 'Спрятать кота';
  root.querySelector('.awards-cat__hide').addEventListener('click', () => hide(true));
  root.querySelector('.awards-cat__close').addEventListener('click', () => closeMenu(true));
  root.querySelector('[data-cat-action="pet"]').addEventListener('click', () => {
    closeMenu(true); state = 'happy'; stateTime = 0; say('Мур-р. Спасибо!'); draw(0); kick();
  });
  root.querySelector('[data-cat-action="play"]').addEventListener('click',showToy);
  pet.addEventListener('click', event => {
    if (suppressClick && event.detail !== 0) { suppressClick = false; return; }
    menu ? closeMenu() : openMenu();
  });
  pet.addEventListener('pointerenter', () => { hovered = true; });
  pet.addEventListener('pointerleave', () => { hovered = false; });
  pet.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    suppressClick = false;
    drag = { id:event.pointerId, start:event.clientX, startY:event.clientY, x, lift, moved:false };
    collectPlatforms();
    pet.setPointerCapture(event.pointerId);
  });
  pet.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX-drag.start, dy = event.clientY-drag.startY;
    if (Math.hypot(dx,dy) > 7) drag.moved = true;
    if (!drag.moved) return;
    if (menu) closeMenu();
    stopToy();perch=null;
    direction = dx < 0 ? -1 : 1;
    x = clamp(drag.x + dx,12,fullBound());
    lift = clamp(drag.lift-dy,0,Math.max(0,floorY-100));
    previewLanding(findPlatform(event.clientX,event.clientY));
    position(); draw(0);
  });
  function release(event) {
    if (!drag || event.pointerId !== drag.id) return;
    suppressClick = drag.moved;
    if (pet.hasPointerCapture(event.pointerId)) pet.releasePointerCapture(event.pointerId);
    if(drag.moved&&candidate&&event.type!=='pointercancel'){
      perch={range:candidate.range,index:candidate.index,ratio:clamp((event.clientX-candidate.left)/(candidate.right-candidate.left),0,1)};
      updatePerch();say('Здесь и посижу',1800);
    }
    previewLanding(null);drag = null; state = 'sit'; stateTime = 0;
    if (calm()&&!perch) lift = 0;
    position();draw();
    kick();
  }
  pet.addEventListener('pointerup',release); pet.addEventListener('pointercancel',release);
  document.addEventListener('pointerdown', event => { if (menu && !root.contains(event.target)) closeMenu(); },{passive:true});
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); stopToy();previewLanding(null);closeMenu(true); }
    if (event.target === pet && ['ArrowLeft','ArrowRight'].includes(event.key)) {
      event.preventDefault(); direction = event.key === 'ArrowLeft' ? -1 : 1;
      perch=null;x = clamp(x + direction*24,12,fullBound()); position(); draw(0);
    }
  });
  // The same illustrated kitten in four walking frames and four expressive poses.
  // Keep one sheet decoded in memory; canvas clips cells without extra image requests.
  const sheet = new Image();
  sheet.decoding = 'async'; sheet.fetchPriority = 'low';
  const cells = [
    [0,0,444,444,371], [444,0,443,444,373],
    [887,0,443,444,372], [1330,0,444,444,373],
    [0,444,444,443,382], [444,444,443,443,387],
    [887,444,443,443,366], [1330,444,444,443,411]
  ];
  function draw() {
    ctx.clearRect(0,0,256,224);
    if (!spriteLoaded) return;
    const moving=(state==='walk'||state==='chase')&&!perch&&!menu&&(!hovered||state==='chase')&&!calm()&&!drag;
    const held=!!drag?.moved||(!perch&&lift>1);
    const pose=held?7:state==='happy'?5:state==='sleep'?6:moving?Math.floor(elapsed*(state==='chase'?12:6))%4:4;
    const [sx,sy,sw,sh,feet]=cells[pose];
    const scale=.25;
    const breath=calm()||moving||held?0:Math.sin(elapsed*2.1)*.55;
    ctx.save();ctx.scale(2,2);
    if(direction<0){ctx.translate(128,0);ctx.scale(-1,1);}
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    // Baseline normalization stops the feet jumping between generated frames.
    const dw=sw*scale,dh=sh*scale+breath;
    const dy=105-feet*(dh/sh);
    ctx.drawImage(sheet,sx,sy,sw,sh,(128-dw)/2,dy,dw,dh);
    ctx.restore();
  }
  sheet.onload=()=>{spriteLoaded=true;sync();};
  sheet.onerror=()=>{root.hidden=true;setting.hidden=true;};
  sheet.src='/assets/cat/kitten-v2.webp';
  function tick(now) {
    raf=0;
    if(root.hidden||document.hidden) {last=0;return;}
    const dt=last?Math.min((now-last)/1000,.04):0; last=now;
    if(calm()) {if(!perch)lift=0;updatePerch();position();draw(0);last=0;return;}
    elapsed+=dt;
    updatePerch();toyStep(dt);
    if(!drag&&!perch){lift=Math.max(0,lift-dt*480);}
    if(!menu&&!drag&&!perch&&(!hovered||state==='chase')&&lift===0){
      stateTime+=dt;
      if(state==='chase'&&toy.active&&!ballDrag){
        const goal=clamp(toy.x-catWidth/2,12,fullBound()),dist=goal-x;
        if(Math.abs(dist)>1)direction=dist>0?1:-1;
        x+=Math.sign(dist)*Math.min(Math.abs(dist),dt*155);
        if(Math.abs(dist)<15&&toy.y>floorY-42&&Math.abs(toy.vy)<180){
          toy.flying=false;toy.caught=true;toy.vx=0;toy.vy=0;toy.y=floorY-11;
          state='happy';stateTime=0;say('Ещё раз?',1700);
        }
      }else if(state==='walk'){
        x+=direction*dt*22;
        if((x>=bounds&&direction>0)||x<=12){x=clamp(x,12,fullBound());direction*=-1;state='sit';stateTime=0;}
        if(stateTime>7){state='sit';stateTime=0;}
      }else if(state==='happy'&&stateTime>2.3){state='sit';stateTime=0;}
      else if(state==='sit'&&stateTime>3&&!toy.active){state=Math.random()<.35?'sleep':'walk';if(x>bounds)direction=-1;stateTime=0;}
      else if(state==='sleep'&&stateTime>9){state='walk';stateTime=0;}
    }
    position();
    const frame=Math.floor(elapsed*24);
    if(frame!==lastDraw){draw(frame);lastDraw=frame;}
    raf=requestAnimationFrame(tick);
  }
  function kick(){ if(!raf&&!root.hidden&&!document.hidden){last=0;raf=requestAnimationFrame(tick);} }
  function sync(){
    const consent=document.getElementById('analytics-consent');
    blocked=!!document.querySelector('dialog[open]') || !!(consent&&!consent.hidden) || !!document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
    root.hidden=hidden||blocked||!ready||!spriteLoaded;
    if(root.hidden){if(raf)cancelAnimationFrame(raf);raf=0;last=0;drag=null;ballDrag=null;previewLanding(null);if(!perch)lift=0;closeMenu();}
    else {position();draw(0);kick();}
  }
  // Observe only UI state, not animated inline styles (avoids work on every frame).
  const observer=new MutationObserver(sync);
  document.querySelectorAll('dialog,#analytics-consent').forEach(el=>observer.observe(el,{attributes:true,attributeFilter:['open','hidden']}));
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  document.addEventListener('focusin',sync);document.addEventListener('focusout',()=>queueMicrotask(sync));
  document.addEventListener('visibilitychange',()=>{ if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}else sync(); });
  window.addEventListener('resize',metrics,{passive:true});
  window.addEventListener('scroll',()=>{if(perch){updatePerch();position();draw();kick();}if(drag)collectPlatforms();},{passive:true});
  reduced.addEventListener('change',sync);
  metrics();draw(0);
  setTimeout(()=>{ready=true;sync();},4500);
})();
