/* +7 formatting, cursor preservation and accessible inline validation. */
(()=>{
 const forms=[...document.querySelectorAll('form[data-request-type]')];
 function national(raw){let digits=raw.replace(/\D/g,'');if(raw.trim().startsWith('+7')||(digits.length>=11&&/^[78]/.test(digits)))digits=digits.slice(1);return digits.slice(0,10)}
 function format(raw){const n=national(raw);let v='+7';if(n.length)v+=' ('+n.slice(0,3);if(n.length>=3)v+=')';if(n.length>3)v+=' '+n.slice(3,6);if(n.length>6)v+='-'+n.slice(6,8);if(n.length>8)v+='-'+n.slice(8,10);return v}
 function phoneMask(input){
  input.value=format(input.value);input.defaultValue='+7';
  function apply(raw,caret){
   const prefix=raw.slice(0,caret),count=national(prefix).length;
   input.value=format(raw);
   let position=input.value.length,seen=0;
   if(caret<raw.length){position=2;for(let i=2;i<input.value.length;i++){if(/\d/.test(input.value[i]))seen++;if(seen===count){position=i+1;break}}}
   input.setSelectionRange(Math.max(2,position),Math.max(2,position));
  }
  input.addEventListener('input',()=>apply(input.value,input.selectionStart??input.value.length));
  input.addEventListener('focus',()=>{if(!input.value)input.value='+7'});
  input.addEventListener('beforeinput',event=>{
   if(!event.inputType.startsWith('delete')||input.selectionStart!==input.selectionEnd)return;
   const caret=input.selectionStart;
   if(event.inputType==='deleteContentBackward'){
    let at=caret-1;while(at>1&&!/\d/.test(input.value[at]))at--;
    if(at<=1){event.preventDefault();return}input.setSelectionRange(at,caret);
   }else if(event.inputType==='deleteContentForward'){
    let at=caret;while(at<input.value.length&&!/\d/.test(input.value[at]))at++;
    if(caret<2){event.preventDefault();return}input.setSelectionRange(caret,Math.min(at+1,input.value.length));
   }
  });
  input.addEventListener('paste',event=>{
   const pasted=event.clipboardData?.getData('text');if(!pasted)return;
   event.preventDefault();
   // Complete telephone numbers replace the field; partial fragments edit at the caret.
   const full=pasted.replace(/\D/g,'').length>=10;
   const start=input.selectionStart??input.value.length,end=input.selectionEnd??start;
   const raw=full?pasted:input.value.slice(0,start)+pasted+input.value.slice(end);
   apply(raw,full?raw.length:start+pasted.length);input.dispatchEvent(new Event('input',{bubbles:true}));
  });
 }
 function errorFor(field){
  if(field.type==='checkbox')return field.required&&!field.checked?'Подтвердите согласие на обработку данных.':'';
  const value=field.value.trim();
  if(field.name==='phone')return national(value).length===10?'':'Введите номер полностью: +7 (999) 123-45-67.';
  if(field.required&&!value)return field.tagName==='SELECT'?'Выберите вариант.':'Заполните это поле.';
  if(!value)return '';
  if(field.minLength>0&&value.length<field.minLength)return field.name==='achievements'?'Расскажите о достижениях подробнее, минимум 30 символов.':`Введите не менее ${field.minLength} символов.`;
  return field.validity.valid?'':'Проверьте заполнение поля.';
 }
 const controls=new WeakMap();
 forms.forEach(form=>{
  form.noValidate=true;
  const inputs=[...form.querySelectorAll('input,textarea,select')].filter(el=>el.name&&el.name!=='website'&&el.type!=='hidden');
  controls.set(form,inputs);
  inputs.forEach((field,index)=>{
   if(field.name==='phone')phoneMask(field);
   const label=field.closest('label'),error=document.createElement('span');error.className='field-error';error.id=`${form.id}-error-${index}`;error.hidden=true;error.setAttribute('aria-live','polite');
   label.append(error);field.setAttribute('aria-describedby',[field.getAttribute('aria-describedby'),error.id].filter(Boolean).join(' '));
   const show=()=>{
    field.setCustomValidity('');const message=errorFor(field);field.setCustomValidity(message);
    error.textContent=message;error.hidden=!message;label.classList.toggle('field-invalid',Boolean(message));field.setAttribute('aria-invalid',String(Boolean(message)));return !message;
   };
   field.addEventListener('blur',()=>{field.dataset.touched='true';show()});
   const changed=()=>{field.setCustomValidity('');if(field.dataset.touched==='true')show()};
   field.addEventListener('input',changed);field.addEventListener('change',changed);field._premierValidate=show;
  });
  form.addEventListener('reset',()=>inputs.forEach(field=>{field.setCustomValidity('');field.removeAttribute('aria-invalid');delete field.dataset.touched;const label=field.closest('label');label.classList.remove('field-invalid');const error=label.querySelector('.field-error');error.hidden=true;error.textContent=''}));
 });
 window.PremierForms={
  validate(form){
   let first=null;(controls.get(form)||[]).forEach(field=>{field.dataset.touched='true';if(!field._premierValidate()&&!first)first=field});
   if(first){first.focus();first.scrollIntoView({block:'center',behavior:'auto'});return false}return true;
  }
 };
})();
