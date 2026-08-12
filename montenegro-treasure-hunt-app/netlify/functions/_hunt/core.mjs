import crypto from 'node:crypto';
import { seedPayload } from './seed-data.mjs';

const DEFAULT_ADMIN_EMAIL = 'office.hive.me@gmail.com';
const DEFAULT_ADMIN_PASSWORD_HASH = '099aa6fd4d54266f47d64a52fe8c7b19e8f7d151716fa753302574a90db8b813';
const DEFAULT_TOKEN_PEPPER = 'mth-sindikat-treasure-hunt-2026-prod-stable-pepper-v1';

const HOUR=3600_000, DAY=86400_000;
const nowIso=()=>new Date().toISOString();
const addMs=(ms)=>new Date(Date.now()+ms).toISOString();
const randomId=()=>crypto.randomUUID();
const randomToken=(bytes=32)=>crypto.randomBytes(bytes).toString('base64url');
const sha256=(value)=>crypto.createHash('sha256').update(String(value)).digest('hex');
const normalizeAnswer=(value)=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const hashToken=(value,pepper)=>sha256(`${pepper}:${String(value)}`);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const clean=(v,max=200)=>String(v??'').trim().slice(0,max);
const isIso=(v)=>!v||(!Number.isNaN(Date.parse(v))&&new Date(v).toISOString()===new Date(v).toISOString());
const parseCookies=(header='')=>Object.fromEntries(header.split(';').map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.indexOf('=');return i<0?['','']:[decodeURIComponent(x.slice(0,i)),decodeURIComponent(x.slice(i+1))]}).filter(([k])=>k));
const cookie=(name,value,{maxAge=0}={})=>`${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/hunt; HttpOnly; SameSite=Strict; Secure; Max-Age=${maxAge}`;
const codeHint=(code)=>{const p=String(code).split('-');return p.length>=3?`${p[0]}-••••-${p.at(-1)}`:`••••${String(code).slice(-4)}`};
function makeVoucherCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const block=()=>Array.from({length:4},()=>chars[crypto.randomInt(chars.length)]).join('');return `MTH-${block()}-${block()}`}
function haversine(a,b){const R=6371000,toRad=d=>d*Math.PI/180,dLat=toRad(b.lat-a.lat),dLng=toRad(b.lng-a.lng);const q=Math.sin(dLat/2)**2+Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.sqrt(q))}
function json(status,data,headers={}){return {statusCode:status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'same-origin',...headers},body:JSON.stringify(data)}}
function fail(status,message,details){return json(status,{error:message,...(details?{details}:{})})}

const seededTours=seedPayload.tours.map(meta=>({
  ...structuredClone(meta),
  id:meta.id,
  slug:meta.id,
  published:Boolean(meta.published),
  updatedAt:seedPayload.releasedAt,
  case:structuredClone(seedPayload.cases[meta.caseId])
}));
const seedById=new Map(seededTours.map(t=>[t.id,t]));

