const MTH_BASE='/hunt';
const MTH_PROGRAMS=[
  {id:'kotor',city:'Kotor',title:'Pečat izgubljenog glasnika',duration:'60–90 min',distance:'0,7 km',level:'Lako–srednje',tag:'Pomorska misterija',mark:'⚜'},
  {id:'ulcinj',city:'Ulcinj',title:'Knjiga posljednjeg korsara',duration:'70–100 min',distance:'0,6 km',level:'Srednje',tag:'Korsarska ruta',mark:'☠'},
  {id:'bar',city:'Bar',title:'Zavjet pod starom maslinom',duration:'100–140 min',distance:'2,5 km',level:'Srednje',tag:'Voda i maslina',mark:'❦'},
  {id:'cetinje',city:'Cetinje',title:'Telegram koji nije stigao',duration:'75–105 min',distance:'1,0 km',level:'Srednje',tag:'Diplomatska istraga',mark:'✦'},
  {id:'herceg',city:'Herceg Novi',title:'Mapa sedam gospodara',duration:'75–105 min',distance:'0,9 km',level:'Srednje–teško',tag:'Grad stepenica',mark:'⚔'},
  {id:'podgorica',city:'Podgorica',title:'Grad ispod grada',duration:'75–105 min',distance:'1,4 km',level:'Srednje',tag:'Arhiva Stare Varoši',mark:'⌁'}
];
const mthEscape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const mthImage=id=>`${MTH_BASE}/assets/cities/${id}.svg`;
let mthHealth=null;
let mthHealthError='';
let mthBusy=false;

async function mthRequest(path,options={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),15000);
  try{
    const response=await fetch(`${MTH_BASE}${path}`,{cache:'no-store',credentials:'same-origin',signal:controller.signal,...options});
    const raw=await response.text();
    let data={};
    try{data=raw?JSON.parse(raw):{}}catch{}
    if(!response.ok){
      const details=Array.isArray(data.details)&&data.details.length?` (${data.details.join(', ')})`:'';
      throw new Error(`${data.error||`Server je vratio grešku ${response.status}.`}${details}`);
    }
    return data;
  }catch(error){
    if(error?.name==='AbortError')throw new Error('Server se nije javio. Pokušajte ponovo za nekoliko sekundi.');
    if(error instanceof TypeError)throw new Error('Nije moguće povezati se sa serverom. Osvježite stranicu i pokušajte ponovo.');
    throw error;
  }finally{clearTimeout(timer)}
}

function mthProgramsMarkup(){
  return MTH_PROGRAMS.map(program=>`<article class="mth-program-card" style="--mth-image:url('${mthImage(program.id)}')"><div class="mth-program-media"></div><div class="mth-program-content"><div class="mth-program-top"><span class="mth-program-mark">${mthEscape(program.mark)}</span><span class="mth-program-tag">${mthEscape(program.tag)}</span></div><div><h3>${mthEscape(program.city)}</h3><p>${mthEscape(program.title)}</p><div class="mth-program-meta"><span>⏱ ${mthEscape(program.duration)}</span><span>↔ ${mthEscape(program.distance)}</span><span>◆ ${mthEscape(program.level)}</span></div></div></div></article>`).join('');
}

function mthStatusMarkup(){
  const ready=Boolean(mthHealth?.ok&&mthHealth?.configured);
  const message=ready?'Sistem je spreman za aktivaciju.':mthHealthError||'Server još nije odgovorio. Pokušajte ponovo.';
  return `<div class="mth-system-status ${ready?'ok':'bad'}"><span>${ready?'●':'!'}</span><div><b>${ready?'Sistem online':'Provjera servera'}</b><small>${mthEscape(message)}</small></div></div>`;
}

function mthAddTestBox(form){
  if(!mthHealth?.devMode||form.querySelector('.mth-test-box'))return;
  const error=form.querySelector('#voucher-error');
  error?.insertAdjacentHTML('afterend','<div class="mth-test-box"><div><small>Test pristup svim programima</small><b>MTH-TEST-ALL</b></div><button type="button" data-mth-test>Pokreni test</button></div>');
}

