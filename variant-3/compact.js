(()=>{
  const dialogs=[...document.querySelectorAll('.request-dialog')];
  let scrollPosition=0,returnTarget=null,savedStyles=null;
  const body=document.body,root=document.documentElement;
  window.openPremierApplication=(type,trigger=document.activeElement)=>{
    const dialog=document.getElementById(type==='guest'?'guest-dialog':'nominee-dialog');
    if(dialog.open||dialogs.some(item=>item.open))return;
    returnTarget=trigger;scrollPosition=window.scrollY;
    savedStyles={position:body.style.position,top:body.style.top,width:body.style.width,overflow:body.style.overflow};
    body.style.position='fixed';body.style.top=`-${scrollPosition}px`;body.style.width='100%';body.style.overflow='hidden';
    dialog.showModal();dialog.querySelector('.request-dialog-body').scrollTop=0;
    dialog.querySelector('.request-close').focus({preventScroll:true});
    document.dispatchEvent(new CustomEvent('premier:form-open',{detail:{dialog}}));
    if(type!=='guest')window.PremierNominations.preview();
  };
  function closeRequest(dialog){
    if(dialog.classList.contains('is-closing'))return;
    if(root.classList.contains('motion-paused')||matchMedia('(prefers-reduced-motion:reduce)').matches){dialog.close();return;}
    dialog.classList.add('is-closing');
    let finished=false,timer;
    const finish=()=>{if(finished)return;finished=true;clearTimeout(timer);dialog.removeEventListener('animationend',finish);dialog.classList.remove('is-closing');if(dialog.open)dialog.close();};
    dialog.addEventListener('animationend',finish,{once:true});
    timer=setTimeout(finish,190);
  }
  dialogs.forEach(dialog=>{
    dialog.addEventListener('cancel',e=>{e.preventDefault();closeRequest(dialog)});
    dialog.querySelector('.request-close').addEventListener('click',()=>closeRequest(dialog));
    let outsideStart=false;
    const outside=e=>{const r=dialog.getBoundingClientRect();return e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom};
    dialog.addEventListener('pointerdown',e=>outsideStart=e.target===dialog&&outside(e));
    dialog.addEventListener('pointerup',e=>{if(outsideStart&&e.target===dialog&&outside(e))closeRequest(dialog);outsideStart=false});
    dialog.addEventListener('close',()=>{
      if(!savedStyles)return;
      Object.assign(body.style,savedStyles);savedStyles=null;
      const behavior=root.style.scrollBehavior;root.style.scrollBehavior='auto';
      window.scrollTo(0,scrollPosition);returnTarget?.focus({preventScroll:true});root.style.scrollBehavior=behavior;
    });
  });
  const tabs=[...document.querySelectorAll('[data-plan]')],panel=document.getElementById('ticket-panel'),select=document.getElementById('ticket-plan');
  const standardIncludes=[...panel.querySelectorAll('.ticket-includes li')].map(item=>item.textContent);
  const plans={single:{title:'Для себя',amount:'4 990',quantity:'1 билет на церемонию'},pair:{title:'Вдвоём',amount:'8 490',quantity:'2 билета на церемонию'},vip:{title:'VIP',amount:'9 990',quantity:'1 VIP-билет на церемонию',includes:['Отдельный стол для VIP-гостей','Свой фуршет на столе','Фотозона и профессиональные фото','Активные зоны','Закрытый званый ужин 18 декабря только для VIP-гостей и партнёров']}};
  const planOrder=Object.keys(plans);
  let selected='single';
  function choose(plan,focus=false){
    if(!plans[plan])return;
    const changed=selected!==plan,previous=selected;
    selected=plan;select.value=plan;document.querySelector('.ticket-tabs').dataset.selected=plan;
    tabs.forEach(tab=>{const active=tab.dataset.plan===plan;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus()});
    panel.setAttribute('aria-labelledby',`ticket-tab-${plan}`);
    document.getElementById('ticket-title').textContent=plans[plan].title;
    document.getElementById('ticket-amount').textContent=plans[plan].amount;
    document.getElementById('ticket-quantity').textContent=plans[plan].quantity;
    const list=panel.querySelector('.ticket-includes');
    list.replaceChildren(...(plans[plan].includes||standardIncludes).map(text=>{const li=document.createElement('li');li.textContent=text;return li}));
    panel.dataset.plan=plan;
    if(changed)document.dispatchEvent(new CustomEvent('premier:ticket-change',{detail:{plan,previous,direction:Math.sign(planOrder.indexOf(plan)-planOrder.indexOf(previous))}}));
  }
  tabs.forEach(tab=>{
    tab.addEventListener('click',()=>choose(tab.dataset.plan));
    tab.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
      e.preventDefault();const index=planOrder.indexOf(selected);choose(e.key==='Home'?planOrder[0]:e.key==='End'?planOrder.at(-1):planOrder[(index+(e.key==='ArrowRight'?1:-1)+planOrder.length)%planOrder.length],true);
    });
  });
  select.addEventListener('change',()=>choose(select.value));
  document.getElementById('ticket-request').addEventListener('click',e=>window.openPremierApplication('guest',e.currentTarget));
  let start=null;
  panel.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'&&!e.target.closest('button,a,input,select'))start={x:e.clientX,y:e.clientY};});
  panel.addEventListener('pointerup',e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.5)choose(planOrder[Math.max(0,Math.min(planOrder.length-1,planOrder.indexOf(selected)+(dx<0?1:-1)))]);});
  panel.addEventListener('pointercancel',()=>start=null);
  document.querySelectorAll('a[href="#apply"],a[href="#guest"]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();window.openPremierApplication(link.hash==='#guest'?'guest':'nominee',link)}));
})();
