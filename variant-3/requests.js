(() => {
  'use strict';
  const config = window.PREMIER_CONFIG || {};
  const forms = [...document.querySelectorAll('form[data-request-type]')];
  const localEndpoint = location.hostname === '127.0.0.1' && (config.endpoint || '').startsWith(location.origin + '/');
  const enabled = (location.protocol === 'https:' || localEndpoint) && config.enabled === true && (/^https:\/\//.test(config.endpoint || '') || localEndpoint);
  function requestUUID() {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
  }
  function showFailure(message, error) {
    const network = error.name === 'AbortError' || error instanceof TypeError || error instanceof SyntaxError;
    const code = error.name === 'AbortError' ? 'TIMEOUT' : network ? 'CONNECTION' : error.status ? 'HTTP-'+error.status : 'FORM';
    message.dataset.error = 'true'; message.replaceChildren();
    const text = document.createElement('span');
    text.textContent = network
      ? 'Не удалось связаться с сервером. Получение заявки пока не подтверждено. Данные остались в форме: не закрывайте страницу и повторите отправку.'
      : (error.status ? error.message : 'Не удалось отправить заявку. Данные остались в форме. Попробуйте ещё раз.');
    const help = document.createElement('span'); help.style.display='block'; help.style.marginTop='8px';
    help.append('Если ошибка повторяется, позвоните организаторам: ');
    const phone = document.createElement('a'); phone.href='tel:+79038096808'; phone.textContent='+7 (903) 809-68-08'; help.append(phone);
    const details = document.createElement('small'); details.style.display='block'; details.textContent='Код ошибки: '+code;
    message.append(text, help, details); message.tabIndex=-1; message.focus({preventScroll:true});
  }
  forms.forEach(form => {
    const fields = form.querySelector('.request-fields');
    const message = form.querySelector('.form-message');
    const availability = form.closest('dialog').querySelector('[data-form-availability]');
    fields.disabled = false;
    form.querySelector('[type=submit]').disabled = !enabled;
    if(enabled) {availability.textContent = '';availability.hidden = true;} else {availability.hidden = false;availability.textContent = 'Для отправки откройте защищённую версию сайта: https://tver-awards.ru';}
    let pending = false, requestId = null, lastPayload = null;
    const dialog=form.closest('dialog');
    document.addEventListener('premier:form-open',event=>{
      if(event.detail.dialog!==dialog||!form.classList.contains('request-complete'))return;
      form.classList.remove('request-complete');fields.hidden=false;dialog.querySelector('.dialog-footnote').hidden=false;message.replaceChildren();message.classList.remove('confirmation');dialog.querySelector('.request-dialog-body>p').hidden=false;
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (!enabled || pending) return;
      let controller, timeout;
      try {
        if (!window.PremierForms || !window.PremierForms.validate(form)) {
          if (!window.PremierForms) throw new Error('Validation unavailable');
          return;
        }
        const data = Object.fromEntries(new FormData(form));
        data.phone = '+' + data.phone.replace(/\D/g, '');
        data.type = form.dataset.requestType;
        data.consentVersion = config.consentVersion;
        if(data.seasonUpdates === 'yes') data.updatesConsentVersion = config.updatesConsentVersion;
        const fingerprint = JSON.stringify(data);
        if(lastPayload !== fingerprint || !requestId) requestId = requestUUID();
        lastPayload = fingerprint;
        data.requestId = requestId;
        pending = true;
        fields.disabled = true;
        message.dataset.error = 'false';
        message.textContent = 'Отправляем заявку…';
        controller = new AbortController();
        timeout = setTimeout(() => controller.abort(), 20000);
        const response = await fetch(config.endpoint, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data), credentials:'omit', signal:controller.signal, referrerPolicy:'no-referrer'});
        const result = await response.json();
        if(!response.ok || result.ok !== true || !result.receipt) throw Object.assign(new Error(result.error || 'Не удалось подтвердить получение заявки. Попробуйте ещё раз.'), {status:response.status});
        message.replaceChildren();message.classList.add('confirmation');message.tabIndex=-1;
        const title=document.createElement('strong');title.className='confirmation-title';title.textContent='Ваша заявка принята';
        const receipt=document.createElement('span');receipt.className='confirmation-receipt';receipt.textContent='Заявка № '+result.receipt;
        const next=document.createElement('span');next.textContent='Мы свяжемся с вами по указанному телефону и подтвердим заявку в течение трёх дней. Заявок много, поэтому ответ может прийти не сразу. Мы стараемся ответить каждому.';
        const help=document.createElement('span');help.append('Если в течение трёх дней с вами не связались, обязательно позвоните нам: ');
        const phone=document.createElement('a');phone.href='tel:+79038096808';phone.textContent='+7 (903) 809-68-08';help.append(phone);
        message.append(title,receipt,next,help);
        const note=document.createElement('span');note.className='confirmation-note';note.textContent=form.dataset.requestType==='guest'?'После связи с организатором вы получите ссылку на оплату. Заявка пока не является оплатой или бронью билета.':'Это подтверждение получения заявки. Решение о включении в число номинантов принимает экспертное жюри.';message.append(note);
        fields.hidden=true;dialog.querySelector('.dialog-footnote').hidden=true;form.classList.add('request-complete');dialog.querySelector('.request-dialog-body>p').hidden=true;
        dialog.querySelector('.request-dialog-body').scrollTop=0;message.focus({preventScroll:true});
        document.dispatchEvent(new CustomEvent('premier:form-success',{detail:{type:form.dataset.requestType}}));
        form.reset(); requestId = null; lastPayload = null;
        if(form.dataset.requestType === 'nominee') document.querySelector('#character-count').textContent = '0';
      } catch(error) {
        showFailure(message, error);
      } finally {clearTimeout(timeout); pending = false; fields.disabled = false;}
    });
  });
})();
