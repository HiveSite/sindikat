(() => {
  const KEY='mth_admin_program_id', PASS='mth_simple_admin_password';
  let info={teamCount:10,stopCount:10}; let loading=false;
  const patch=()=>{
    document.querySelector('[data-nav="content"]')?.setAttribute('hidden','');
    document.querySelectorAll('.team-mini-stats span:first-child b').forEach(el=>{el.textContent=el.textContent.replace(/\/(\d+)$/,`/${info.stopCount}`)});
    document.querySelectorAll('.drawer-kpis .ops-metric').forEach(el=>{const label=el.querySelector('span')?.textContent?.toLowerCase();const b=el.querySelector('b');if(label==='story'&&b)b.textContent=b.textContent.replace(/\/(\d+)$/,`/${info.stopCount}`)});
    document.querySelectorAll('.section-head h3').forEach(el=>{if(/svih\s+\d+\s+timova/i.test(el.textContent))el.textContent=`Svih ${info.teamCount} timova`});
    const header=document.querySelector('#headerOnline');if(header){const n=(header.textContent.match(/^\d+/)||['0'])[0];header.textContent=`${n}/${info.teamCount} online`}
    document.querySelectorAll('.map-toolbar p').forEach(el=>{if(el.textContent.includes('osvježavaju'))el.textContent=`Stvarna OpenStreetMap mapa. ${info.teamCount} timova, ${info.stopCount} startnih tačaka; GPS se osvježava svakih 8 sekundi.`});
  };
  async function load(){if(loading)return;loading=true;try{const id=sessionStorage.getItem(KEY)||'PG26';const r=await fetch('/hunt/platform-api/admin/programs',{headers:{'x-mth-admin-password':sessionStorage.getItem(PASS)||''},cache:'no-store'});const d=await r.json();const p=d.programs?.find(x=>x.id===id);if(p)info={teamCount:Number(p.teamCount||10),stopCount:Number(p.stopCount||10)};patch()}catch{}finally{loading=false}}
  new MutationObserver(()=>{patch();if(!loading)setTimeout(load,30)}).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',load);load();
})();
