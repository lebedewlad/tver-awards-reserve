/* Original Tver Awards pixel companion. No remote assets, telemetry or permissions. */
(() => {
  'use strict';
  if (document.querySelector('.awards-cat')) return;
  const key = 'tver-cat-hidden-v1';
  const readHidden = () => { try { return localStorage.getItem(key) === '1'; } catch { return false; } };
  const saveHidden = value => { try { localStorage.setItem(key, value ? '1' : '0'); } catch {} };
  const root = document.createElement('aside');
  root.className = 'awards-cat'; root.hidden = true;
  root.setAttribute('aria-label', 'Кот премии');
  root.innerHTML = `<button class="awards-cat__pet" type="button" aria-label="Кот премии. Погладить или поиграть" aria-expanded="false" aria-controls="awards-cat-panel"><canvas width="48" height="36" aria-hidden="true"></canvas></button>
    <section class="awards-cat__panel" id="awards-cat-panel" aria-label="Поиграть с котом" hidden><strong>Кот премии</strong><button type="button" class="awards-cat__close" aria-label="Закрыть меню кота">×</button><p>Гуляет сам по себе.<br>Можно погладить или перетащить.</p><div class="awards-cat__actions"><button type="button" data-cat-action="pet">Погладить</button><button type="button" data-cat-action="play">Мячик</button></div><button type="button" class="awards-cat__hide">Спрятать кота</button></section>
    <span class="awards-cat__bubble" role="status" hidden></span><span class="awards-cat__ball" hidden></span>`;
  document.body.append(root);
  const pet = root.querySelector('.awards-cat__pet');
  const panel = root.querySelector('.awards-cat__panel');
  const bubble = root.querySelector('.awards-cat__bubble');
  const ball = root.querySelector('.awards-cat__ball');
  const ctx = root.querySelector('canvas').getContext('2d');
  if (!ctx) { root.remove(); return; }
  const setting = document.createElement('button');
  setting.type = 'button'; setting.className = 'awards-cat-setting';
  (document.querySelector('.footer') || document.body).append(setting);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const small = matchMedia('(max-width: 600px)');
  let hidden = readHidden(), ready = false, blocked = false, menu = false, hovered = false;
  let x = 20, direction = 1, state = 'walk', stateTime = 0, elapsed = 0, last = 0, raf = 0, lastDraw = -1;
  let drag = null, lift = 0, target = null, bubbleTimer = 0, suppressClick = false;
  let bounds = 200, panelWidth = 264;
  const calm = () => reduced.matches || document.documentElement.classList.contains('motion-paused');
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  function metrics() {
    // Reserve the bottom-right corner for the site's animation control.
    const width = small.matches ? 84 : 96;
    bounds = Math.max(12, innerWidth - width - (innerWidth < 360 ? 100 : 154));
    panelWidth = Math.min(264, innerWidth - 24);
    x = clamp(x, 12, bounds);
    if (target !== null) target = clamp(target, 12, bounds);
    position();
  }
  function position() {
    pet.style.transform = `translate3d(${x.toFixed(1)}px,${(-lift).toFixed(1)}px,0)`;
    panel.style.left = `${clamp(x - 20, 12, innerWidth - panelWidth - 12)}px`;
    panel.style.width = `${panelWidth}px`;
    bubble.style.left = `${clamp(x - 10, 12, Math.max(12, innerWidth - 180))}px`;
    if (target !== null) ball.style.transform = `translateX(${target + (small.matches ? 42 : 48)}px)`;
  }
  function say(text, ms = 2000) {
    clearTimeout(bubbleTimer); bubble.textContent = text; bubble.hidden = false;
    bubbleTimer = setTimeout(() => { bubble.hidden = true; }, ms);
  }
  function closeMenu(focus = false) {
    menu = false; panel.hidden = true; pet.setAttribute('aria-expanded','false');
    if (focus && !root.hidden) pet.focus({preventScroll:true});
    kick();
  }
  function openMenu() {
    menu = true; state = 'sit'; stateTime = 0; target = null; ball.hidden = true;
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
  root.querySelector('[data-cat-action="play"]').addEventListener('click', () => {
    closeMenu(true);
    if (calm()) { state = 'happy'; say('Мячик пойман!'); draw(0); return; }
    target = x > (bounds + 12)/2 ? 12 : bounds;
    state = 'chase'; stateTime = 0; ball.hidden = false; position(); kick();
  });
  pet.addEventListener('click', event => {
    if (suppressClick && event.detail !== 0) { suppressClick = false; return; }
    menu ? closeMenu() : openMenu();
  });
  pet.addEventListener('pointerenter', () => { hovered = true; });
  pet.addEventListener('pointerleave', () => { hovered = false; });
  pet.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    suppressClick = false;
    drag = { id:event.pointerId, start:event.clientX, startY:event.clientY, x, moved:false };
    pet.setPointerCapture(event.pointerId);
  });
  pet.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX-drag.start, dy = event.clientY-drag.startY;
    if (Math.hypot(dx,dy) > 7) drag.moved = true;
    if (!drag.moved) return;
    if (menu) closeMenu();
    target = null; ball.hidden = true;
    direction = dx < 0 ? -1 : 1;
    x = clamp(drag.x + dx,12,bounds);
    lift = clamp(-dy,0,Math.max(0,innerHeight-180));
    position(); draw(0);
  });
  function release(event) {
    if (!drag || event.pointerId !== drag.id) return;
    suppressClick = drag.moved;
    if (pet.hasPointerCapture(event.pointerId)) pet.releasePointerCapture(event.pointerId);
    drag = null; state = 'sit'; stateTime = 0;
    if (calm()) lift = 0;
    kick();
  }
  pet.addEventListener('pointerup',release); pet.addEventListener('pointercancel',release);
  document.addEventListener('pointerdown', event => { if (menu && !root.contains(event.target)) closeMenu(); },{passive:true});
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); closeMenu(true); }
    if (event.target === pet && ['ArrowLeft','ArrowRight'].includes(event.key)) {
      event.preventDefault(); direction = event.key === 'ArrowLeft' ? -1 : 1;
      x = clamp(x + direction*24,12,bounds); position(); draw(0);
    }
  });
  // Pixel drawing at native 48×36. Each component is authored here, not copied from another widget.
  const colors = { outline:'#695139', fur:'#dbc18c', light:'#f4dfad', shade:'#b6925b', dark:'#282820', nose:'#986450' };
  function rect(x,y,w,h,color) { ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h); }
  function oval(cx,cy,rx,ry,color) {
    ctx.fillStyle=color;
    for(let y=Math.floor(cy-ry);y<=cy+ry;y++) {
      const n=1-((y-cy)/ry)**2;
      if(n<0)continue;
      const half=Math.floor(rx*Math.sqrt(n)); ctx.fillRect(Math.round(cx)-half,y,half*2+1,1);
    }
  }
  function heart(x,y) {
    const rows=['0110110','1111111','1111111','0111110','0011100','0001000'];
    rows.forEach((row,j)=>[...row].forEach((p,i)=>{if(p==='1')rect(x+i,y+j,1,1,colors.light);}));
  }
  function draw(frame) {
    ctx.clearRect(0,0,48,36);
    const sleeping=state==='sleep', happy=state==='happy', held=drag?.moved;
    const walking=(state==='walk'||state==='chase')&&!menu&&!hovered&&!calm()&&!drag;
    const step=walking ? [0,1,0,-1][frame%4] : 0;
    ctx.save(); if(direction<0){ctx.translate(48,0);ctx.scale(-1,1);}
    // Soft ground shadow and upright curled tail.
    if(!held) oval(25,34,17,1,'#0007');
    const tail=walking ? Math.floor(frame/2)%2 : Math.floor(elapsed*1.5)%2;
    if(!sleeping) {
      rect(5,15+tail,3,10,colors.outline);rect(4,12+tail,3,6,colors.outline);rect(6,10+tail,5,3,colors.outline);
      rect(6,14+tail,2,9,colors.fur);rect(5,12+tail,2,5,colors.light);rect(7,11+tail,3,2,colors.light);
    }
    oval(22,25,sleeping?15:13,sleeping?7:8,colors.outline);
    oval(22,24,sleeping?14:12,sleeping?6:7,colors.fur);
    oval(19,23,7,5,colors.light);
    rect(16,19,2,4,colors.shade);rect(21,18,2,4,colors.shade);rect(26,19,2,3,colors.shade);
    if(!sleeping){
      rect(14-step,28,4,5+(held?1:0),colors.shade);rect(25+step,28,4,5+(held?1:0),colors.shade);
      rect(11+step,28,4,5,colors.fur);rect(29-step,28,4,5,colors.fur);
      rect(10+step,32,5,2,colors.light);rect(29-step,32,5,2,colors.light);
    }
    const hy=sleeping?25:17+(walking&&step===1?1:0);
    // Ears with warm inner pixels, cheek tufts, muzzle.
    if(!sleeping){
      rect(26,hy-10,3,7,colors.outline);rect(27,hy-9,3,6,colors.fur);rect(28,hy-7,2,4,colors.nose);
      rect(37,hy-10,3,7,colors.outline);rect(36,hy-9,3,6,colors.fur);rect(36,hy-7,2,4,colors.nose);
    }
    oval(33,hy,9,sleeping?5:8,colors.outline);oval(33,hy-1,8,sleeping?4:7,colors.fur);
    rect(24,hy+1,3,2,colors.fur);rect(40,hy+1,2,2,colors.light);
    oval(34,hy+3,5,2,colors.light);
    if(!sleeping){rect(31,hy-7,2,3,colors.shade);rect(35,hy-7,2,3,colors.shade);}
    const blink=sleeping||happy||Math.floor(elapsed*10)%53>=50;
    if(blink){rect(28,hy,3,1,colors.dark);rect(36,hy,3,1,colors.dark);}
    else {rect(28,hy-2,2,3,colors.dark);rect(37,hy-2,2,3,colors.dark);rect(28,hy-2,1,1,colors.light);rect(37,hy-2,1,1,colors.light);}
    rect(33,hy+1,2,1,colors.nose);rect(33,hy+2,1,1,colors.nose);
    // Black-tie detail for an awards-night guest.
    if(!sleeping){rect(29,hy+7,3,3,colors.dark);rect(34,hy+7,3,3,colors.dark);rect(32,hy+8,2,1,colors.outline);}
    if(sleeping){oval(15,29,8,3,colors.shade);oval(17,28,6,2,colors.fur);rect(37,8,5,1,colors.fur);rect(40,9,1,1,colors.fur);rect(39,10,1,1,colors.fur);rect(37,11,5,1,colors.fur);}
    ctx.restore();
    if(happy) heart(20,calm()?2:2+Math.floor(elapsed*3)%2);
  }
  function tick(now) {
    raf=0;
    if(root.hidden||document.hidden) {last=0;return;}
    const dt=last?Math.min((now-last)/1000,.04):0; last=now;
    if(calm()) {lift=0;position();draw(0);last=0;return;}
    elapsed+=dt;
    if(!drag){lift=Math.max(0,lift-dt*480);}
    if(!menu&&!drag&&!hovered&&lift===0){
      stateTime+=dt;
      if(state==='chase'&&target!==null){
        direction=target>x?1:-1;const dist=target-x;
        x+=Math.sign(dist)*Math.min(Math.abs(dist),dt*110);
        if(Math.abs(dist)<2){target=null;ball.hidden=true;state='happy';stateTime=0;say('Поймал!',1300);}
      }else if(state==='walk'){
        x+=direction*dt*22;
        if(x>=bounds||x<=12){x=clamp(x,12,bounds);direction*=-1;state='sit';stateTime=0;}
        if(stateTime>7){state='sit';stateTime=0;}
      }else if(state==='happy'&&stateTime>2.3){state='sit';stateTime=0;}
      else if(state==='sit'&&stateTime>3){state=Math.random()<.35?'sleep':'walk';stateTime=0;}
      else if(state==='sleep'&&stateTime>9){state='walk';stateTime=0;}
    }
    position();
    const frame=Math.floor(elapsed*(state==='chase'?12:7));
    if(frame!==lastDraw){draw(frame);lastDraw=frame;}
    raf=requestAnimationFrame(tick);
  }
  function kick(){ if(!raf&&!root.hidden&&!document.hidden){last=0;raf=requestAnimationFrame(tick);} }
  function sync(){
    const consent=document.getElementById('analytics-consent');
    blocked=!!document.querySelector('dialog[open]') || !!(consent&&!consent.hidden) || !!document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
    root.hidden=hidden||blocked||!ready;
    if(root.hidden){if(raf)cancelAnimationFrame(raf);raf=0;last=0;drag=null;lift=0;closeMenu();}
    else {position();draw(0);kick();}
  }
  // Observe only UI state, not animated inline styles (avoids work on every frame).
  const observer=new MutationObserver(sync);
  document.querySelectorAll('dialog,#analytics-consent').forEach(el=>observer.observe(el,{attributes:true,attributeFilter:['open','hidden']}));
  new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  document.addEventListener('focusin',sync);document.addEventListener('focusout',()=>queueMicrotask(sync));
  document.addEventListener('visibilitychange',()=>{ if(document.hidden){cancelAnimationFrame(raf);raf=0;last=0;}else sync(); });
  window.addEventListener('resize',metrics,{passive:true});
  reduced.addEventListener('change',sync);
  metrics();draw(0);
  setTimeout(()=>{ready=true;sync();},4500);
})();
