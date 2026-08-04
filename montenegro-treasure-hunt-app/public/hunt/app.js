const BASE_PATH='/hunt';
const app=document.querySelector('#app');
const toastEl=document.querySelector('#toast');
const state={
  token:new URLSearchParams(location.search).get('access')||localStorage.getItem('mth_access')||'',
  access:null,tours:[],tour:null,session:null,view:'landing',tab:'map',position:null,watchId:null,
  testStage:0,selectedAnswer:null,overlay:null,signalTimer:null,shownSignals:new Set(),loading:false,
  devMode:false,health:null,healthError:''
};

const tourImages={kotor:'kotor',ulcinj:'ulcinj',bar:'bar',cetinje:'cetinje',herceg:'herceg',podgorica:'podgorica'};
const previewPrograms=[
  {id:'kotor',city:'Kotor',title:'Pečat izgubljenog glasnika',duration:'60–90 min',distance:'0,7 km',level:'Lako–srednje',tag:'Pomorska misterija',mark:'⚜'},
  {id:'ulcinj',city:'Ulcinj',title:'Knjiga posljednjeg korsara',duration:'70–100 min',distance:'0,6 km',level:'Srednje',tag:'Korsarska ruta',mark:'☠'},
  {id:'bar',city:'Bar',title:'Zavjet pod starom maslinom',duration:'100–140 min',distance:'2,5 km',level:'Srednje',tag:'Voda i maslina',mark:'❦'},
  {id:'cetinje',city:'Cetinje',title:'Telegram koji nije stigao',duration:'75–105 min',distance:'1,0 km',level:'Srednje',tag:'Diplomatska istraga',mark:'✦'},
  {id:'herceg',city:'Herceg Novi',title:'Mapa sedam gospodara',duration:'75–105 min',distance:'0,9 km',level:'Srednje–teško',tag:'Grad stepenica',mark:'⚔'},
  {id:'podgorica',city:'Podgorica',title:'Grad ispod grada',duration:'75–105 min',distance:'1,4 km',level:'Srednje',tag:'Arhiva Stare Varoši',mark:'⌁'}
];
function tourImage(t){return `${BASE_PATH}/assets/cities/${tourImages[t?.id]||'kotor'}.svg`;}
const icons={gate:'⚓',clock:'🕰️',cathedral:'⛪',chapel:'⚖️',rivergate:'🌊',sea:'☠️',fortress:'🏰',olive:'🌿',palace:'📜',bridge:'🌉',tower:'🗼',church:'⛪',mosque:'🕌',river:'💧'};

function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function toast(msg){toastEl.textContent=msg;toastEl.classList.add('on');clearTimeout(toastEl._t);toastEl._t=setTimeout(()=>toastEl.classList.remove('on'),2800);}
async function api(path,{method='GET',body,auth=true}={}){
  const headers={'Content-Type':'application/json'};
  if(auth&&state.token)headers.Authorization=`Bearer ${state.token}`;
  const target=path.startsWith('/api/')?BASE_PATH+path:path;
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),18000);
  try{
    const r=await fetch(target,{method,headers,body:body?JSON.stringify(body):undefined,cache:'no-store',signal:controller.signal});
    const raw=await r.text();
    let data={};
    try{data=raw?JSON.parse(raw):{}}catch{}
    if(!r.ok){
      const details=Array.isArray(data.details)&&data.details.length?` (${data.details.join(', ')})`:'';
      throw new Error(`${data.error||(r.status===404?'Serverska ruta nije pronađena. Provjerite deploy.':`Server je vratio grešku ${r.status}.`)}${details}`);
    }
    return data;
  }catch(error){
    if(error?.name==='AbortError')throw new Error('Server se nije javio na vrijeme. Pokušajte ponovo.');
    if(error instanceof TypeError)throw new Error('Nije moguće povezati se sa serverom. Osvježite stranicu i pokušajte ponovo.');
    throw error;
  }finally{clearTimeout(timer)}
}
function shell(content){app.innerHTML=`<main class="app-shell">${content}</main>`;window.scrollTo({top:0,left:0,behavior:'auto'});}
function topbar(title,back='tours',right=''){return `<header class="topbar"><button class="back" data-action="back" data-to="${back}" aria-label="Nazad">‹</button><div style="flex:1;min-width:0"><div class="eyebrow">Montenegro Treasure Hunt</div><h1 class="display">${esc(title)}</h1></div>${right}</header>`;}
function loading(){shell(`<section class="screen"><div class="center" style="margin:auto;padding:40px"><div class="spinner"></div><p class="muted" style="margin-top:14px">Učitavanje avanture...</p></div></section>`);}

