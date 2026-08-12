import crypto from 'node:crypto';
import { getStore, getDeployStore } from '@netlify/blobs';
import { DEFAULT_CONFIG, DEFAULT_CONTENT } from './_hunt-event/defaults.mjs';

const STORE_NAME = 'podgorica-hunt-event-2026';
const REGISTRY_KEY = 'platform/programs-v1';
const DEFAULT_ADMIN_PASSWORD_HASH = '9552929bc70074eb42eeb96f7410edc32f02b4b16a197ff577f79142f23c4740';
const nowIso = () => new Date().toISOString();
const clean = (v, max=1000) => String(v ?? '').trim().slice(0,max);
const clamp = (n,min,max) => Math.max(min,Math.min(max,n));

function store(){
  const context=String(process.env.CONTEXT||process.env.NETLIFY_CONTEXT||'').toLowerCase();
  if(context && context!=='production') return getDeployStore(STORE_NAME);
  return getStore(STORE_NAME,{consistency:'strong'});
}
function json(status,data){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}})}
function expectedHash(){return (process.env.MTH_EVENT_ADMIN_PASSWORD_HASH||DEFAULT_ADMIN_PASSWORD_HASH).trim().toLowerCase()}
function requireAdmin(request){
  const password=request.headers.get('x-mth-admin-password')||'';
  if(!password)return false;
  const incoming=crypto.createHash('sha256').update(password).digest('hex');
  const expected=expectedHash();
  if(!/^[a-f0-9]{64}$/.test(expected))return false;
  try{return crypto.timingSafeEqual(Buffer.from(incoming,'hex'),Buffer.from(expected,'hex'))}catch{return false}
}
function programId(v){const id=clean(v,24).toUpperCase().replace(/\s+/g,'-');return /^[A-Z0-9][A-Z0-9_-]{1,23}$/.test(id)?id:''}
function metaKey(id){return `platform/program-meta/${id}`}
function contentKey(id){return `event/${id}/content`}
function configKey(id){return `event/${id}/config`}

async function registry(s){return await s.get(REGISTRY_KEY,{type:'json'}) || {version:1,defaultProgramId:'PG26',programs:[]}}
function findProgram(reg,id){return (reg.programs||[]).find((p)=>String(p.id).toUpperCase()===id)||null}
async function getConfig(s,p){return {...DEFAULT_CONFIG,name:p?.name||p?.id||'Program',...(await s.get(configKey(p.id),{type:'json'})||{})}}
async function getContent(s,id){const saved=await s.get(contentKey(id),{type:'json'});return saved?{...structuredClone(DEFAULT_CONTENT),...saved}:structuredClone(DEFAULT_CONTENT)}

