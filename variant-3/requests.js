(()=>{'use strict';
 document.querySelectorAll('form[data-request-type]').forEach(form=>{
  const dialog=form.closest('dialog');
  form.hidden=true;
  form.querySelectorAll('input,select,textarea,button').forEach(el=>el.disabled=true);
  form.addEventListener('submit',event=>event.preventDefault());
  const note=dialog.querySelector('[data-form-availability]');
  note.hidden=false;note.replaceChildren();
  const text=document.createElement('p');text.textContent='Онлайн-форма временно недоступна. По вопросам номинаций и билетов свяжитесь с организатором:';
  const link=document.createElement('a');link.href='tel:+79038096808';link.className='button';link.textContent='+7 (903) 809-68-08';
  note.append(text,link);
  const foot=dialog.querySelector('.dialog-footnote');if(foot)foot.hidden=true;
 });
})();