async function boot(){
  try{state.health=await api('/api/health',{auth:false});state.devMode=Boolean(state.health.devMode)}catch(e){state.healthError=e.message}
  if(!state.token)return renderLanding();
  try{await loadAccess()}catch(e){localStorage.removeItem('mth_access');state.token='';toast(e.message);renderLanding()}
}
async function loadAccess(){
  loading();
  const d=await api('/api/player/access');
  state.access=d.access;state.tours=d.tours;localStorage.setItem('mth_access',state.token);
  if(d.activeSession){state.session=d.activeSession;state.tour=state.tours.find(t=>t.id===state.session.tourId)||null;if(state.tour){state.view='game';return renderGame()}}
  if(state.access.selectedTourId&&state.tours.length===1){state.tour=state.tours[0];state.view='detail';return renderTourDetail()}
  state.view='tours';renderTours();
}

function previewMarkup(){return previewPrograms.map(p=>`<article class="program-card" style="--program-image:url('${tourImage(p)}')"><div class="program-media"></div><div class="program-content"><div class="program-top"><span class="program-mark">${esc(p.mark)}</span><span class="program-tag">${esc(p.tag)}</span></div><div><h3 class="display">${esc(p.city)}</h3><p>${esc(p.title)}</p><div class="program-meta"><span>⏱ ${esc(p.duration)}</span><span>↔ ${esc(p.distance)}</span><span>◆ ${esc(p.level)}</span></div></div></div></article>`).join('')}
function statusMarkup(){
  if(state.health?.ok)return `<div class="system-status"><span>●</span><div><b>Sistem online</b><small>Server je spreman za aktivaciju vaučera.</small></div></div>`;
  return `<div class="system-status" style="background:rgba(180,71,52,.1);border-color:rgba(180,71,52,.25)"><span style="background:#b44734">!</span><div><b>Provjera servera</b><small>${esc(state.healthError||'Server još nije odgovorio. Pokušajte ponovo.')}</small></div></div>`;
}
function renderLanding(){
  state.view='landing';
  shell(`<section class="screen landing-screen"><div class="landing-scroll">
    <section class="landing-hero"><div class="landing-hero-inner">
      <div class="brand"><div class="logo">🧭</div><div><div class="eyebrow">Digitalna avantura kroz Crnu Goru</div><strong>Montenegro Treasure Hunt</strong></div></div>
      <h1 class="display landing-title">Grad je mapa.<br>Priča je blago.</h1>
      <p class="landing-copy">Istražite Kotor, Ulcinj, Bar, Cetinje, Herceg Novi i Podgoricu kroz interaktivne misterije, GPS stanice i tragove koji se otključavaju na pravim lokacijama.</p>
      <div class="hero-pills"><span>6 gradova</span><span>30 lokacija</span><span>GPS avantura</span><span>Bez instalacije</span></div>
      <div class="hero-actions"><a href="#programi">Pogledaj programe</a><a href="#voucher-form">Imam vaučer</a></div>
    </div></section>
    <section class="program-preview" id="programi"><header class="preview-head"><div><div class="eyebrow">Pregled svih programa</div><h2 class="display">Šest gradova. Šest potpuno različitih priča.</h2></div><p>Prije aktivacije pregledajte trajanje, distancu i težinu svake avanture. Vaučer zatim otključava programe koji pripadaju vašem paketu.</p></header><div class="program-grid">${previewMarkup()}</div></section>
    <section class="landing-body">
      <form id="voucher-form" class="voucher-panel stack">
        <div><div class="eyebrow">Ulaz u avanturu</div><h2 class="display">Aktivirajte vaučer</h2><p>Kod koji ste dobili nakon kupovine otključava dostupne ture. Unesite ga tačno kako je napisan.</p></div>
        ${statusMarkup()}
        <div class="field"><label for="voucher">Vaučer kod</label><input id="voucher" class="input code" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" placeholder="MTH-XXXX-XXXX" required></div>
        <button class="btn full" type="submit">Otključaj avanturu</button>
        <div id="voucher-error" class="small" style="color:#a73627;min-height:20px;font-weight:750"></div>
        ${state.devMode?`<div class="test-box"><div><small>Test pristup svim programima</small><b>MTH-TEST-ALL</b></div><button type="button" data-action="test-voucher">Pokreni test</button></div>`:''}
      </form>
      <div class="landing-guide">
        <article class="guide-card"><div class="eyebrow">01 — Aktivacija</div><h3 class="display">Jedan kod, jasan pristup</h3><div class="guide-feature"><i>1</i><div><b>Unesite vaučer</b><span>Aplikacija odmah prikazuje ture koje vaš paket uključuje.</span></div></div></article>
        <article class="guide-card"><div class="eyebrow">02 — Izbor</div><h3 class="display">Birate grad i priču</h3><div class="guide-feature"><i>2</i><div><b>Pregled prije starta</b><span>Vidite trajanje, distancu, teren, priču i cijelu ugrađenu rutu.</span></div></div></article>
        <article class="guide-card"><div class="eyebrow">03 — Avantura</div><h3 class="display">Telefon postaje kompas</h3><div class="guide-feature"><i>3</i><div><b>GPS vas vodi</b><span>Na svakoj lokaciji rješavate zadatak i otključavate novi dokaz.</span></div></div></article>
        <div class="admin-link"><a href="${BASE_PATH}/admin">Admin panel</a></div>
      </div>
    </section>
  </div></section>`);
  document.querySelector('#voucher-form').addEventListener('submit',redeem);
}
async function redeem(e){
  e.preventDefault();
  const btn=e.currentTarget.querySelector('button[type="submit"]');
  const input=document.querySelector('#voucher');
  const err=document.querySelector('#voucher-error');
  const code=String(input.value||'').trim().toUpperCase().replace(/\s+/g,'');
  if(!code){err.textContent='Unesite vaučer kod.';input.focus();return}
  input.value=code;btn.disabled=true;const old=btn.textContent;btn.textContent='Provjera koda...';err.textContent='';
  try{const d=await api('/api/player/redeem',{method:'POST',body:{code},auth:false});state.token=d.token;localStorage.setItem('mth_access',state.token);history.replaceState({},'',`${BASE_PATH}/?access=${encodeURIComponent(state.token)}`);await loadAccess()}
  catch(x){err.textContent=x.message;e.currentTarget.scrollIntoView({behavior:'smooth',block:'center'})}
  finally{btn.disabled=false;btn.textContent=old}
}