async function keys(store,prefix){return (await store.list(prefix)).sort()}
async function objects(store,prefix){const ks=await keys(store,prefix);return (await Promise.all(ks.map(k=>store.get(k)))).filter(Boolean)}
async function getTour(store,id,{drafts=false}={}){const base=seedById.get(id);if(!base)return null;const override=await store.get(`tour/${id}`);const tour=override?{...structuredClone(base),...override,case:override.case||structuredClone(base.case)}:structuredClone(base);return drafts||tour.published?tour:null}
async function listTours(store,{drafts=false}={}){const out=[];for(const t of seededTours){const v=await getTour(store,t.id,{drafts});if(v)out.push(v)}return out.sort((a,b)=>String(a.city).localeCompare(String(b.city),'sr'))}
function validateTourPayload(current,input){
  const meta={...(input.meta||{})};const c=structuredClone(input.case||current.case);
  if(!clean(meta.city||current.city,80))throw new Error('Grad je obavezan.');
  if(!clean(meta.title||current.title,140))throw new Error('Naziv ture je obavezan.');
  if(!c||!Array.isArray(c.checkpoints)||c.checkpoints.length<1)throw new Error('Tura mora imati najmanje jednu stanicu.');
  const ids=new Set();
  c.checkpoints=c.checkpoints.map((cp,i)=>{
    const id=clean(cp.id,100)||`cp-${i+1}`;if(ids.has(id))throw new Error(`Dupliran ID stanice: ${id}`);ids.add(id);
    const lat=Number(cp.lat),lng=Number(cp.lng),radius=Number(cp.radius),points=Number(cp.points);
    if(!Number.isFinite(lat)||lat<-90||lat>90||!Number.isFinite(lng)||lng<-180||lng>180)throw new Error(`Neispravne koordinate stanice ${i+1}.`);
    if(!Number.isFinite(radius)||radius<10||radius>500)throw new Error(`Radijus stanice ${i+1} mora biti 10-500 m.`);
    if(!['text','choice'].includes(cp.type))throw new Error(`Neispravan tip pitanja na stanici ${i+1}.`);
    if(cp.type==='choice'&&(!Array.isArray(cp.options)||cp.options.length<2))throw new Error(`Stanica ${i+1} mora imati najmanje 2 opcije.`);
    if(cp.answer===undefined||cp.answer===null||String(cp.answer).trim()==='')throw new Error(`Stanica ${i+1} nema odgovor.`);
    return {...cp,id,lat,lng,radius,points:Number.isFinite(points)?clamp(points,0,10000):100};
  });
  return {...current,...meta,id:current.id,slug:current.slug,published:Boolean(input.published??current.published),contentVersion:clean(input.contentVersion||meta.contentVersion||current.contentVersion,40)||'1.0.0',case:c,updatedAt:nowIso()};
}
function cfg(env){return {
  pepper:env.MTH_TOKEN_PEPPER||env.TOKEN_PEPPER||DEFAULT_TOKEN_PEPPER,
  adminEmail:(env.MTH_ADMIN_EMAIL||env.ADMIN_EMAIL||DEFAULT_ADMIN_EMAIL).trim().toLowerCase(),
  adminPasswordHash:(env.MTH_ADMIN_PASSWORD_HASH||DEFAULT_ADMIN_PASSWORD_HASH).trim().toLowerCase(),
  integrationKey:env.MTH_INTEGRATION_API_KEY||env.INTEGRATION_API_KEY||'',
  testVoucher:String(env.MTH_ENABLE_TEST_VOUCHER||'false').toLowerCase()==='true',
  origin:env.URL||env.DEPLOY_PRIME_URL||'https://sindikatevents.me'
}}
function configProblem(c){
  const x=[];
  if(c.pepper.length<24)x.push('MTH_TOKEN_PEPPER');
  if(!c.adminEmail)x.push('MTH_ADMIN_EMAIL');
  if(!/^[a-f0-9]{64}$/.test(c.adminPasswordHash))x.push('MTH_ADMIN_PASSWORD_HASH');
  return x;
}
function passwordMatches(input,c){
  const incomingHash=sha256(String(input||''));
  try{
    return crypto.timingSafeEqual(
      Buffer.from(incomingHash,'hex'),
      Buffer.from(c.adminPasswordHash,'hex')
    );
  }catch{
    return false;
  }
}
async function requireAdmin(store,c,headers){const raw=parseCookies(headers.cookie||headers.Cookie||'').mth_admin;if(!raw)return null;const h=hashToken(raw,c.pepper);const s=await store.get(`admin-session/${h}`);if(!s||s.expiresAt<=nowIso()){if(s)await store.delete(`admin-session/${h}`);return null}return {id:'env-admin',email:c.adminEmail,role:'admin'}}
async function requireAccess(store,c,headers){const a=String(headers.authorization||headers.Authorization||'');if(!a.startsWith('Bearer '))return null;const raw=a.slice(7);const h=hashToken(raw,c.pepper);const x=await store.get(`access-token/${h}`);if(!x||x.expiresAt<=nowIso()){if(x)await store.delete(`access-token/${h}`);return null}return {...x,tokenHash:h}}
function clientIp(headers={}){return String(headers['x-nf-client-connection-ip']||headers['x-forwarded-for']||headers['client-ip']||'unknown').split(',')[0].trim()}
async function allowRate(store,key,max,windowMs){const bucket=Math.floor(Date.now()/windowMs);const k=`rate/${key}/${bucket}`;const current=await store.get(k)||{count:0,expiresAt:addMs(windowMs*2)};if(current.count>=max)return false;current.count+=1;await store.set(k,current);return true}
async function addEvent(store,sessionId,type,payload){const stamp=nowIso();await store.set(`event/${sessionId}/${stamp}-${randomId()}`,{type,payload,createdAt:stamp})}
async function listEvents(store,sessionId){const all=await objects(store,`event/${sessionId}/`);return all.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,100)}
async function listSessions(store){const all=await objects(store,'session/');const out=[];for(const s of all){const t=await getTour(store,s.tourId,{drafts:true});out.push({...s,city:t?.city||'',tourTitle:t?.title||''})}return out.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))}
async function getSessionFor(store,publicId,accessId=null){const s=await store.get(`session/${publicId}`);return s&&(!accessId||s.accessId===accessId)?s:null}
async function saveSession(store,s){s.updatedAt=nowIso();await store.set(`session/${s.publicId}`,s);return s}

