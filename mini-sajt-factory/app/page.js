'use client'

import { useEffect, useMemo, useState } from 'react'
import { accommodationType, bookingOpportunity, hardGate, liveEligibility, premiumScore, scoreStatus } from '../lib/engine'
import { SEED_PROJECTS } from '../lib/seed'

const STORE='mini-sajt-factory-central-v1'
const emptyScores={artDirection:0,photography:0,content:0,typography:0,layout:0,mobile:0,conversion:0,accessibility:0,performance:0,technical:0}
const qaKeys=['content','image','accessibility','responsive','artDirection','similarity','standalone']

export default function Page(){
  const [projects,setProjects]=useState(SEED_PROJECTS)
  const [selected,setSelected]=useState(SEED_PROJECTS[0]?.id)
  const [tab,setTab]=useState('overview')
  const [busy,setBusy]=useState(false)
  const [notice,setNotice]=useState('')
  const [city,setCity]=useState('')
  const [category,setCategory]=useState('')

  useEffect(()=>{try{const x=JSON.parse(localStorage.getItem(STORE)||'null');if(Array.isArray(x)&&x.length){setProjects(x);setSelected(x[0].id)}}catch{}},[])
  useEffect(()=>{try{localStorage.setItem(STORE,JSON.stringify(projects))}catch{}},[projects])

  const p=projects.find(x=>x.id===selected)||projects[0]
  const liveCount=useMemo(()=>projects.filter(x=>liveEligibility(x).pass).length,[projects])

  function patch(data){setProjects(list=>list.map(x=>x.id===p.id?{...x,...data}:x))}
  function patchNested(key,data){patch({[key]:{...(p[key]||{}),...data}})}

  async function generate(){
    setBusy(true);setNotice('Discovery radi...')
    try{
      const res=await fetch('/api/daily-batch',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({cities:city?[city]:undefined,categories:category?[category]:undefined})})
      const data=await res.json()
      if(!data.projects?.length){setNotice(data.message||'Nema kandidata. Provjeri GOOGLE_MAPS_API_KEY.');return}
      const incoming=data.projects.map(x=>({...x,contentReadiness:'PARTIAL',photoReadiness:'WEAK',menuReadiness:'NONE',conversionReadiness:x.phone?'READY':'PARTIAL',mapConfirmed:!!x.mapsUrl,qa:{},scores:{...emptyScores},designDna:{},media:[],contactStatus:'READY'}))
      setProjects(incoming);setSelected(incoming[0].id);setNotice(`Daily batch ${incoming.length}/5. Pregledano eligible kandidata: ${data.examined||0}.`)
    }catch(e){setNotice(`Greška: ${e.message}`)}finally{setBusy(false)}
  }

  function addManual(){
    const id=`manual-${Date.now()}`
    const item={id,name:'Novi lead',city:'Podgorica',type:'lokalni biznis',stage:'QUALIFY',operatingStatus:'NEPOZNATO',hasOwnSite:false,registryStatus:'DISCOVERED',grade:'C',mapConfirmed:false,contentReadiness:'NONE',photoReadiness:'WEAK',menuReadiness:'NONE',conversionReadiness:'NONE',qa:{},scores:{...emptyScores},designDna:{},media:[],contactStatus:'READY'}
    setProjects(v=>[item,...v]);setSelected(id);setTab('overview')
  }

  function addMedia(files){
    const items=[...files].slice(0,30).map((f,i)=>({id:`m-${Date.now()}-${i}`,name:f.name,url:URL.createObjectURL(f),role:i===0?'Hero':'Gallery',source:'USER_UPLOAD'}))
    patch({media:[...(p.media||[]),...items],photoReadiness:items.length>=8?'STRONG':items.length>=4?'MEDIUM':p.photoReadiness,stage:'DESIGN'})
  }

  if(!p) return null
  const gate=hardGate(p)
  const eligibility=liveEligibility(p)
  const score=premiumScore(p.scores)
  const book=bookingOpportunity(p)

  return <div className="factory-shell">
    <aside className="factory-side">
      <div className="logo">MF</div>
      <div className="brand"><strong>MINI-SAJT FACTORY</strong><span>CENTRAL COMMAND</span></div>
      <div className="side-group"><span>DANAS</span><b>{projects.length}/5</b></div>
      <div className="side-group"><span>LIVE ELIGIBLE</span><b>{liveCount}</b></div>
      <div className="side-group"><span>OUTPUT</span><small>preporuke/{'{slug}'}/index.html</small></div>
      <div className="side-foot">Registry: data/preporuke-registry.csv</div>
    </aside>

    <main className="factory-main">
      <header className="factory-top">
        <div><span className="eyebrow">DAILY PRODUCTION</span><h1>5 premium sajtova dnevno</h1><p>Discovery → research → design → QA → live → sales.</p></div>
        <div className="top-actions"><button className="btn ghost" onClick={addManual}>+ Manual lead</button><button className="btn primary" onClick={generate} disabled={busy}>{busy?'DISCOVERING...':'GENERATE 5 NOW'}</button></div>
      </header>

      {notice&&<div className="notice" onClick={()=>setNotice('')}>{notice}<b>×</b></div>}

      <section className="filters"><input value={city} onChange={e=>setCity(e.target.value)} placeholder="Grad - Kotor"/><input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Kategorija - restoran"/><span>Cilj 5, ali kvalitet ima prednost.</span></section>

      <section className="project-row">
        {projects.slice(0,8).map((x,i)=>{const s=premiumScore(x.scores);return <button className={`project-card ${x.id===p.id?'active':''}`} key={x.id} onClick={()=>{setSelected(x.id);setTab('overview')}}><small>0{i+1} · {x.type}</small><h3>{x.name}</h3><p>{x.city||'Grad nije potvrđen'}</p><div><span>{x.stage}</span><b>{s}/100</b></div></button>})}
      </section>

      <section className="workspace">
        <div className="project-head"><div><span className="eyebrow">ACTIVE PROJECT</span><h2>{p.name}</h2><p>{p.type} · {p.city}</p></div><div className={`score ${score>=85?'good':'bad'}`}><b>{score}</b><span>/100</span><small>{scoreStatus(score)}</small></div></div>
        <nav className="tabs">{['overview','research','media','design','qa','sales'].map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t.toUpperCase()}</button>)}</nav>

        {tab==='overview'&&<div className="grid2">
          <Panel title="Hard gates"><Gate ok={p.registryStatus!=='LIVE_DEMO'&&!String(p.registryStatus).startsWith('SKIPPED')} label="Registry / dedupe" value={p.registryStatus}/><Gate ok={p.operatingStatus==='RADI'} label="Status rada" value={p.operatingStatus}/><Gate ok={p.hasOwnSite===false} label="Sopstveni sajt" value={p.hasOwnSite===false?'NEMA':'IMA / NEPOZNATO'}/><div className={`decision ${gate.pass?'good':'bad'}`}><b>{gate.pass?'GRADI':'NE GRADI'}</b><span>{gate.pass?'Hard gateovi prolaze':gate.reasons.join(' · ')}</span></div></Panel>
          <Panel title="Live eligibility"><Metric label="Premium Score" value={`${score}/100`}/><Metric label="Mapa" value={p.mapConfirmed?'POTVRĐENA':'NIJE POTVRĐENA'}/><Metric label="QA" value={eligibility.pass?'PROŠAO':'BLOKIRAN'}/><Metric label="Booking opportunity" value={book}/>{!eligibility.pass&&<ul className="reasons">{eligibility.reasons.map(r=><li key={r}>{r}</li>)}</ul>}</Panel>
          <Panel title="Readiness"><Metric label="Content" value={p.contentReadiness}/><Metric label="Photo" value={p.photoReadiness}/><Metric label="Menu" value={p.menuReadiness}/><Metric label="Conversion" value={p.conversionReadiness}/></Panel>
          <Panel title="Output"><Metric label="Repo folder" value={`preporuke/${p.slug||'slug'}/index.html`}/><Metric label="Registry" value="data/preporuke-registry.csv"/><Metric label="Live URL" value={p.liveUrl||'NIJE LIVE'}/></Panel>
        </div>}

        {tab==='research'&&<div className="grid2"><Panel title="Identitet i gateovi"><Field label="Naziv" value={p.name} onChange={v=>patch({name:v})}/><Field label="Grad" value={p.city} onChange={v=>patch({city:v})}/><Field label="Tip" value={p.type} onChange={v=>patch({type:v})}/><Field label="Telefon" value={p.phone||''} onChange={v=>patch({phone:v})}/><Select label="Status rada" value={p.operatingStatus} options={['RADI','PRIVREMENO ZATVORENO','TRAJNO ZATVORENO','NEPOZNATO']} onChange={v=>patch({operatingStatus:v})}/><Select label="Ima svoj sajt" value={String(p.hasOwnSite)} options={['false','true']} onChange={v=>patch({hasOwnSite:v==='true'})}/></Panel><Panel title="Readiness"><Select label="Lead ocjena" value={p.grade} options={['A','B','C','D','PRESKOČITI']} onChange={v=>patch({grade:v})}/><Select label="Content" value={p.contentReadiness} options={['READY','PARTIAL','NONE']} onChange={v=>patch({contentReadiness:v})}/><Select label="Photo" value={p.photoReadiness} options={['STRONG','MEDIUM','WEAK']} onChange={v=>patch({photoReadiness:v})}/><Select label="Menu" value={p.menuReadiness} options={['FULL','PARTIAL','NONE']} onChange={v=>patch({menuReadiness:v})}/><Select label="Conversion" value={p.conversionReadiness} options={['READY','PARTIAL','NONE']} onChange={v=>patch({conversionReadiness:v})}/><Field label="Glavni prodajni ugao" value={p.salesAngle||''} onChange={v=>patch({salesAngle:v})}/></Panel></div>}

        {tab==='media'&&<div className="grid2"><Panel title="Media Studio"><label className="drop"><input type="file" multiple accept="image/*" onChange={e=>addMedia(e.target.files)}/><b>DROP / UPLOAD MEDIA</b><span>Hero · Interior · Exterior · Product · People · Gallery</span></label><div className="media-grid">{(p.media||[]).map((m,i)=><div className="media-card" key={m.id}><img src={m.url} alt={m.name}/><select value={m.role} onChange={e=>patch({media:p.media.map((x,n)=>n===i?{...x,role:e.target.value}:x)})}><option>Hero</option><option>Interior</option><option>Exterior</option><option>Food/Product</option><option>People</option><option>Atmosphere</option><option>Location/View</option><option>Gallery</option></select><small>{m.name}</small></div>)}</div></Panel><Panel title="Media-directed rebuild"><Metric label="Uploaded" value={(p.media||[]).length}/><Metric label="Photo readiness" value={p.photoReadiness}/><p>Dodavanje boljih fotografija treba da promijeni hero, cropove, galeriju i art direction - ne samo src.</p><button className="btn primary wide" onClick={()=>patch({stage:'DESIGN',mediaRebuildRequested:true})}>REBUILD USING NEW MEDIA</button></Panel></div>}

        {tab==='design'&&<div className="grid2"><Panel title="Design DNA">{[['heroType','Hero type'],['navigationType','Navigation'],['mainGrid','Grid'],['typographyPersonality','Typography'],['galleryType','Gallery'],['ctaType','CTA'],['signatureComponent','Signature element'],['sectionOrder','Section order']].map(([k,l])=><Field key={k} label={l} value={p.designDna?.[k]||''} onChange={v=>patchNested('designDna',{[k]:v})}/>)}</Panel><Panel title="Anti-template"><p className="quote">Sajt mora djelovati kao proizvod napravljen baš za ovaj objekat.</p><Field label="WE ARE" value={p.designDna?.weAre||''} onChange={v=>patchNested('designDna',{weAre:v})}/><Field label="WE ARE NOT" value={p.designDna?.weAreNot||''} onChange={v=>patchNested('designDna',{weAreNot:v})}/><p>Signature element je hard requirement za LIVE eligibility.</p></Panel></div>}

        {tab==='qa'&&<div className="grid2"><Panel title="QA hard gates">{qaKeys.map(k=><label className="check" key={k}><input type="checkbox" checked={!!p.qa?.[k]} onChange={e=>patchNested('qa',{[k]:e.target.checked})}/><span>{k}</span><b>{p.qa?.[k]?'PROŠAO':'NIJE PROŠAO'}</b></label>)}</Panel><Panel title="Premium Score">{Object.entries({artDirection:20,photography:15,content:15,typography:10,layout:10,mobile:10,conversion:5,accessibility:5,performance:5,technical:5}).map(([k,max])=><label className="range" key={k}><span>{k} / {max}</span><input type="range" min="0" max={max} value={p.scores?.[k]||0} onChange={e=>patchNested('scores',{[k]:Number(e.target.value)})}/><b>{p.scores?.[k]||0}</b></label>)}</Panel></div>}

        {tab==='sales'&&<div className="grid2"><Panel title="Sales approval"><Select label="Kontakt status" value={p.contactStatus||'READY'} options={['READY','APPROVED','SENT','REPLIED','INTERESTED','WON','LOST']} onChange={v=>patch({contactStatus:v})}/><button className="btn primary wide" onClick={()=>patch({contactStatus:'APPROVED'})}>APPROVE CONTACT</button><p>Ništa se ne šalje dok provider stvarno ne potvrdi slanje.</p></Panel>{accommodationType(p.type)&&<Panel title="Accommodation booking upsell"><Metric label="Opportunity" value={book}/><p>Apps Script + Sheets booking sistem se ne gradi prije eksplicitnog approvala.</p><button className="btn ghost wide" onClick={()=>patch({bookingApproval:!p.bookingApproval})}>{p.bookingApproval?'BOOKING APPROVED':'APPROVE BOOKING BUILD'}</button></Panel>}</div>}
      </section>
    </main>
  </div>
}

function Panel({title,children}){return <article className="panel"><h3>{title}</h3>{children}</article>}
function Gate({ok,label,value}){return <div className="gate"><i className={ok?'good':'bad'}>{ok?'✓':'×'}</i><span><b>{label}</b><small>{value}</small></span></div>}
function Metric({label,value}){return <div className="metric"><span>{label}</span><b>{value||'—'}</b></div>}
function Field({label,value,onChange}){return <label className="field"><span>{label}</span><input value={value??''} onChange={e=>onChange(e.target.value)}/></label>}
function Select({label,value,onChange,options}){return <label className="field"><span>{label}</span><select value={value??''} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select></label>}
