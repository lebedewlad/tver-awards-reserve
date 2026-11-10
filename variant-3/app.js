const nominations=[
 [
  "photographer",
  "Фотограф года",
  "Люди и истории в вашем объективе",
  "Для фотографов, которые снимают людей, события и жизнь города. Расскажите о своём подходе и проектах, приложите портфолио или страницу с работами."
 ],
 [
  "blogger",
  "Блогер года",
  "Контент, который объединяет",
  "Для авторов блогов и каналов, которые создают собственный контент и общаются с аудиторией. Расскажите, о чём ваш блог, чем он полезен подписчикам и какими публикациями вы гордитесь."
 ],
 [
  "body_architect",
  "Архитектор тела",
  "Движение, сила и работа над собой",
  "Для тренеров и специалистов в сфере фитнеса, которые помогают людям развивать силу, выносливость и физическую форму. Расскажите о своих программах, подходе и результатах работы."
 ],
 [
  "psychologist",
  "Психолог года",
  "Поддержка и профессиональный подход",
  "Для психологов, которые помогают людям лучше понимать себя и справляться с жизненными трудностями. Расскажите об образовании, направлениях работы и профессиональных проектах. Не указывайте личные данные клиентов."
 ],
 [
  "style_artist",
  "Художник вашего стиля",
  "Образ, в котором видна личность",
  "Для стилистов, визажистов, парикмахеров и мастеров красоты, которые создают индивидуальные образы. Покажите свои работы и расскажите, как помогаете людям находить и выражать свой стиль."
 ],
 [
  "dj",
  "Диджей года",
  "Музыка, которая задаёт настроение",
  "Для диджеев, которые создают атмосферу на танцполе и событиях города. Расскажите о выступлениях и музыкальном почерке, добавьте ссылки на сеты или записи."
 ],
 [
  "creative_project",
  "Творческий проект года",
  "Культурные проекты, которые меняют город",
  "Для авторов и команд, которые создают культурные и междисциплинарные проекты для города — от паблик-арта и фестивалей до театральных перформансов на необычных площадках. Расскажите о своём проекте, его влиянии на город и вовлечении жителей, поделитесь фото, видео или ссылкой на страницу проекта."
 ],
 [
  "children_projects",
  "Проекты для детей",
  "Студии, кружки и занятия для детей",
  "Для педагогов и наставников, которые ведут творческие студии и кружки для детей — от ИЗО и музыки до театра и робототехники. Расскажите о своих занятиях и воспитанниках, поделитесь фото с занятий, видео или страницей студии с примерами работ."
 ],
 [
  "doctor",
  "Врач года",
  "Знания, забота и доверие",
  "Для врачей, которые помогают людям сохранять и восстанавливать здоровье. Расскажите о специальности, опыте и профессиональных достижениях. Не указывайте личные данные пациентов и сведения об их здоровье."
 ],
 [
  "event_organizer",
  "Организатор событий",
  "Идеи, которые становятся событиями",
  "Для организаторов праздников, деловых, культурных и городских мероприятий. Расскажите о реализованных событиях, своей роли в них и подходе к организации, добавьте примеры проектов."
 ],
 [
  "comedian",
  "Шоумен года",
  "Комики и ведущие, которые зажигают зал",
  "Для комиков и ведущих, которые умеют увлечь публику, создать настроение и сделать событие запоминающимся. Расскажите о своих выступлениях и мероприятиях, поделитесь видео или страницей с примерами работ."
 ]
];
const select=document.querySelector('#nomination');
const list=document.querySelector('#nomination-list');
nominations.forEach(([id,name])=>{
 select.add(new Option(name,id));
 const button=list.querySelector(`[data-nomination="${id}"]`);
 button.addEventListener('click',()=>{select.value=id;window.openPremierApplication('nominee',button);});
});
const nomineeDialog=document.getElementById('nominee-dialog');
const nomineeForm=document.getElementById('application-form');
const nominationPreview=document.getElementById('nomination-preview');
function describeNomination(){
 const item=nominations.find(row=>row[0]===select.value);
 document.getElementById('nominee-dialog-title').textContent=item?item[1]:'Выберите свою номинацию';
 document.getElementById('nominee-dialog-desc').textContent=item?item[3]:'Одиннадцать направлений для людей и проектов Твери. Выберите подходящее в форме и расскажите о своём деле.';
}
window.PremierNominations={preview(){describeNomination();nominationPreview.hidden=false;nomineeForm.hidden=true;nomineeDialog.querySelector('.dialog-footnote').hidden=true;document.getElementById('nominee-dialog-desc').hidden=false;}};
select.addEventListener('change',describeNomination);
document.getElementById('nomination-continue').addEventListener('click',()=>{
 nominationPreview.hidden=true;nomineeForm.hidden=false;nomineeDialog.querySelector('.dialog-footnote').hidden=false;
 (select.value?nomineeForm.elements.lastName:select).focus({preventScroll:true});
 nomineeDialog.querySelector('.request-dialog-body').scrollTop=0;
});
const textarea=document.querySelector('textarea');textarea.addEventListener('input',()=>document.querySelector('#character-count').textContent=textarea.value.length.toLocaleString('ru-RU'));
const galleryPhotos=[
 ['6E6A4610','Гости премии у фотозоны'],
 ['6E6A4504','Гостья в серебристом наряде'],
 ['6E6A4534','Гости у красного занавеса'],
 ['6E6A4587','Гости рядом с афишей премии'],
 ['6E6A4620','Гости у фотозоны'],
 ['6E6A4670','Портрет гостьи премии'],
 ['6E6A4708','На память о Tver Awards']
,
 ['6E6A4676','Гостья в чёрном наряде у красного занавеса'],
 ['6E6A4711','Двое гостей: мужчина в чёрном и женщина в белом жакете'],
 ['6E6A4650','Двое гостей в вечерних нарядах у фотозоны']
];
const dialog=document.querySelector('#archive-dialog'),galleryImage=document.querySelector('#gallery-image'),galleryError=document.querySelector('#gallery-error');
let photoIndex=0,returnFocus=null;
function showPhoto(index){photoIndex=(index+galleryPhotos.length)%galleryPhotos.length;const [file,caption]=galleryPhotos[photoIndex];galleryError.hidden=true;galleryImage.hidden=false;galleryImage.alt=caption;galleryImage.src=`/photos/${file}.webp`;document.querySelector('#gallery-caption').textContent=`${photoIndex+1} / ${galleryPhotos.length} · ${caption}`;}
function openGallery(index,trigger){returnFocus=trigger;showPhoto(index);dialog.showModal();document.body.classList.add('gallery-open');}
document.querySelector('#archive-button').addEventListener('click',e=>openGallery(0,e.currentTarget));
document.querySelectorAll('.gallery-trigger').forEach(button=>button.addEventListener('click',()=>openGallery(Number(button.dataset.photo),button)));
document.querySelector('#gallery-prev').addEventListener('click',()=>showPhoto(photoIndex-1));
document.querySelector('#gallery-next').addEventListener('click',()=>showPhoto(photoIndex+1));
dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();showPhoto(photoIndex-1);}if(e.key==='ArrowRight'){e.preventDefault();showPhoto(photoIndex+1);}});
dialog.addEventListener('close',()=>{document.body.classList.remove('gallery-open');returnFocus?.focus({preventScroll:true});});
galleryImage.addEventListener('error',()=>{galleryImage.hidden=true;galleryError.hidden=false;});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