function renderTours(){state.view='tours';shell(`<section class="screen"><div class="voucher-summary"><div><div class="eyebrow">Aktivan pristup</div><b>${state.access.isTest?'Test režim':'Vaučer je uspješno aktiviran'}</b></div><span class="badge">${state.tours.length} ${state.tours.length===1?'tura':'tura'}</span></div><div class="scroll"><header class="tours-intro"><div class="eyebrow">Izaberite destinaciju</div><h1 class="display">Koju priču otključavate?</h1><p class="muted">Svaka tura je zasebna urbana avantura sa originalnom pričom, lokacijskim zadacima i dokazima koje otkrivate na terenu.</p></header><div class="tour-list">${state.tours.map(t=>`<button class="tour-card" data-action="tour" data-id="${t.id}" style="--tour-image:url('${tourImage(t)}')"><span class="tour-card-image"></span><span class="tour-card-content"><span class="tour-card-top"><span class="tour-mark">${esc(t.mark||'🧭')}</span><span class="chev">›</span></span><h2 class="display">${esc(t.city)}</h2><p>${esc(t.title)}</p><span class="tour-meta"><span>⏱ ${esc(t.duration)}</span><span>↔ ${esc(t.distance)}</span><span>◆ ${esc(t.level)}</span></span></span></button>`).join('')}</div></div><div class="sticky"><button class="btn secondary full" data-action="logout-player">Koristi drugi vaučer</button></div></section>`)}