const defaultExperience={
  eyebrow:'LIVE CITY MYSTERY',
  title:'Ten Letters That Never Arrived',
  synopsis:'Walk the city. Verify real places. Unlock a story that only makes sense when every fragment is placed in the right order.',
  briefingTitle:'They both said “I came.”',
  briefingLead:'A recovered case file contains fragments tied to one failed meeting. Your team must use the city itself to reconstruct what happened.',
  assignment:'Each field location unlocks one chronological story fragment. Physical routes rotate between teams, but the narrative always unfolds in the intended order.',
  centralQuestion:'How can two people keep the same promise, reach the same intended place at six, and never see each other?',
  archiveLabel:'CASE FILE',
  finalKicker:'FINAL FIELD LOCATION',
  finalTitle:'Take the solved story to one last place.',
  finalLead:'Your reconstruction is complete. The city still has one final piece of meaning to add.',
  finalContext:'Follow the final clue and close the case together.',
  endingKicker:'CASE CLOSED',
  endingTitle:'The story finally makes sense.',
  endingDeck:'Every field stop was evidence. Every fragment changed what the team could conclude.',
  endingBody:['You reached the final location and completed the investigation.','The route is finished, but the strongest result is the explanation your team built from real places and recovered evidence.'],
  safetyNote:'Stay on public pedestrian routes, obey crossings and traffic signals, and never enter restricted or unsafe areas.'
};
const defaultFinalPuzzle={
  title:'Build the only sequence that fits every fragment.',
  lead:'Use the recovered story to choose the only combination that explains all evidence.',
  failure:'The reconstruction still contradicts something in the case file. Compare the fragments again.',
  success:'Reconstruction holds. Take the solved case to the final physical location.',
  groups:[
    {id:'marko',label:"MARKO'S COPY",question:'Which appointment did Marko follow?',options:[{value:'fri',label:'FRI 18 · 18:00'},{value:'sat',label:'SAT 19 · 18:00'}],correct:'fri'},
    {id:'ana',label:"ANA'S COPY",question:'Which appointment did Ana follow?',options:[{value:'fri',label:'FRI 18 · 18:00'},{value:'sat',label:'SAT 19 · 18:00'}],correct:'sat'},
    {id:'failure',label:'THE FAILED LINK',question:'What should have prevented the mistake?',options:[{value:'letter',label:'The correction letter'},{value:'tickets',label:'The train tickets'},{value:'bridge',label:'The river crossing'}],correct:'letter'}
  ]
};
function withExperience(content){return {...content,experience:{...defaultExperience,...(content?.experience||{})},finalPuzzle:{...defaultFinalPuzzle,...(content?.finalPuzzle||{}),groups:Array.isArray(content?.finalPuzzle?.groups)&&content.finalPuzzle.groups.length?content.finalPuzzle.groups:defaultFinalPuzzle.groups}}}
function validCoord(v,min,max){const n=Number(v);return Number.isFinite(n)&&n>=min&&n<=max}
function contentChecks(contentRaw){
  const content=withExperience(contentRaw||{}); const errors=[]; const warnings=[];
  const cps=Array.isArray(content.checkpoints)?content.checkpoints:[]; const beats=Array.isArray(content.storyBeats)?content.storyBeats:[];
  if(cps.length<3||cps.length>20)errors.push({key:'route.count',label:'Ruta mora imati 3-20 stanica.'});
  if(beats.length!==cps.length)errors.push({key:'story.count',label:'Broj story beatova mora biti isti kao broj stanica.'});
  const ids=new Set();
  cps.forEach((cp,i)=>{
    const n=i+1; const id=clean(cp?.id,80);
    if(!id)errors.push({key:`cp.${i}.id`,label:`Stanica ${n}: nedostaje ID.`});
    else if(ids.has(id))errors.push({key:`cp.${i}.dup`,label:`Stanica ${n}: ID mora biti jedinstven.`}); else ids.add(id);
    if(!clean(cp?.name,120))errors.push({key:`cp.${i}.name`,label:`Stanica ${n}: nedostaje naziv.`});
    if(!validCoord(cp?.lat,-90,90)||!validCoord(cp?.lng,-180,180))errors.push({key:`cp.${i}.coord`,label:`Stanica ${n}: neispravne GPS koordinate.`});
    const radius=Number(cp?.radius); if(!Number.isFinite(radius)||radius<20||radius>300)warnings.push({key:`cp.${i}.radius`,label:`Stanica ${n}: preporučen GPS radius je 20-300 m.`});
    if(!clean(cp?.clue,1000))errors.push({key:`cp.${i}.clue`,label:`Stanica ${n}: nedostaje field clue.`});
    if(!clean(cp?.observation,1000))warnings.push({key:`cp.${i}.obs`,label:`Stanica ${n}: dodaj šta igrač treba fizički da pogleda.`});
    if(!clean(cp?.task,1000))errors.push({key:`cp.${i}.task`,label:`Stanica ${n}: nedostaje zadatak.`});
    if(cp?.type==='choice'){
      const opts=Array.isArray(cp?.options)?cp.options.filter((x)=>clean(x,200)):[]; const answer=Number(cp?.answer);
      if(opts.length<2)errors.push({key:`cp.${i}.opts`,label:`Stanica ${n}: choice zadatak mora imati najmanje 2 opcije.`});
      if(!Number.isInteger(answer)||answer<0||answer>=opts.length)errors.push({key:`cp.${i}.answer`,label:`Stanica ${n}: izaberi tačan odgovor.`});
    }else if(!clean(cp?.answerText,120))errors.push({key:`cp.${i}.answerText`,label:`Stanica ${n}: tekstualni zadatak mora imati tačan odgovor.`});
  });
  beats.forEach((b,i)=>{if(!clean(b?.title,160))errors.push({key:`beat.${i}.title`,label:`Story ${i+1}: nedostaje naslov.`});if(!clean(b?.quote,1500))errors.push({key:`beat.${i}.quote`,label:`Story ${i+1}: nedostaje glavni fragment.`});if(!clean(b?.establishes,1500))warnings.push({key:`beat.${i}.meaning`,label:`Story ${i+1}: dodaj šta fragment dokazuje.`})});
  if(!content.final||!clean(content.final.name,160)||!validCoord(content.final.lat,-90,90)||!validCoord(content.final.lng,-180,180))errors.push({key:'final.location',label:'Finale mora imati naziv i validne GPS koordinate.'});
  if(!clean(content.final?.clue,1200))errors.push({key:'final.clue',label:'Finale mora imati finalni clue.'});
  const exp=content.experience||{}; ['title','synopsis','briefingTitle','briefingLead','assignment','centralQuestion','endingTitle','endingDeck'].forEach(k=>{if(!clean(exp[k],2000))warnings.push({key:`experience.${k}`,label:`Experience: dopuni ${k}.`})});
  const groups=Array.isArray(content.finalPuzzle?.groups)?content.finalPuzzle.groups:[];
  if(!groups.length)errors.push({key:'puzzle.groups',label:'Finalna dedukcija mora imati najmanje jednu grupu pitanja.'});
  groups.forEach((g,i)=>{const opts=Array.isArray(g?.options)?g.options:[];if(!clean(g?.question,1000))errors.push({key:`puzzle.${i}.q`,label:`Finalno pitanje ${i+1}: nedostaje tekst.`});if(opts.length<2)errors.push({key:`puzzle.${i}.opts`,label:`Finalno pitanje ${i+1}: dodaj najmanje 2 odgovora.`});if(!opts.some((o)=>String(o?.value)===String(g?.correct)))errors.push({key:`puzzle.${i}.correct`,label:`Finalno pitanje ${i+1}: označi tačan odgovor.`})});
  return {content,errors,warnings};
}
function routeDistribution(teamCount,stopCount){const slots=Array.from({length:Math.max(1,stopCount)},(_,i)=>({startIndex:i,startNo:i+1,teams:[]}));for(let n=1;n<=teamCount;n++)slots[(n-1)%slots.length].teams.push(n);return slots}
async function readMeta(s,p,content){
  const saved=await s.get(metaKey(p.id),{type:'json'})||{}; const cps=content?.checkpoints||[];
  return {status:p.id==='PG26'?(saved.status||'live'):(saved.status||'draft'),difficulty:saved.difficulty||'medium',estimatedMinutes:clamp(Number(saved.estimatedMinutes)||120,30,480),language:saved.language||'sr',meetingPoint:saved.meetingPoint||'',supportContact:saved.supportContact||'',safetyNotes:saved.safetyNotes||'',internalNotes:saved.internalNotes||'',routeMode:'rotating',publishedAt:saved.publishedAt||null,updatedAt:saved.updatedAt||null,stopCount:cps.length,...saved};
}
async function qa(s,p){
  const content=await getContent(s,p.id); const checked=contentChecks(content); const config=await getConfig(s,p); const meta=await readMeta(s,p,checked.content); const errors=[...checked.errors]; const warnings=[...checked.warnings];
  const codes=Array.isArray(p.codes)?p.codes:[];
  if(!clean(p.name,120))errors.push({key:'program.name',label:'Program nema naziv.'});
  if(!clean(p.location,120))errors.push({key:'program.location',label:'Program nema grad/lokaciju.'});
  if(!Number.isFinite(Number(p.teamCount))||Number(p.teamCount)<1)errors.push({key:'program.teams',label:'Program mora imati najmanje 1 tim.'});
  if(codes.length!==Number(p.teamCount))errors.push({key:'program.codes',label:'Broj pristupnih kodova mora biti isti kao broj timova.'});
  if(new Set(codes.map((x)=>x.code)).size!==codes.length)errors.push({key:'program.codes.unique',label:'Pristupni kodovi moraju biti jedinstveni.'});
  if(!meta.safetyNotes)warnings.push({key:'meta.safety',label:'Dodaj safety napomenu za koordinatore i field test.'});
  if(!meta.meetingPoint)warnings.push({key:'meta.meeting',label:'Dodaj meeting point / assembly area.'});
  const stopCount=checked.content.checkpoints.length; const perStart=stopCount?Math.ceil(Number(p.teamCount||0)/stopCount):0;
  if(perStart>3)warnings.push({key:'route.capacity',label:`Do ${perStart} timova dijeli isti start. Za bolji flow ciljaj najviše 2-3.`});
  const baseChecks=14; const score=Math.max(0,Math.min(100,Math.round((1-Math.min(1,errors.length/baseChecks))*85 + (warnings.length?Math.max(0,15-warnings.length*2):15))));
  return {ready:errors.length===0,score,errors,warnings,route:{stopCount,teamCount:Number(p.teamCount||0),teamsPerStart:perStart,distribution:routeDistribution(Number(p.teamCount||0),stopCount)},config,meta,content:checked.content};
}