async function createVoucherRecord(store,c,input){
  const allIds=new Set(seededTours.map(t=>t.id));
  const allowed=[...new Set(Array.isArray(input.allowedTourIds)?input.allowedTourIds:[])].filter(id=>allIds.has(id));
  const assigned=input.assignedTourId||null;
  if(assigned&&!allIds.has(assigned))return {response:fail(400,'Fiksna tura ne postoji.')};
  if(assigned&&!allowed.includes(assigned))allowed.push(assigned);
  if(!allowed.length)return {response:fail(400,'Izaberite najmanje jednu dostupnu turu.')};
  const value=Number(input.value),maxPlayers=Number(input.maxPlayers);
  if(!Number.isFinite(value)||value<0||value>100000)return {response:fail(400,'Vrijednost vaučera nije ispravna.')};
  if(!Number.isInteger(maxPlayers)||maxPlayers<1||maxPlayers>50)return {response:fail(400,'Broj igrača mora biti 1-50.')};
  const expiresAt=input.expiresAt||null;
  if(expiresAt&&(!isIso(expiresAt)||expiresAt<=nowIso()))return {response:fail(400,'Rok važenja mora biti u budućnosti.')};
  const externalRef=clean(input.externalRef,160)||null;
  if(externalRef){const existing=await store.get(`voucher-ref/${sha256(externalRef.toLowerCase())}`);if(existing)return {response:fail(409,'Vaučer za ovu referencu prodaje već postoji.')}}
  let code=clean(input.code,40).toUpperCase()||makeVoucherCode(),codeHash=hashToken(code,c.pepper);
  for(let i=0;i<10&&await store.get(`voucher-code/${codeHash}`);i++){code=makeVoucherCode();codeHash=hashToken(code,c.pepper)}
  if(await store.get(`voucher-code/${codeHash}`))return {response:fail(500,'Nije moguće generisati jedinstven kod.')};
  const id=randomId(),stamp=nowIso();
  const voucher={id,code_hint:codeHint(code),label:clean(input.label,120)||'Montenegro Treasure Hunt vaučer',value:Number(value.toFixed(2)),max_players:maxPlayers,allowedTourIds:allowed,assignedTourId:assigned,externalRef,status:'active',isTest:false,expires_at:expiresAt,redeemed_at:null,created_at:stamp,updated_at:stamp};
  await Promise.all([store.set(`voucher/${id}`,voucher),store.set(`voucher-code/${codeHash}`,{voucherId:id}),externalRef?store.set(`voucher-ref/${sha256(externalRef.toLowerCase())}`,{voucherId:id}):Promise.resolve()]);
  return {voucher:{...voucher,code}};
}

