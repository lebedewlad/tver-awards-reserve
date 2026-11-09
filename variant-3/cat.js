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
  let spriteLoaded = false;
  let hidden = readHidden(), ready = false, blocked = false, menu = false, hovered = false;
  let x = 20, direction = 1, state = 'walk', stateTime = 0, elapsed = 0, last = 0, raf = 0, lastDraw = -1;
  let drag = null, lift = 0, target = null, bubbleTimer = 0, suppressClick = false;
  let bounds = 200, panelWidth = 264;
  const calm = () => reduced.matches || document.documentElement.classList.contains('motion-paused');
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  function metrics() {
    // Reserve the bottom-right corner for the site's animation control.
    const width = small.matches ? 112 : 128;
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
    if (target !== null) ball.style.transform = `translateX(${target + (small.matches ? 56 : 64)}px)`;
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
    const moving=(state==='walk'||state==='chase')&&!menu&&!hovered&&!calm()&&!drag;
    const held=!!drag?.moved;
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
    const frame=Math.floor(elapsed*24);
    if(frame!==lastDraw){draw(frame);lastDraw=frame;}
    raf=requestAnimationFrame(tick);
  }
  function kick(){ if(!raf&&!root.hidden&&!document.hidden){last=0;raf=requestAnimationFrame(tick);} }
  function sync(){
    const consent=document.getElementById('analytics-consent');
    blocked=!!document.querySelector('dialog[open]') || !!(consent&&!consent.hidden) || !!document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
    root.hidden=hidden||blocked||!ready||!spriteLoaded;
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