function mthRefreshStatus(){
  const form=document.querySelector('#voucher-form');
  if(!form)return;
  const current=form.querySelector('.mth-system-status');
  if(current)current.outerHTML=mthStatusMarkup();
  mthAddTestBox(form);
}

function mthEnhanceLanding(){
  const landing=document.querySelector('.landing-screen');
  if(!landing||landing.dataset.mthEnhanced==='1')return;
  landing.dataset.mthEnhanced='1';
  const hero=landing.querySelector('.landing-hero');
  const body=landing.querySelector('.landing-body');
  const heroInner=landing.querySelector('.landing-hero-inner');
  if(heroInner&&!heroInner.querySelector('.mth-hero-actions')){
    heroInner.insertAdjacentHTML('beforeend','<div class="mth-hero-actions"><a href="#mth-programi">Pogledaj programe</a><a href="#voucher-form">Imam vaučer</a></div>');
  }
  if(hero&&body&&!landing.querySelector('.mth-preview')){
    hero.insertAdjacentHTML('afterend',`<section class="mth-preview" id="mth-programi"><header class="mth-preview-head"><div><div class="eyebrow">Pregled svih programa</div><h2>Šest gradova. Šest potpuno različitih priča.</h2></div><p>Prije aktivacije pregledajte trajanje, distancu i težinu svake avanture. Vaučer zatim otključava programe koji pripadaju vašem paketu.</p></header><div class="mth-program-grid">${mthProgramsMarkup()}</div></section>`);
  }
  const form=landing.querySelector('#voucher-form');
  if(!form)return;
  const firstField=form.querySelector('.field');
  if(!form.querySelector('.mth-system-status')&&firstField)firstField.insertAdjacentHTML('beforebegin',mthStatusMarkup());
  mthAddTestBox(form);
}

async function mthRedeem(form){
  if(mthBusy)return;
  const input=form.querySelector('#voucher');
  const error=form.querySelector('#voucher-error');
  const button=form.querySelector('button[type="submit"]');
  const code=String(input?.value||'').trim().toUpperCase().replace(/\s+/g,'');
  if(!code){if(error)error.textContent='Unesite vaučer kod.';input?.focus();return}
  mthBusy=true;
  const original=button?.textContent||'Otključaj avanturu';
  if(input)input.value=code;
  if(error)error.textContent='';
  if(button){button.disabled=true;button.textContent='Provjera koda...'}
  try{
    const data=await mthRequest('/api/player/redeem',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code})});
    if(!data?.token)throw new Error('Server nije vratio pristupni token.');
    localStorage.setItem('mth_access',data.token);
    location.assign(`${MTH_BASE}/?access=${encodeURIComponent(data.token)}&refresh=1`);
  }catch(err){
    if(error)error.textContent=err.message;
    form.scrollIntoView({behavior:'smooth',block:'center'});
  }finally{
    mthBusy=false;
    if(button){button.disabled=false;button.textContent=original}
  }
}

document.addEventListener('submit',event=>{
  const form=event.target.closest?.('#voucher-form');
  if(!form)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  mthRedeem(form);
},true);

document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-mth-test]');
  if(!button)return;
  const input=document.querySelector('#voucher');
  if(input)input.value='MTH-TEST-ALL';
  document.querySelector('#voucher-form')?.requestSubmit();
});

const mthObserver=new MutationObserver(()=>mthEnhanceLanding());
mthObserver.observe(document.documentElement,{childList:true,subtree:true});
mthEnhanceLanding();

(async()=>{
  try{mthHealth=await mthRequest('/api/health')}catch(error){mthHealthError=error.message}
  mthRefreshStatus();
  mthEnhanceLanding();
  if('serviceWorker' in navigator){navigator.serviceWorker.getRegistration(`${MTH_BASE}/`).then(reg=>reg?.update()).catch(()=>{})}
})();