function getPoints(tour){return tour?.case?.checkpoints||[]}
function project(points,point,w=360,h=250,pad=30){const lats=points.map(p=>p.lat),lngs=points.map(p=>p.lng);let minLat=Math.min(...lats),maxLat=Math.max(...lats),minLng=Math.min(...lngs),maxLng=Math.max(...lngs);if(maxLat===minLat){maxLat+=.001;minLat-=.001}if(maxLng===minLng){maxLng+=.001;minLng-=.001}const x=pad+(point.lng-minLng)/(maxLng-minLng)*(w-pad*2),y=h-pad-(point.lat-minLat)/(maxLat-minLat)*(h-pad*2);return{x:Math.max(pad,Math.min(w-pad,x)),y:Math.max(pad,Math.min(h-pad,y))}}
function routeMap(tour,{session=null,position=null,large=false}={}){const pts=getPoints(tour),w=420,h=large?330:270;if(!pts.length)return `<div class="route-map"></div>`;const coords=pts.map(p=>project(pts,p,w,h));const path=coords.map((p,i)=>`${i?'L':'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');const idx=session?.checkpointIndex||0;const user=position?project(pts,position,w,h):null;return `<div class="route-map" style="height:${large?'330px':'270px'}"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Ugrađena mapa rute"><defs><pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M 28 0 L 0 0 0 28" class="map-grid" fill="none"/></pattern></defs><rect width="100%" height="100%" fill="url(#grid)"/><path d="${path}" class="route-line"/>${coords.map((c,i)=>`<g class="map-marker"><circle cx="${c.x}" cy="${c.y}" r="${i===idx?15:12}" fill="${i<idx?'#58ad78':i===idx?'#f0d087':'#123f49'}" stroke="${i===idx?'#fff1c4':'#d9aa4c'}" stroke-width="3"/><text x="${c.x}" y="${c.y+4}" text-anchor="middle" fill="${i===idx?'#261a06':'#fff'}" font-size="11" font-weight="900">${i+1}</text></g>`).join('')}${user?`<circle class="map-user" cx="${user.x}" cy="${user.y}" r="8"/>`:''}</svg><div class="map-legend"><span class="map-chip">${esc(tour.city)} · ${pts.length} stanica</span><span class="map-chip">100% ugrađena mapa</span></div></div>`}

function renderTourDetail(){state.view='detail';const t=state.tour,c=t.case;const pts=getPoints(t);shell(`<section class="screen">${topbar(t.city)}<div class="scroll"><section class="detail-hero" style="--tour-image:url('${tourImage(t)}')"><div class="eyebrow">${esc(t.tag)}</div><h1 class="display">${esc(t.title)}</h1><p class="muted">${esc(t.copy)}</p><div class="facts"><span>⏱ ${esc(t.duration)}</span><span>↔ ${esc(t.distance)}</span><span>👥 ${esc(t.players)}</span><span>◆ ${esc(t.level)}</span></div></section><section class="detail-grid"><div class="detail-main">${routeMap(t,{large:true})}<article class="card"><div class="eyebrow">Slučaj</div><p style="line-height:1.65;margin:10px 0">${esc(c.briefing)}</p><div class="question display">${esc(c.arc?.question||t.copy)}</div></article></div><aside class="detail-side"><article class="card stack"><div><div class="eyebrow">Tok avanture</div><h3 class="display" style="margin:7px 0;font-size:clamp(1.7rem,4vw,2rem)">Šta vas čeka</h3></div><div class="steps"><div class="step"><i>1</i><div><b>Dolazak na start</b><span>${esc(c.start)}</span></div></div><div class="step"><i>2</i><div><b>${pts.length} lokacijskih stanica</b><span>Mapa i tragovi se otključavaju korak po korak.</span></div></div><div class="step"><i>3</i><div><b>Završni dokaz</b><span>Sakupljeni tragovi vode do raspleta slučaja.</span></div></div></div></article>${c.route?.safety?`<article class="card"><div class="eyebrow">Prije polaska</div><p class="small muted" style="margin:8px 0 0">${esc(c.route.safety)}</p></article>`:''}</aside></section></div><div class="sticky"><button class="btn full" data-action="setup">Pripremi posadu</button></div></section>`)}

function renderSetup(){state.view='setup';const t=state.tour;state.setup=state.setup||{crewName:'',captainName:'',playerCount:2,mode:state.access.isTest?'test':'live'};shell(`<section class="screen">${topbar('Priprema posade','detail')}<div class="scroll"><div class="pad stack"><div><div class="eyebrow">${esc(t.city)}</div><h1 class="display" style="margin:7px 0;font-size:clamp(2.3rem,7vw,4.5rem)">Sve na jednom ekranu</h1><p class="muted small">Upišite osnovne podatke i izaberite način pokretanja. Kasnije ih nećemo ponovo tražiti.</p></div><div class="card stack"><div class="field"><label>Ime posade</label><input class="input" id="crew" maxlength="60" placeholder="npr. Jadranski vukovi" value="${esc(state.setup.crewName)}"></div><div class="field"><label>Ime kapetana</label><input class="input" id="captain" maxlength="60" placeholder="Ime osobe koja drži telefon" value="${esc(state.setup.captainName)}"></div><div class="field"><label>Broj igrača</label><select id="players" class="input">${Array.from({length:state.access.maxPlayers},(_,i)=>i+1).map(n=>`<option ${n===state.setup.playerCount?'selected':''}>${n}</option>`).join('')}</select></div></div><div class="card"><div class="eyebrow">Način igre</div><div class="segmented" style="margin-top:10px"><button class="segment ${state.setup.mode==='live'?'on':''}" data-action="mode" data-mode="live">📍 GPS uživo<br><span class="small" style="font-weight:500">Na pravoj ruti</span></button>${state.access.isTest?`<button class="segment ${state.setup.mode==='test'?'on':''}" data-action="mode" data-mode="test">🧪 Simulacija<br><span class="small" style="font-weight:500">Test iz fotelje</span></button>`:''}</div></div><div class="card"><div class="eyebrow">Provjera prije starta</div><div class="checklist" style="margin-top:10px"><div class="check"><span class="ico">🗺️</span><div><b>Mapa je ugrađena</b><span>Ne koristi Google Maps, OpenStreetMap ni drugi servis.</span></div></div><div class="check"><span class="ico">💾</span><div><b>Napredak se čuva</b><span>Ako zatvorite stranicu, nastavljate aktivnu sesiju.</span></div></div><div class="check"><span class="ico">🛡️</span><div><b>Bez opasnih prečica</b><span>Ne ulazite na privatni posjed i pratite pješačke površine.</span></div></div></div></div></div></div><div class="sticky"><button class="btn full" data-action="start-session">${state.setup.mode==='test'?'Pokreni simulaciju':'Dozvoli GPS i kreni'}</button></div></section>`)}

async function startSession(){const crew=document.querySelector('#crew').value.trim(),captain=document.querySelector('#captain').value.trim();if(!crew||!captain)return toast('Upišite ime posade i kapetana.');state.setup={crewName:crew,captainName:captain,playerCount:Number(document.querySelector('#players').value),mode:state.setup.mode};try{if(state.setup.mode==='live')await requestGps();const d=await api('/api/player/sessions',{method:'POST',body:{tourId:state.tour.id,...state.setup}});state.session=d.session;state.tour=d.tour;state.testStage=0;state.tab='map';renderGame()}catch(e){toast(e.message)}}
function requestGps(){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(new Error('Ovaj uređaj nema dostupan GPS.'));navigator.geolocation.getCurrentPosition(p=>{state.position={lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy};resolve()},()=>reject(new Error('Omogućite pristup lokaciji da biste igrali GPS režim.')),{enableHighAccuracy:true,timeout:12000,maximumAge:0})})}
function startGpsWatch(){if(state.watchId!=null||state.session.mode!=='live'||!navigator.geolocation)return;state.watchId=navigator.geolocation.watchPosition(p=>{state.position={lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy};api(`/api/player/sessions/${state.session.publicId}`,{method:'PATCH',body:{position:state.position}}).catch(()=>{});renderGame(false)},()=>toast('GPS signal trenutno nije dostupan.'),{enableHighAccuracy:true,maximumAge:3000,timeout:15000})}
function stopGps(){if(state.watchId!=null){navigator.geolocation.clearWatch(state.watchId);state.watchId=null}}
function meters(a,b){const R=6371000,toR=d=>d*Math.PI/180,dLat=toR(b.lat-a.lat),dLng=toR(b.lng-a.lng),q=Math.sin(dLat/2)**2+Math.cos(toR(a.lat))*Math.cos(toR(b.lat))*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.sqrt(q))}
function simulatedPosition(cp,stage){const d=[.003,.0011,.00035,0][stage]||0;return{lat:cp.lat+d,lng:cp.lng-d,accuracy:stage===3?5:15}}
function stageInfo(distance,cp){if(distance<=cp.radius)return{label:'Stigli ste',heat:100,text:cp.arrival,arrived:true};if(distance<=80)return{label:'Vrlo blizu',heat:82,text:cp.close,arrived:false};if(distance<=180)return{label:'Blizu',heat:55,text:cp.near,arrived:false};return{label:'Pratite mapu',heat:25,text:cp.far,arrived:false}}
function currentPosition(){const cp=state.tour.case.checkpoints[state.session.checkpointIndex];if(state.session.mode==='test')return simulatedPosition(cp,state.testStage);return state.position||state.session.lastPosition}

function renderGame(resetScroll=true){state.view='game';const s=state.session,t=state.tour,c=t.case,cps=c.checkpoints,cp=cps[Math.min(s.checkpointIndex,cps.length-1)];if(s.status==='completed')return renderFinal();const pos=currentPosition();const distance=pos?meters(pos,cp):9999;const stage=stageInfo(distance,cp);const elapsed=Math.max(0,Date.now()-new Date(s.startedAt).getTime());const mins=Math.floor(elapsed/60000);const body=state.tab==='map'?renderMapTab(t,s,cp,pos,distance,stage):state.tab==='case'?renderCaseTab(t,s):state.tab==='evidence'?renderEvidenceTab(t,s):renderBonusTab(t,s);shell(`<section class="screen"><header class="game-head"><div class="game-head-top"><button class="back" data-action="exit-game" aria-label="Izađi">×</button><div class="game-head-title"><b class="display">${esc(t.city)} · ${esc(cp.chapter)}</b><span>Stanica ${s.checkpointIndex+1} od ${cps.length}</span></div><div class="game-stat">${s.score} poena<br>${mins} min</div></div><div class="progress">${cps.map((_,i)=>`<i class="${i<s.checkpointIndex?'done':i===s.checkpointIndex?'now':''}"></i>`).join('')}</div></header><div class="scroll game-main">${body}</div><nav class="tabs">${[['map','🗺️','Mapa'],['case','📜','Slučaj'],['evidence','🔎','Dokazi'],['bonus','⚓','Bonusi']].map(([id,ic,l])=>`<button class="tab ${state.tab===id?'on':''}" data-action="tab" data-tab="${id}"><span>${ic}</span>${l}</button>`).join('')}</nav>${state.overlay||''}</section>`);if(resetScroll)window.scrollTo({top:0,behavior:'auto'});if(s.mode==='live')startGpsWatch();scheduleSignal(cp,stage,distance)}
function renderMapTab(t,s,cp,pos,distance,stage){return `${routeMap(t,{session:s,position:pos,large:true})}${s.mode==='test'?`<div class="test-controls"><b>SIMULACIJA PRIBLIŽAVANJA</b><div class="test-grid">${['Daleko','Blizu','Vrlo blizu','Stigao'].map((x,i)=>`<button class="${state.testStage===i?'on':''}" data-action="test-stage" data-stage="${i}">${x}</button>`).join('')}</div></div>`:''}<div class="mission"><div class="eyebrow">Šta sada?</div><h2 class="display">${esc(stage.label)}</h2><p class="muted">${esc(stage.text)}</p></div><div class="distance-card"><div class="distance-number">${distance>9990?'--':Math.round(distance)} m</div><div><small>${esc(cp.objective)}</small><div class="heat"><i style="width:${stage.heat}%"></i></div></div></div><div class="game-actions">${stage.arrived?`<button class="btn full" data-action="open-challenge">Otvori zadatak na lokaciji</button>`:`<button class="btn secondary full" data-action="center-map">Aktivna stanica: ${esc(cp.name)}</button>`}<button class="btn secondary full" data-action="hint">Treba mi trag</button></div>`}
function renderCaseTab(t,s){const c=t.case;return `<div class="pad"><div class="card"><div class="eyebrow">${esc(c.caseNo)}</div><h2 class="display" style="margin:7px 0;font-size:clamp(2rem,6vw,3.5rem)">${esc(c.arc.question)}</h2><p class="muted small">${esc(c.arc.stakes)}</p></div><h3 class="display" style="margin-top:20px;font-size:clamp(1.8rem,5vw,2.7rem)">Tok istrage</h3><div class="case-timeline">${c.arc.steps.map((x,i)=>`<div class="beat ${i<s.checkpointIndex?'done':i===s.checkpointIndex?'now':'lock'}"><div><b>${esc(x)}</b><p>${i<s.checkpointIndex?esc(c.checkpoints[i].whyItMatters||c.checkpoints[i].deduction):i===s.checkpointIndex?'Ovaj korak je trenutno aktivan.':'Otključava se poslije prethodnog dokaza.'}</p></div></div>`).join('')}</div><div class="card"><b>Fikcija i činjenice</b><p class="small muted" style="margin:6px 0 0">${esc(c.arc.fictionNote||c.facts)}</p></div></div>`}
function renderEvidenceTab(t,s){const cps=t.case.checkpoints;return `<div class="pad"><h2 class="display" style="font-size:clamp(2.2rem,7vw,4rem)">Dosije dokaza</h2><p class="muted small">Svaki pronađeni dokaz objašnjava šta se promijenilo u istrazi.</p><div class="evidence-grid">${cps.map((cp,i)=>{const on=s.evidence.includes(cp.id);return `<div class="evidence ${on?'':'lock'}"><b>${on?esc(cp.evidence?.glyph||'🔎'):'🔒'} ${on?esc(cp.evidence?.title):`Dokaz ${i+1}`}</b><p>${on?esc(cp.evidence?.copy):'Otključava se na odgovarajućoj lokaciji.'}</p></div>`}).join('')}</div></div>`}
function renderBonusTab(t,s){const list=t.case.sidequests||[];return `<div class="pad"><h2 class="display" style="font-size:clamp(2.2rem,7vw,4rem)">Sporedni izazovi</h2><p class="muted small">Nijesu obavezni. Otključavaju se uz glavne stanice i donose dodatne poene.</p><div class="bonus-grid">${list.map(q=>{const unlocked=Number(q.unlock||0)<=s.checkpointIndex,done=s.sidequests.includes(q.id);return `<div class="bonus ${done?'done':''}" style="opacity:${unlocked?1:.45}"><b>${done?'✓ ':unlocked?'⚓ ':'🔒 '}${esc(q.title)} <span style="float:right;color:var(--gold)">+${q.points}</span></b><p>${esc(q.copy)}</p>${unlocked&&!done?`<button class="btn secondary small full" style="margin-top:10px" data-action="sidequest" data-id="${q.id}">Označi kao završeno</button>`:done?`<p style="color:#b7efca">${esc(q.result||'Bonus je upisan.')}</p>`:''}</div>`}).join('')}</div></div>`}
function scheduleSignal(cp,stage,distance){clearTimeout(state.signalTimer);const key=`${state.session.checkpointIndex}:${stage.label}`;if(!state.shownSignals.has(key)){state.shownSignals.add(key);const sig=stage.arrived?cp.signals?.close:distance<180?cp.signals?.near:cp.signals?.start;if(sig)setTimeout(()=>toast(`${sig.icon||'📨'} ${sig.title}: ${sig.body}`),500)}state.signalTimer=setTimeout(()=>{const events=state.tour.case.events||[];const options=events.filter(e=>Number(e.minIdx||0)<=state.session.checkpointIndex);if(options.length){const e=options[Math.floor(Math.random()*options.length)];toast(`${e.icon||'📜'} ${e.title}: ${e.body}`)}},30000)}
function openChallenge(){const cp=state.tour.case.checkpoints[state.session.checkpointIndex];state.selectedAnswer=null;state.overlay=`<div class="overlay"><div class="sheet"><div class="handle"></div><div class="location-art">${icons[cp.art]||'📍'}</div><div class="eyebrow">${esc(cp.name)}</div><h2 class="display" style="margin:7px 0;font-size:clamp(2rem,7vw,3.5rem)">${esc(cp.chapter)}</h2><p class="muted small">${esc(cp.arrival)}</p><div class="card" style="margin:13px 0"><div class="eyebrow">Zadatak</div><p style="font-size:18px;line-height:1.45;margin:8px 0 13px">${esc(cp.question)}</p>${cp.type==='choice'?cp.options.map((x,i)=>`<button class="choice" data-action="pick-answer" data-answer="${i}">${esc(x)}</button>`).join(''):`<input id="text-answer" class="input" placeholder="Upišite odgovor" autocomplete="off">`}<div id="answer-feedback"></div></div><div class="row"><button class="btn secondary" data-action="close-overlay">Nazad</button><button class="btn" data-action="submit-answer">Potvrdi odgovor</button></div></div></div>`;renderGame(false)}
async function submitAnswer(){const cp=state.tour.case.checkpoints[state.session.checkpointIndex];const answer=cp.type==='choice'?state.selectedAnswer:document.querySelector('#text-answer')?.value;if(answer===null||answer===undefined||answer==='')return toast('Izaberite ili upišite odgovor.');try{const d=await api(`/api/player/sessions/${state.session.publicId}/answer`,{method:'POST',body:{answer,position:currentPosition()}});state.session=d.session;if(!d.correct){const f=document.querySelector('#answer-feedback');if(f)f.innerHTML=`<div class="feedback bad">${esc(d.feedback)}</div>`;return}state.overlay=`<div class="overlay"><div class="sheet"><div class="handle"></div><div class="location-art">${esc(d.evidence?.glyph||'🔎')}</div><div class="eyebrow">Novi dokaz</div><h2 class="display" style="margin:7px 0;font-size:clamp(2rem,7vw,3.5rem)">${esc(d.evidence?.title)}</h2><p style="line-height:1.55">${esc(d.evidence?.copy)}</p>${d.finale?`<button class="btn full" data-action="finish">Otvori završetak</button>`:`<button class="btn full" data-action="continue">Nastavi do sljedeće stanice</button>`}</div></div>`;state.testStage=0;renderGame(false)}catch(e){toast(e.message)}}
async function useHint(){try{const d=await api(`/api/player/sessions/${state.session.publicId}/hint`,{method:'POST',body:{}});state.session.hints=d.hints;state.overlay=`<div class="overlay"><div class="sheet"><div class="handle"></div><div class="eyebrow">Trag</div><h2 class="display" style="font-size:clamp(2rem,7vw,3.5rem)">Pogledajte još jednom</h2><p style="line-height:1.55">${esc(d.hint)}</p><button class="btn full" data-action="close-overlay">Razumijem</button></div></div>`;renderGame(false)}catch(e){toast(e.message)}}
function renderFinal(){stopGps();const s=state.session,t=state.tour,c=t.case;const elapsed=Math.round((Date.now()-new Date(s.startedAt))/60000);shell(`<section class="screen"><div class="scroll"><div class="final"><div class="final-seal">🏆</div><div class="eyebrow">Slučaj je zatvoren</div><h1 class="display">${esc(t.title)}</h1><p class="muted">${esc(c.finale)}</p><div class="metrics"><div class="metric"><b>${s.score}</b><span>Poena</span></div><div class="metric"><b>${elapsed}</b><span>Minuta</span></div><div class="metric"><b>${s.evidence.length}/${c.checkpoints.length}</b><span>Dokaza</span></div></div><div class="card" style="margin-top:14px;text-align:left"><div class="eyebrow">Šta je bilo stvarno?</div><p class="small muted" style="margin:7px 0 0">${esc(c.facts)}</p></div><button class="btn full" style="margin-top:16px" data-action="finish-home">Završi avanturu</button></div></div></section>`)}

async function completeSidequest(id){try{const d=await api(`/api/player/sessions/${state.session.publicId}/sidequest`,{method:'POST',body:{sidequestId:id}});state.session=d.session;toast(d.result||'Bonus je upisan.');renderGame(false)}catch(e){toast(e.message)}}
function closeOverlay(){state.overlay=null;renderGame(false)}
function navigate(to){state.overlay=null;if(to==='tours')renderTours();else if(to==='detail')renderTourDetail();else if(to==='setup')renderSetup()}

document.addEventListener('click',async e=>{const el=e.target.closest('[data-action]');if(!el)return;const a=el.dataset.action;
  if(a==='test-voucher'){const input=document.querySelector('#voucher');if(input)input.value='MTH-TEST-ALL';document.querySelector('#voucher-form')?.requestSubmit()}
  else if(a==='tour'){state.tour=state.tours.find(t=>t.id===el.dataset.id);renderTourDetail()}
  else if(a==='back')navigate(el.dataset.to)
  else if(a==='setup')renderSetup()
  else if(a==='mode'){state.setup.mode=el.dataset.mode;renderSetup()}
  else if(a==='start-session')startSession()
  else if(a==='tab'){state.tab=el.dataset.tab;renderGame()}
  else if(a==='test-stage'){state.testStage=Number(el.dataset.stage);renderGame(false)}
  else if(a==='open-challenge')openChallenge()
  else if(a==='close-overlay')closeOverlay()
  else if(a==='pick-answer'){state.selectedAnswer=Number(el.dataset.answer);document.querySelectorAll('.choice').forEach(x=>x.classList.toggle('on',x===el))}
  else if(a==='submit-answer')submitAnswer()
  else if(a==='hint')useHint()
  else if(a==='continue'){state.overlay=null;renderGame()}
  else if(a==='finish')renderFinal()
  else if(a==='sidequest')completeSidequest(el.dataset.id)
  else if(a==='exit-game'){if(confirm('Napredak je sačuvan. Želite li izaći na izbor ture?')){stopGps();renderTours()}}
  else if(a==='logout-player'){if(confirm('Ovim ćete ukloniti pristup sa ovog uređaja.')){localStorage.removeItem('mth_access');state.token='';history.replaceState({},'',location.pathname);renderLanding()}}
  else if(a==='finish-home'){localStorage.removeItem('mth_access');state.token='';history.replaceState({},'',location.pathname);renderLanding()}
  else if(a==='center-map')toast(`Aktivna lokacija: ${state.tour.case.checkpoints[state.session.checkpointIndex].name}`)
});

window.addEventListener('beforeunload',stopGps);
boot();
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register(`${BASE_PATH}/sw.js`,{scope:`${BASE_PATH}/`}).then(reg=>reg.update()).catch(()=>{});
