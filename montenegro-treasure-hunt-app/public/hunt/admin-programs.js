(() => {
  const KEY='mth_admin_program_id';
  const nativeFetch=window.fetch.bind(window);
  let programs=[];
  let defaultProgramId='PG26';
  let scheduled=false;

  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const selectedId=()=>sessionStorage.getItem(KEY)||defaultProgramId||programs[0]?.id||'PG26';
  const selectedProgram=()=>programs.find(p=>p.id===selectedId())||programs.find(p=>p.id===defaultProgramId)||programs[0]||null;

  window.fetch=(input,init={})=>{
    const raw=typeof input==='string'?input:input?.url||'';
    if(!raw.includes('/hunt/team-api/admin/')||raw.includes('/admin/programs')) return nativeFetch(input,init);
    const u=new URL(raw,location.origin);
    if(!u.searchParams.has('program'))u.searchParams.set('program',selectedId());
    const next=u.origin===location.origin?u.pathname+u.search+u.hash:u.toString();
    if(typeof input==='string')return nativeFetch(next,init);
    return nativeFetch(new Request(next,input),init);
  };

  async function api(path,{method='GET',body}={}){
    const r=await fetch('/hunt/team-api'+path,{method,headers:{'content-type':'application/json'},body:body?JSON.stringify(body):undefined,cache:'no-store'});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.error||'Program manager nije dostupan.');
    return d;
  }

  async function loadPrograms(){
    try{
      const d=await api('/admin/programs');
      programs=d.programs||[];defaultProgramId=d.defaultProgramId||programs[0]?.id||'PG26';
      if(!programs.some(p=>p.id===selectedId()))sessionStorage.setItem(KEY,defaultProgramId);
      schedule();
    }catch(e){console.error('MTH programs',e)}
  }

  async function activate(id){
    await api(`/admin/programs/${encodeURIComponent(id)}/default`,{method:'POST'});
    sessionStorage.setItem(KEY,id);
    location.reload();
  }

  function addStyles(){
    if(document.querySelector('#mth-program-style'))return;
    const s=document.createElement('style');s.id='mth-program-style';s.textContent=`
    .mth-prog-switch{margin:12px;padding:10px;border:1px solid rgba(255,255,255,.1);border-radius:14px;background:rgba(255,255,255,.035)}.mth-prog-switch label{display:block;margin-bottom:6px;color:#78949a;font-size:10px;font-weight:900;letter-spacing:.12em}.mth-prog-switch .r{display:grid;grid-template-columns:1fr auto;gap:7px}.mth-prog-switch select{min-width:0;width:100%;border:1px solid rgba(255,255,255,.12);border-radius:10px;background:#0b252c;color:#eef7f7;padding:9px;font-weight:800}.mth-prog-switch button{border:1px solid rgba(255,255,255,.12);border-radius:10px;background:#15333a;color:#d8b56a;padding:0 12px;font-weight:900;cursor:pointer}.mth-prog-switch small{display:block;margin-top:6px;color:#77939a;font-size:10px}
    .mth-prog-modal{position:fixed;z-index:9500;inset:0;display:grid;place-items:center;padding:20px;background:rgba(2,10,13,.82)}.mth-prog-dialog{width:min(980px,100%);max-height:88vh;overflow:auto;border:1px solid rgba(255,255,255,.13);border-radius:22px;background:#092027;color:#eff8f8}.mth-prog-head{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:flex-start;padding:20px 22px;background:#092027;border-bottom:1px solid rgba(255,255,255,.1)}.mth-prog-head small{color:#819ca2;font-weight:900;letter-spacing:.12em}.mth-prog-head h2{margin:4px 0 0}.mth-prog-close{border:0;background:transparent;color:#fff;font-size:28px;cursor:pointer}.mth-prog-body{padding:20px 22px;display:grid;gap:20px}.mth-prog-create{display:grid;grid-template-columns:1fr 1.4fr 1fr .6fr 1fr;gap:9px;align-items:end;padding:14px;border:1px solid rgba(255,255,255,.1);border-radius:16px}.mth-prog-create label,.mth-code-editor label{display:grid;gap:5px;color:#8ba6ab;font-size:11px;font-weight:800}.mth-prog-create input,.mth-prog-create select,.mth-code-editor input,.mth-code-editor textarea{width:100%;box-sizing:border-box;border:1px solid rgba(255,255,255,.13);border-radius:10px;background:#07191e;color:#fff;padding:10px}.mth-prog-create button,.mth-prog-card button,.mth-code-editor button{border:0;border-radius:10px;background:#d8b56a;color:#07171d;padding:10px 12px;font-weight:900;cursor:pointer}.mth-prog-card button.secondary,.mth-code-editor button.secondary{background:#15333a;color:#edf7f7;border:1px solid rgba(255,255,255,.12)}.mth-prog-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:11px}.mth-prog-card{padding:15px;border:1px solid rgba(255,255,255,.1);border-radius:16px;background:#0b252c}.mth-prog-card.current{border-color:#d8b56a}.mth-prog-card h3{margin:0 0 3px}.mth-prog-card p{margin:0;color:#829da3;font-size:12px}.mth-prog-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:13px 0}.mth-prog-meta span{padding:8px;border-radius:9px;background:#071a20}.mth-prog-meta small{display:block;color:#6e8a90;font-size:9px}.mth-prog-actions{display:flex;gap:6px;flex-wrap:wrap}.mth-prog-actions button{font-size:11px}.mth-prog-error{min-height:18px;color:#ff9b9b;font-size:12px}.mth-code-editor{display:grid;gap:12px}.mth-code-editor textarea{min-height:260px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;line-height:1.55}.mth-code-actions{display:flex;gap:8px;flex-wrap:wrap}@media(max-width:760px){.mth-prog-modal{padding:8px}.mth-prog-create{grid-template-columns:1fr 1fr}.mth-prog-create label:nth-child(2){grid-column:span 2}}
    `;document.head.appendChild(s);
  }

  function switchMarkup(){const p=selectedProgram();return `<div class="mth-prog-switch" data-mth-program-switch><label>AKTIVNI PROGRAM</label><div class="r"><select data-mth-program-select>${programs.map(x=>`<option value="${esc(x.id)}" ${x.id===p?.id?'selected':''}>${esc(x.id)} · ${esc(x.name)}</option>`).join('')}</select><button type="button" data-mth-programs>＋</button></div><small>${esc(p?.location||'')} · ${p?.teamCount||0} timova</small></div>`}

  function injectSwitcher(){
    if(!programs.length)return;const side=document.querySelector('#sidebar');if(!side)return;
    let block=side.querySelector('[data-mth-program-switch]');
    if(!block){(side.querySelector('.side-brand')||side.firstElementChild)?.insertAdjacentHTML('afterend',switchMarkup());block=side.querySelector('[data-mth-program-switch]')}
    const sel=block?.querySelector('[data-mth-program-select]');if(sel&&!sel.dataset.bound){sel.dataset.bound='1';sel.onchange=async()=>{sel.disabled=true;try{await activate(sel.value)}catch(e){alert(e.message);sel.disabled=false}}}
    const open=block?.querySelector('[data-mth-programs]');if(open&&!open.dataset.bound){open.dataset.bound='1';open.onclick=openManager}
  }

  function patchCopy(){
    const p=selectedProgram();if(!p)return;
    const eye=document.querySelector('.side-brand .eyebrow');if(eye)eye.textContent=`MTH / ${p.id}`;
    const he=document.querySelector('.header-copy .eyebrow');if(he)he.textContent=`${p.name}${p.location?' · '+p.location:''}`;
    const online=document.querySelector('#headerOnline');if(online){const n=(online.textContent.match(/^\d+/)||['0'])[0];online.textContent=`${n}/${p.teamCount} online`}
    const mt=document.querySelector('.map-toolbar h3');if(mt)mt.textContent=`${p.name} · live operations`;
    document.querySelectorAll('.team-table-row').forEach((row,i)=>{const sm=row.querySelector('span:first-child small');const code=p.codes?.find(x=>Number(x.teamNo)===i+1)?.code;if(sm&&code)sm.textContent=code});
    const reset=document.querySelector('[data-reset-event]');if(reset)reset.textContent=`Resetuj ${p.id} program`;
  }

  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;addStyles();injectSwitcher();patchCopy()})}

  function card(p){return `<article class="mth-prog-card ${p.id===selectedId()?'current':''}"><h3>${esc(p.name)}</h3><p>${esc(p.id)}${p.location?' · '+esc(p.location):''}</p><div class="mth-prog-meta"><span><small>TIMOVI</small><b>${p.teamCount}</b></span><span><small>PREFIX</small><b>${esc(p.codePrefix)}</b></span><span><small>STATUS</small><b>${p.enabled?(p.eventOpen?'OPEN':'READY'):'OFF'}</b></span></div><div class="mth-prog-actions"><button data-open="${esc(p.id)}">Otvori</button><button class="secondary" data-codes="${esc(p.id)}">Kodovi</button>${p.isDefault?'':`<button class="secondary" data-default="${esc(p.id)}">Glavni</button>`}<button class="secondary" data-toggle="${esc(p.id)}">${p.enabled?'Isključi':'Uključi'}</button></div></article>`}

  function openManager(){
    document.querySelector('#mthProgModal')?.remove();document.body.insertAdjacentHTML('beforeend',`<div class="mth-prog-modal" id="mthProgModal"><section class="mth-prog-dialog"><div class="mth-prog-head"><div><small>TREASURE PLATFORM</small><h2>Programi i pristupni kodovi</h2></div><button class="mth-prog-close" data-close>×</button></div><div class="mth-prog-body"><form class="mth-prog-create" id="mthCreate"><label>ID<input id="pId" placeholder="CETINJE26" required></label><label>Naziv<input id="pName" placeholder="Cetinje Hunt 2026" required></label><label>Lokacija<input id="pLocation" placeholder="Cetinje"></label><label>Timovi<input id="pTeams" type="number" min="1" max="50" value="10" required></label><label>Prefix koda<input id="pPrefix" placeholder="CT26"></label><label>Kopiraj sadržaj<select id="pClone">${programs.map(p=>`<option value="${esc(p.id)}" ${p.id===selectedId()?'selected':''}>${esc(p.id)} · ${esc(p.name)}</option>`).join('')}</select></label><button type="submit">＋ Dodaj program</button><div class="mth-prog-error" id="pError"></div></form><div class="mth-prog-grid">${programs.map(card).join('')}</div></div></section></div>`);
    document.querySelector('[data-close]').onclick=()=>document.querySelector('#mthProgModal')?.remove();
    document.querySelector('#mthCreate').onsubmit=createProgram;
    document.querySelectorAll('[data-open]').forEach(b=>b.onclick=async()=>{try{await activate(b.dataset.open)}catch(e){alert(e.message)}});
    document.querySelectorAll('[data-codes]').forEach(b=>b.onclick=()=>openCodes(b.dataset.codes));
    document.querySelectorAll('[data-default]').forEach(b=>b.onclick=async()=>{try{await api(`/admin/programs/${encodeURIComponent(b.dataset.default)}/default`,{method:'POST'});await loadPrograms();openManager()}catch(e){alert(e.message)}});
    document.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=async()=>{const p=programs.find(x=>x.id===b.dataset.toggle);try{await api(`/admin/programs/${encodeURIComponent(p.id)}`,{method:'PUT',body:{enabled:!p.enabled}});await loadPrograms();openManager()}catch(e){alert(e.message)}});
  }

  async function createProgram(e){e.preventDefault();const err=document.querySelector('#pError');err.textContent='';try{const d=await api('/admin/programs',{method:'POST',body:{id:pId.value,name:pName.value,location:pLocation.value,teamCount:Number(pTeams.value),codePrefix:pPrefix.value,cloneFrom:pClone.value}});await activate(d.program.id)}catch(x){err.textContent=x.message}}

  function openCodes(id){
    const p=programs.find(x=>x.id===id);if(!p)return;const d=document.querySelector('.mth-prog-dialog');d.innerHTML=`<div class="mth-prog-head"><div><small>${esc(p.id)}</small><h2>Pristupni kodovi</h2></div><button class="mth-prog-close" data-back>×</button></div><div class="mth-prog-body"><div class="mth-code-editor"><p>Jedan kod po redu - red 1 je Team 01, red 2 Team 02 itd.</p><label>Kodovi<textarea id="codeList">${p.codes.map(x=>esc(x.code)).join('\n')}</textarea></label><label>Prefix za automatsku regeneraciju<input id="codePrefix" value="${esc(p.codePrefix)}"></label><div class="mth-code-actions"><button id="saveCodes">Sačuvaj kodove</button><button class="secondary" id="regenCodes">Generiši ponovo</button><button class="secondary" id="backPrograms">Nazad</button></div><div class="mth-prog-error" id="codeError"></div></div></div>`;
    const back=()=>openManager();document.querySelector('[data-back]').onclick=back;backPrograms.onclick=back;
    saveCodes.onclick=async()=>{const err=document.querySelector('#codeError');err.textContent='';try{const codes=codeList.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);await api(`/admin/programs/${encodeURIComponent(id)}/codes`,{method:'PUT',body:{codes}});await loadPrograms();openManager()}catch(e){err.textContent=e.message}};
    regenCodes.onclick=async()=>{const err=document.querySelector('#codeError');err.textContent='';try{await api(`/admin/programs/${encodeURIComponent(id)}/regenerate-codes`,{method:'POST',body:{codePrefix:codePrefix.value}});await loadPrograms();openCodes(id)}catch(e){err.textContent=e.message}};
  }

  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',schedule);
  loadPrograms();
})();