export default async function handler(request){
  const s=store();
  try{
    const url=new URL(request.url); const path=url.pathname.replace(/^\/\.netlify\/functions\/hunt-platform/,'').replace(/^\/hunt\/platform-api/,'')||'/';
    if(path==='/health')return json(200,{ok:true,service:'hunt-platform-v2'});
    if(!path.startsWith('/admin/'))return json(404,{error:'Not found.'});
    if(!requireAdmin(request))return json(401,{error:'Pogrešna admin lozinka.'});
    let body={}; if(!['GET','HEAD'].includes(request.method)){const raw=await request.text();if(raw)try{body=JSON.parse(raw)}catch{return json(400,{error:'Invalid JSON.'})}}
    const reg=await registry(s);
    if(path==='/admin/programs'&&request.method==='GET'){
      const rows=[];for(const p of reg.programs||[]){const q=await qa(s,p);rows.push({...p,meta:q.meta,qa:{ready:q.ready,score:q.score,errors:q.errors.length,warnings:q.warnings.length},stopCount:q.route.stopCount,teamsPerStart:q.route.teamsPerStart,eventOpen:Boolean(q.config.active),paused:Boolean(q.config.paused)})}return json(200,{ok:true,defaultProgramId:reg.defaultProgramId,programs:rows});
    }
    const m=path.match(/^\/admin\/programs\/([A-Z0-9_-]+)(?:\/(meta|content|qa|status|launch-pack))?$/i); if(!m)return json(404,{error:'Platform route not found.'});
    const id=programId(m[1]); const p=findProgram(reg,id); if(!p)return json(404,{error:'Program not found.'}); const section=m[2]||'';
    if(section==='meta'&&request.method==='GET'){return json(200,{ok:true,program:p,meta:await readMeta(s,p,await getContent(s,id))})}
    if(section==='meta'&&request.method==='PUT'){
      const current=await readMeta(s,p,await getContent(s,id)); const next={...current,difficulty:['easy','medium','hard'].includes(body.difficulty)?body.difficulty:current.difficulty,estimatedMinutes:clamp(Number(body.estimatedMinutes)||current.estimatedMinutes,30,480),language:clean(body.language,12)||current.language,meetingPoint:clean(body.meetingPoint,300),supportContact:clean(body.supportContact,300),safetyNotes:clean(body.safetyNotes,1500),internalNotes:clean(body.internalNotes,3000),updatedAt:nowIso()}; await s.setJSON(metaKey(id),next);return json(200,{ok:true,meta:next});
    }
    if(section==='content'&&request.method==='GET'){const content=withExperience(await getContent(s,id));return json(200,{ok:true,program:p,content})}
    if(section==='content'&&request.method==='PUT'){
      const checked=contentChecks(body.content);if(checked.errors.length)return json(400,{error:'Program content nije spreman za čuvanje.',errors:checked.errors,warnings:checked.warnings});const next=checked.content;next.version=clean(next.version,60)||`builder-${Date.now()}`;next.updatedAt=nowIso();await s.setJSON(contentKey(id),next);return json(200,{ok:true,content:next,warnings:checked.warnings});
    }
    if(section==='qa'&&request.method==='GET'){return json(200,{ok:true,program:p,...await qa(s,p)})}
    if(section==='status'&&request.method==='POST'){
      const wanted=clean(body.status,20).toLowerCase();if(!['draft','ready','live','archived'].includes(wanted))return json(400,{error:'Status mora biti draft, ready, live ili archived.'});const q=await qa(s,p);if(['ready','live'].includes(wanted)&&!q.ready)return json(409,{error:'Program nije prošao launch QA.',errors:q.errors,warnings:q.warnings});
      const meta={...q.meta,status:wanted,publishedAt:wanted==='live'?(q.meta.publishedAt||nowIso()):q.meta.publishedAt,updatedAt:nowIso()};await s.setJSON(metaKey(id),meta);
      const cfg={...q.config,active:wanted==='live',paused:false,updatedAt:nowIso()};await s.setJSON(configKey(id),cfg);
      const idx=(reg.programs||[]).findIndex((x)=>String(x.id).toUpperCase()===id);if(idx>=0){reg.programs[idx]={...reg.programs[idx],enabled:wanted!=='archived',updatedAt:nowIso()};await s.setJSON(REGISTRY_KEY,{...reg,updatedAt:nowIso()})}
      return json(200,{ok:true,status:wanted,meta,config:cfg});
    }
    if(section==='launch-pack'&&request.method==='GET'){
      const q=await qa(s,p);return json(200,{ok:true,generatedAt:nowIso(),program:{id:p.id,name:p.name,location:p.location,teamCount:p.teamCount,codes:p.codes,codePrefix:p.codePrefix},meta:q.meta,qa:{ready:q.ready,score:q.score,errors:q.errors,warnings:q.warnings},route:q.route,checklist:['Field-walk every checkpoint on the actual route','Verify GPS radius on at least two phones','Confirm every answer from what is visible on location','Check pedestrian safety and road crossings','Test one full route with mobile data enabled','Print/share access codes by team','Open Event Control only after staff briefing','Keep Live mapa open during the event','Have one coordinator ready for GPS unlock and team pause','After finish, archive/export results']});
    }
    return json(405,{error:'Method not allowed.'});
  }catch(error){console.error('hunt-platform',error);return json(500,{error:'Platform service unavailable.'})}
}