export function createApi({store,env=process.env}){
  const c=cfg(env);
  return async function handle({method='GET',path='/',headers={},body={}}){
    try{
      const p=path;
      if(p==='/api/health')return json(200,{ok:true,time:nowIso(),version:'2.0.0-netlify',storage:'netlify-blobs',configured:configProblem(c).length===0,missing:configProblem(c),devMode:c.testVoucher});
      if(configProblem(c).length)return fail(503,'Aplikacija nije završila produkciono podešavanje.',configProblem(c));

      if(p==='/api/admin/login'&&method==='POST'){
        const email=clean(body.email,200).toLowerCase();
        const validCredentials=email===c.adminEmail&&passwordMatches(body.password,c);

        // Tačan login se nikad ne blokira zbog prethodnih neuspjelih pokušaja.
        // Rate limit se računa samo kada su kredencijali pogrešni.
        if(!validCredentials){
          if(!await allowRate(store,`login:${clientIp(headers)}`,10,15*60_000)){
            return fail(429,'Previše pogrešnih pokušaja. Pokušajte kasnije.');
          }
          return fail(401,'Pogrešan email ili lozinka.');
        }

        const raw=randomToken(),h=hashToken(raw,c.pepper);
        await store.set(`admin-session/${h}`,{
          email:c.adminEmail,
          expiresAt:addMs(12*HOUR),
          createdAt:nowIso()
        });
        return json(
          200,
          {admin:{id:'env-admin',email:c.adminEmail,role:'admin'}},
          {'set-cookie':cookie('mth_admin',raw,{maxAge:12*3600})}
        );
      }
      if(p==='/api/admin/logout'&&method==='POST'){
        const raw=parseCookies(headers.cookie||headers.Cookie||'').mth_admin;if(raw)await store.delete(`admin-session/${hashToken(raw,c.pepper)}`);
        return json(200,{ok:true},{'set-cookie':cookie('mth_admin','',{maxAge:0})});
      }
      if(p.startsWith('/api/admin/')){
        const a=await requireAdmin(store,c,headers);if(!a)return fail(401,'Potrebna je admin prijava.');
        if(p==='/api/admin/me'&&method==='GET')return json(200,{admin:a});
        if(p==='/api/admin/dashboard'&&method==='GET'){
          const [tours,vouchers,sessions]=await Promise.all([listTours(store,{drafts:true}),objects(store,'voucher/'),listSessions(store)]);
          return json(200,{stats:{tours:tours.length,publishedTours:tours.filter(x=>x.published).length,activeVouchers:vouchers.filter(x=>x.status==='active'&&(!x.expires_at||x.expires_at>nowIso())).length,usedVouchers:vouchers.filter(x=>x.status==='used').length,activeSessions:sessions.filter(x=>x.status==='active').length,completedSessions:sessions.filter(x=>x.status==='completed').length}});
        }
        if(p==='/api/admin/tours'&&method==='GET')return json(200,{tours:await listTours(store,{drafts:true})});
        if(p==='/api/admin/vouchers'&&method==='GET')return json(200,{vouchers:(await objects(store,'voucher/')).sort((x,y)=>y.created_at.localeCompare(x.created_at))});
        if(p==='/api/admin/sessions'&&method==='GET')return json(200,{sessions:await listSessions(store)});
        if(p==='/api/admin/vouchers'&&method==='POST'){const made=await createVoucherRecord(store,c,body);return made.response||json(201,{voucher:made.voucher});}
        let m=p.match(/^\/api\/admin\/tours\/([^/]+)$/);
        if(m&&method==='GET'){const t=await getTour(store,m[1],{drafts:true});return t?json(200,{tour:t}):fail(404,'Tura nije pronađena.');}
        if(m&&method==='PUT'){const t=await getTour(store,m[1],{drafts:true});if(!t)return fail(404,'Tura nije pronađena.');const updated=validateTourPayload(t,body);await store.set(`tour/${t.id}`,updated);return json(200,{tour:updated});}
        m=p.match(/^\/api\/admin\/tours\/([^/]+)\/preview$/);
        if(m&&method==='POST'){const t=await getTour(store,m[1],{drafts:true});if(!t)return fail(404,'Tura nije pronađena.');const raw=randomToken(),h=hashToken(raw,c.pepper);await store.set(`access-token/${h}`,{id:randomId(),allowedTourIds:[t.id],selectedTourId:t.id,maxPlayers:12,isTest:true,expiresAt:addMs(8*HOUR),createdAt:nowIso()});return json(201,{token:raw,tourId:t.id,url:`${c.origin}/hunt/?access=${encodeURIComponent(raw)}`});}
        m=p.match(/^\/api\/admin\/vouchers\/([^/]+)\/status$/);
        if(m&&method==='PATCH'){const v=await store.get(`voucher/${m[1]}`);if(!v)return fail(404,'Vaučer nije pronađen.');if(!['active','disabled'].includes(body.status))return fail(400,'Status nije dozvoljen.');v.status=body.status;v.updated_at=nowIso();await store.set(`voucher/${v.id}`,v);return json(200,{ok:true});}
        m=p.match(/^\/api\/admin\/sessions\/([^/]+)\/reset$/);
        if(m&&method==='POST'){const sessions=await listSessions(store);const s=sessions.find(x=>x.id===m[1]);if(!s)return fail(404,'Sesija nije pronađena.');Object.assign(s,{status:'active',checkpointIndex:0,score:0,hints:[],wrongAnswers:0,evidence:[],sidequests:[],lastPosition:null,startedAt:nowIso(),completedAt:null});await saveSession(store,s);for(const k of await keys(store,`event/${s.id}/`))await store.delete(k);return json(200,{session:s});}
        m=p.match(/^\/api\/admin\/sessions\/([^/]+)$/);
        if(m&&method==='GET'){const s=await getSessionFor(store,m[1])||(await listSessions(store)).find(x=>x.id===m[1]);return s?json(200,{session:s,events:await listEvents(store,s.id)}):fail(404,'Sesija nije pronađena.');}
      }

      if(p==='/api/integrations/vouchers'&&method==='POST'){
        if(!await allowRate(store,`integration:${clientIp(headers)}`,120,60*60_000))return fail(429,'Previše integracionih zahtjeva.');
        if(!c.integrationKey)return fail(503,'Integracioni API nije uključen.');
        if(headers['x-mth-api-key']!==c.integrationKey)return fail(401,'Nevažeći integracioni ključ.');
        if(!body.externalRef)return fail(400,'externalRef je obavezan.');
        const made=await createVoucherRecord(store,c,{...body,allowedTourIds:body.allowedTourIds?.length?body.allowedTourIds:seededTours.map(t=>t.id)});
        return made.response||json(201,{voucher:made.voucher});
      }
      if(p==='/api/player/redeem'&&method==='POST'){
        if(!await allowRate(store,`redeem:${clientIp(headers)}`,20,15*60_000))return fail(429,'Previše pokušaja unosa koda. Pokušajte kasnije.');
        const code=clean(body.code,60).toUpperCase();if(!code)return fail(400,'Unesite vaučer kod.');
        if(c.testVoucher&&code==='MTH-TEST-ALL'){const raw=randomToken(),h=hashToken(raw,c.pepper),access={id:randomId(),allowedTourIds:seededTours.map(t=>t.id),selectedTourId:null,maxPlayers:12,isTest:true,expiresAt:addMs(DAY),createdAt:nowIso()};await store.set(`access-token/${h}`,access);return json(200,{token:raw,...access});}
        const lookup=await store.get(`voucher-code/${hashToken(code,c.pepper)}`);if(!lookup)return fail(400,'Vaučer nije pronađen.');const v=await store.get(`voucher/${lookup.voucherId}`);if(!v)return fail(400,'Vaučer nije pronađen.');
        if(v.status!=='active')return fail(400,v.status==='used'?'Ovaj vaučer je već aktiviran.':'Vaučer nije aktivan.');if(v.expires_at&&v.expires_at<=nowIso()){v.status='expired';v.updated_at=nowIso();await store.set(`voucher/${v.id}`,v);return fail(400,'Vaučer je istekao.');}
        const raw=randomToken(),h=hashToken(raw,c.pepper),access={id:randomId(),voucherId:v.id,allowedTourIds:v.assignedTourId?[v.assignedTourId]:v.allowedTourIds,selectedTourId:v.assignedTourId||null,maxPlayers:v.max_players,isTest:false,expiresAt:v.expires_at||addMs(30*DAY),createdAt:nowIso()};v.status='used';v.redeemed_at=nowIso();v.updated_at=nowIso();await store.set(`voucher/${v.id}`,v);await store.set(`access-token/${h}`,access);return json(200,{token:raw,...access});
      }
      if(p.startsWith('/api/player/')){
        const a=await requireAccess(store,c,headers);if(!a)return fail(401,'Pristup je istekao ili nije važeći.');
        if(p==='/api/player/access'&&method==='GET'){const tours=[];for(const id of a.allowedTourIds){const t=await getTour(store,id,{drafts:a.isTest});if(t)tours.push(t)}const publicId=await store.get(`active-session/${a.id}`);const activeSession=publicId?await getSessionFor(store,publicId,a.id):null;const {tokenHash,...safeAccess}=a;return json(200,{access:safeAccess,tours,activeSession:activeSession?.status==='active'?activeSession:null});}
        if(p==='/api/player/select-tour'&&method==='POST'){if(!a.allowedTourIds.includes(body.tourId))return fail(400,'Tura nije dozvoljena.');if(a.selectedTourId&&a.selectedTourId!==body.tourId)return fail(400,'Vaučer je već vezan za drugu turu.');a.selectedTourId=body.tourId;await store.set(`access-token/${a.tokenHash}`,Object.fromEntries(Object.entries(a).filter(([k])=>k!=='tokenHash')));const t=await getTour(store,body.tourId,{drafts:a.isTest});return json(200,{tour:t});}
        if(p==='/api/player/sessions'&&method==='POST'){
          const tourId=a.selectedTourId||body.tourId;if(!tourId||!a.allowedTourIds.includes(tourId))return fail(400,'Tura nije dozvoljena ovim vaučerom.');const t=await getTour(store,tourId,{drafts:a.isTest});if(!t)return fail(400,'Tura nije dostupna.');
          const currentId=await store.get(`active-session/${a.id}`);if(currentId){const existing=await getSessionFor(store,currentId,a.id);if(existing&&existing.status==='active')return json(201,{session:existing,tour:t})}
          const playerCount=clamp(Math.floor(Number(body.playerCount)||1),1,a.maxPlayers);const mode=body.mode==='test'&&a.isTest?'test':'live';const stamp=nowIso();const s={id:randomId(),publicId:randomToken(10),accessId:a.id,tourId,crewName:clean(body.crewName,60)||'Posada',captainName:clean(body.captainName,60)||'Kapetan',playerCount,mode,status:'active',checkpointIndex:0,score:0,hints:[],wrongAnswers:0,evidence:[],sidequests:[],lastPosition:null,startedAt:stamp,updatedAt:stamp,completedAt:null};
          if(!a.selectedTourId){a.selectedTourId=tourId;await store.set(`access-token/${a.tokenHash}`,Object.fromEntries(Object.entries(a).filter(([k])=>k!=='tokenHash')))}await saveSession(store,s);await store.set(`active-session/${a.id}`,s.publicId);await addEvent(store,s.id,'session.started',{mode,crewName:s.crewName});return json(201,{session:s,tour:t});
        }
        let m=p.match(/^\/api\/player\/sessions\/([^/]+)$/);
        if(m&&method==='GET'){const s=await getSessionFor(store,m[1],a.id);return s?json(200,{session:s,tour:await getTour(store,s.tourId,{drafts:a.isTest}),events:await listEvents(store,s.id)}):fail(404,'Sesija nije pronađena.');}
        if(m&&method==='PATCH'){const s=await getSessionFor(store,m[1],a.id);if(!s)return fail(404,'Sesija nije pronađena.');if(body.position){const p0=body.position,lat=Number(p0.lat),lng=Number(p0.lng),accuracy=Number(p0.accuracy);if(Number.isFinite(lat)&&lat>=-90&&lat<=90&&Number.isFinite(lng)&&lng>=-180&&lng<=180)s.lastPosition={lat,lng,accuracy:Number.isFinite(accuracy)&&accuracy>0?accuracy:null}}await saveSession(store,s);return json(200,{session:s});}
        m=p.match(/^\/api\/player\/sessions\/([^/]+)\/hint$/);
        if(m&&method==='POST'){const s=await getSessionFor(store,m[1],a.id);if(!s)return fail(404,'Sesija nije pronađena.');const t=await getTour(store,s.tourId,{drafts:a.isTest}),cp=t.case.checkpoints[s.checkpointIndex];if(!cp)return fail(400,'Nema aktivne stanice.');if(!s.hints.includes(s.checkpointIndex))s.hints.push(s.checkpointIndex);await saveSession(store,s);await addEvent(store,s.id,'checkpoint.hint',{checkpointIndex:s.checkpointIndex});return json(200,{hint:cp.hint,hints:s.hints});}
        m=p.match(/^\/api\/player\/sessions\/([^/]+)\/answer$/);
        if(m&&method==='POST'){
          const s=await getSessionFor(store,m[1],a.id);if(!s)return fail(404,'Sesija nije pronađena.');if(s.status!=='active')return fail(400,'Igra je već završena.');const t=await getTour(store,s.tourId,{drafts:a.isTest}),cp=t.case.checkpoints[s.checkpointIndex];if(!cp)return fail(400,'Nema aktivne stanice.');
          if(s.mode==='live'){
            const pos=body.position,lat=Number(pos?.lat),lng=Number(pos?.lng),accuracy=Number(pos?.accuracy);
            if(!Number.isFinite(lat)||!Number.isFinite(lng))return fail(400,'Potrebna je GPS pozicija.');
            if(!Number.isFinite(accuracy)||accuracy<=0||accuracy>150)return fail(400,'GPS signal nije dovoljno precizan. Sačekajte bolji signal.');
            const d=haversine({lat,lng},{lat:Number(cp.lat),lng:Number(cp.lng)});if(d>Number(cp.radius)+accuracy)return fail(400,`Još nijeste dovoljno blizu lokaciji (${Math.round(d)} m).`);s.lastPosition={lat,lng,accuracy};
          }
          const correct=cp.type==='choice'?Number(body.answer)===Number(cp.answer):[cp.answer,...(cp.accept||[])].map(normalizeAnswer).includes(normalizeAnswer(body.answer));
          const oldIdx=s.checkpointIndex;if(correct){if(!s.evidence.includes(cp.id))s.evidence.push(cp.id);s.score+=Math.max(0,Number(cp.points||100)-(s.hints.includes(oldIdx)?20:0));s.checkpointIndex+=1;if(s.checkpointIndex>=t.case.checkpoints.length){s.status='completed';s.completedAt=nowIso();await store.delete(`active-session/${a.id}`)}}else{s.wrongAnswers+=1;s.score=Math.max(0,s.score-5)}
          await saveSession(store,s);await addEvent(store,s.id,correct?'checkpoint.completed':'checkpoint.wrong',{checkpointIndex:oldIdx,answer:clean(body.answer,200),points:correct?Number(cp.points||0):0});return json(200,{correct,feedback:correct?'Tačno - dokaz je otključan.':'Nije tačno. Pogledajte lokaciju još jednom.',evidence:correct?cp.evidence:null,session:s,finale:s.status==='completed'?t.case.finale:null});
        }
        m=p.match(/^\/api\/player\/sessions\/([^/]+)\/sidequest$/);
        if(m&&method==='POST'){const s=await getSessionFor(store,m[1],a.id);if(!s)return fail(404,'Sesija nije pronađena.');const t=await getTour(store,s.tourId,{drafts:a.isTest}),sq=(t.case.sidequests||[]).find(x=>x.id===body.sidequestId);if(!sq)return fail(404,'Bonus nije pronađen.');if(Number(sq.unlock||0)>s.checkpointIndex)return fail(400,'Bonus još nije otključan.');if(!s.sidequests.includes(sq.id)){s.sidequests.push(sq.id);s.score+=Number(sq.points||0);await saveSession(store,s);await addEvent(store,s.id,'sidequest.completed',{sidequestId:sq.id,points:Number(sq.points||0)})}return json(200,{session:s,result:sq.result});}
      }
      return fail(404,'API ruta nije pronađena.');
    }catch(e){console.error(e);return fail(500,env.CONTEXT==='production'?'Došlo je do greške.':e.message)}
  }
}

export function normalizeApiPath(rawPath=''){
  let p=rawPath.split('?')[0];
  p=p.replace(/^\/\.netlify\/functions\/hunt-api/,'');
  p=p.replace(/^\/hunt\/api/,'');
  if(!p.startsWith('/'))p='/'+p;
  return '/api'+(p==='/'?'':p);
}