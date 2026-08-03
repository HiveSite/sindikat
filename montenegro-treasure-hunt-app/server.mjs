import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, validateProductionConfig } from './src/config.mjs';
import {
  authenticateAdmin, createAdminSession, createGameSession, createPreviewAccess, createVoucher,
  dashboardStats, deleteAdminSession, getAccess, getAdminByToken, getSession, getTour,
  initializeDatabase, listGameEvents, listSessions, listTours, listVouchers, markHint,
  recordAnswer, recordSidequest, redeemVoucher, resetSession, selectTour, setVoucherStatus,
  updatePosition, updateTour
} from './src/db.mjs';
import { cookie, haversine, normalizeAnswer, nowIso, parseCookies } from './src/utils.mjs';

validateProductionConfig();
const init = initializeDatabase();
const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, 'public');
const rateBuckets=new Map();
function allowRate(key,max,windowMs){const now=Date.now();const b=rateBuckets.get(key);if(!b||b.reset<now){rateBuckets.set(key,{count:1,reset:now+windowMs});return true}if(b.count>=max)return false;b.count++;return true}
function clientIp(req){return String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',')[0].trim()}
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};

function securityHeaders() {
  return {
    'X-Content-Type-Options':'nosniff', 'X-Frame-Options':'DENY', 'Referrer-Policy':'same-origin',
    'Permissions-Policy':'geolocation=(self), camera=(self)',
    'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"
  };
}
function send(res,status,body,headers={}) { res.writeHead(status,{...securityHeaders(),...headers}); res.end(body); }
function json(res,status,data,headers={}) { send(res,status,JSON.stringify(data),{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}); }
function error(res,status,message,details) { json(res,status,{error:message,...(details?{details}: {})}); }
async function readJson(req) {
  const chunks=[]; let size=0;
  for await (const chunk of req) { size += chunk.length; if (size > config.maxBodyBytes) throw new Error('BODY_TOO_LARGE'); chunks.push(chunk); }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new Error('INVALID_JSON'); }
}
function bearer(req) { const h=req.headers.authorization||''; return h.startsWith('Bearer ')?h.slice(7):null; }
function admin(req) { return getAdminByToken(parseCookies(req.headers.cookie).mth_admin); }
function requireAdmin(req,res) { const a=admin(req); if(!a){error(res,401,'Potrebna je admin prijava.');return null;} return a; }
function access(req,res) { const a=getAccess(bearer(req)); if(!a){error(res,401,'Pristup je istekao ili nije važeći.');return null;} return a; }
function sessionFor(req,res,publicId,a) { const s=getSession(publicId,a.id); if(!s){error(res,404,'Sesija nije pronađena.');return null;} return s; }

async function api(req,res,url) {
  const p=url.pathname;
  try {
    if (p==='/api/health') return json(res,200,{ok:true,time:nowIso(),version:'1.0.0',devMode:!config.isProd});
    if (p==='/api/integrations/vouchers' && req.method==='POST') {
      if(!config.integrationApiKey) return error(res,503,'Integracioni API nije uključen.');
      if(req.headers['x-mth-api-key']!==config.integrationApiKey) return error(res,401,'Nevažeći integracioni ključ.');
      if(!allowRate(`integration:${clientIp(req)}`,120,60*60_000)) return error(res,429,'Previše integracionih zahtjeva.');
      const b=await readJson(req);
      if(!b.externalRef) return error(res,400,'externalRef je obavezan.');
      return json(res,201,{voucher:createVoucher(b,null)});
    }
    if (p==='/api/admin/login' && req.method==='POST') {
      if(!allowRate(`login:${clientIp(req)}`,10,15*60_000)) return error(res,429,'Previše pokušaja. Pokušajte kasnije.');
      const b=await readJson(req); const a=authenticateAdmin(b.email,b.password);
      if(!a) return error(res,401,'Pogrešan email ili lozinka.');
      const token=createAdminSession(a.id);
      return json(res,200,{admin:a},{'Set-Cookie':cookie('mth_admin',token,{path:config.basePath||'/',sameSite:'Strict',secure:config.isProd,maxAge:config.adminSessionHours*3600})});
    }
    if (p==='/api/admin/logout' && req.method==='POST') {
      const raw=parseCookies(req.headers.cookie).mth_admin; deleteAdminSession(raw);
      return json(res,200,{ok:true},{'Set-Cookie':cookie('mth_admin','',{path:config.basePath||'/',sameSite:'Strict',secure:config.isProd,maxAge:0})});
    }
    if (p==='/api/admin/me' && req.method==='GET') { const a=requireAdmin(req,res); if(!a)return; return json(res,200,{admin:a}); }
    if (p==='/api/admin/dashboard' && req.method==='GET') { const a=requireAdmin(req,res); if(!a)return; return json(res,200,{stats:dashboardStats()}); }
    if (p==='/api/admin/tours' && req.method==='GET') { const a=requireAdmin(req,res); if(!a)return; return json(res,200,{tours:listTours({includeDrafts:true})}); }
    if (p==='/api/admin/vouchers' && req.method==='GET') { const a=requireAdmin(req,res); if(!a)return; return json(res,200,{vouchers:listVouchers()}); }
    if (p==='/api/admin/vouchers' && req.method==='POST') { const a=requireAdmin(req,res); if(!a)return; const b=await readJson(req); return json(res,201,{voucher:createVoucher(b,a.id)}); }
    if (p==='/api/admin/sessions' && req.method==='GET') { const a=requireAdmin(req,res); if(!a)return; return json(res,200,{sessions:listSessions()}); }
    const adminTour=p.match(/^\/api\/admin\/tours\/([^/]+)$/);
    if (adminTour && req.method==='GET') { const a=requireAdmin(req,res); if(!a)return; const t=getTour(adminTour[1],{includeDrafts:true}); return t?json(res,200,{tour:t}):error(res,404,'Tura nije pronađena.'); }
    if (adminTour && req.method==='PUT') { const a=requireAdmin(req,res); if(!a)return; const b=await readJson(req); const t=updateTour(adminTour[1],b); return t?json(res,200,{tour:t}):error(res,404,'Tura nije pronađena.'); }
    const preview=p.match(/^\/api\/admin\/tours\/([^/]+)\/preview$/);
    if (preview && req.method==='POST') { const a=requireAdmin(req,res); if(!a)return; const x=createPreviewAccess(preview[1],a.id); return json(res,201,{...x,url:`${config.basePath}/?access=${encodeURIComponent(x.token)}`}); }
    const voucherStatus=p.match(/^\/api\/admin\/vouchers\/([^/]+)\/status$/);
    if(voucherStatus && req.method==='PATCH'){const a=requireAdmin(req,res);if(!a)return;const b=await readJson(req);setVoucherStatus(voucherStatus[1],b.status,a.id);return json(res,200,{ok:true});}
    const reset=p.match(/^\/api\/admin\/sessions\/([^/]+)\/reset$/);
    if(reset && req.method==='POST'){const a=requireAdmin(req,res);if(!a)return;const s=resetSession(reset[1],a.id);return s?json(res,200,{session:s}):error(res,404,'Sesija nije pronađena.');}
    const adminSession=p.match(/^\/api\/admin\/sessions\/([^/]+)$/);
    if(adminSession && req.method==='GET'){const a=requireAdmin(req,res);if(!a)return;const s=getSession(adminSession[1])||listSessions().find(x=>x.id===adminSession[1]);if(!s)return error(res,404,'Sesija nije pronađena.');return json(res,200,{session:s,events:listGameEvents(s.id)});}

    if (p==='/api/player/redeem' && req.method==='POST') { if(!allowRate(`redeem:${clientIp(req)}`,20,15*60_000))return error(res,429,'Previše pokušaja unosa koda. Pokušajte kasnije.'); const b=await readJson(req); const r=redeemVoucher(b.code); return r.error?error(res,400,r.error):json(res,200,r); }
    if (p==='/api/player/access' && req.method==='GET') { const a=access(req,res); if(!a)return; const tours=a.allowedTourIds.map(id=>getTour(id,{includeDrafts:a.isTest})).filter(Boolean); const active=listSessions().find(s=>s.accessId===a.id&&s.status==='active'); return json(res,200,{access:a,tours,activeSession:active||null}); }
    if (p==='/api/player/select-tour' && req.method==='POST') { const a=access(req,res); if(!a)return; const b=await readJson(req); const t=selectTour(a.id,b.tourId); if(!t||t.error)return error(res,400,t?.error||'Tura nije dozvoljena.'); return json(res,200,{tour:t}); }
    if (p==='/api/player/sessions' && req.method==='POST') { const a=access(req,res); if(!a)return; const b=await readJson(req); const s=createGameSession(a,b); return json(res,201,{session:s,tour:getTour(s.tourId,{includeDrafts:a.isTest})}); }
    const playerSession=p.match(/^\/api\/player\/sessions\/([^/]+)$/);
    if(playerSession && req.method==='GET'){const a=access(req,res);if(!a)return;const s=sessionFor(req,res,playerSession[1],a);if(!s)return;return json(res,200,{session:s,tour:getTour(s.tourId,{includeDrafts:a.isTest}),events:listGameEvents(s.id)});}
    if(playerSession && req.method==='PATCH'){const a=access(req,res);if(!a)return;const s=sessionFor(req,res,playerSession[1],a);if(!s)return;const b=await readJson(req);if(b.position)updatePosition(s,b.position);return json(res,200,{session:getSession(s.publicId,a.id)});}
    const hint=p.match(/^\/api\/player\/sessions\/([^/]+)\/hint$/);
    if(hint && req.method==='POST'){const a=access(req,res);if(!a)return;const s=sessionFor(req,res,hint[1],a);if(!s)return;const t=getTour(s.tourId,{includeDrafts:a.isTest});const cp=t.case.checkpoints[s.checkpointIndex];if(!cp)return error(res,400,'Nema aktivne stanice.');const hints=markHint(s,s.checkpointIndex);return json(res,200,{hint:cp.hint,hints});}
    const answer=p.match(/^\/api\/player\/sessions\/([^/]+)\/answer$/);
    if(answer && req.method==='POST'){
      const a=access(req,res);if(!a)return;const s=sessionFor(req,res,answer[1],a);if(!s)return;const b=await readJson(req);
      const t=getTour(s.tourId,{includeDrafts:a.isTest});const cp=t.case.checkpoints[s.checkpointIndex];if(!cp)return error(res,400,'Nema aktivne stanice.');
      if(s.mode==='live'){
        const pos=b.position;if(!pos||!Number.isFinite(pos.lat)||!Number.isFinite(pos.lng))return error(res,400,'Potrebna je GPS pozicija.');
        const d=haversine(pos,{lat:cp.lat,lng:cp.lng});const accuracy=Math.min(Number(pos.accuracy||999),150);
        if(accuracy>150||d>cp.radius+accuracy)return error(res,400,`Još nijeste dovoljno blizu lokaciji (${Math.round(d)} m).`);
      }
      let correct=false;
      if(cp.type==='choice') correct=Number(b.answer)===Number(cp.answer);
      else {const accepted=[cp.answer,...(cp.accept||[])].map(normalizeAnswer);correct=accepted.includes(normalizeAnswer(b.answer));}
      const evidence=[...s.evidence];let score=s.score;let wrong=s.wrongAnswers;let next=s.checkpointIndex;let status=s.status;let completedAt=s.completedAt;
      if(correct){ if(!evidence.includes(cp.id))evidence.push(cp.id); score+=Math.max(0,Number(cp.points||100)-(s.hints.includes(s.checkpointIndex)?20:0)); next+=1; if(next>=t.case.checkpoints.length){status='completed';completedAt=nowIso();} }
      else {wrong+=1;score=Math.max(0,score-5);}
      recordAnswer(s,{correct,checkpointIndex:next,score,wrongAnswers:wrong,evidence,status,completedAt,position:b.position,eventPayload:{checkpointIndex:s.checkpointIndex,answer:b.answer,points:correct?cp.points:0}});
      return json(res,200,{correct,feedback:correct?'Tačno - dokaz je otključan.':'Nije tačno. Pogledajte lokaciju još jednom.',evidence:correct?cp.evidence:null,session:getSession(s.publicId,a.id),finale:status==='completed'?t.case.finale:null});
    }
    const side=p.match(/^\/api\/player\/sessions\/([^/]+)\/sidequest$/);
    if(side && req.method==='POST'){const a=access(req,res);if(!a)return;const s=sessionFor(req,res,side[1],a);if(!s)return;const b=await readJson(req);const t=getTour(s.tourId,{includeDrafts:a.isTest});const sq=(t.case.sidequests||[]).find(x=>x.id===b.sidequestId);if(!sq)return error(res,404,'Bonus nije pronađen.');if(Number(sq.unlock||0)>s.checkpointIndex)return error(res,400,'Bonus još nije otključan.');return json(res,200,{session:recordSidequest(s,sq.id,Number(sq.points||0)),result:sq.result});}
    return error(res,404,'API ruta nije pronađena.');
  } catch (e) {
    console.error(e);
    if(e.message==='BODY_TOO_LARGE') return error(res,413,'Zahtjev je prevelik.');
    if(e.message==='INVALID_JSON') return error(res,400,'Neispravan JSON.');
    return error(res,500,config.isProd?'Došlo je do greške.':e.message);
  }
}

function serveStatic(req,res,url) {
  let pathname=decodeURIComponent(url.pathname);
  if(pathname==='/') pathname='/index.html';
  if(pathname==='/admin'||pathname==='/admin/') pathname='/admin.html';
  const safe=path.normalize(pathname).replace(/^([.][.][/\\])+/, '');
  const file=path.join(publicDir,safe);
  if(!file.startsWith(publicDir)) return error(res,403,'Zabranjeno.');
  fs.stat(file,(err,stat)=>{
    if(err||!stat.isFile()) return send(res,404,'Not found',{'Content-Type':'text/plain; charset=utf-8'});
    const ext=path.extname(file); const cache=ext==='.html'?'no-cache':'public, max-age=86400';
    res.writeHead(200,{...securityHeaders(),'Content-Type':MIME[ext]||'application/octet-stream','Cache-Control':cache});
    fs.createReadStream(file).pipe(res);
  });
}
const server=http.createServer((req,res)=>{
  const incoming=new URL(req.url,config.appOrigin);
  const base=config.basePath;
  if(base && incoming.pathname===base){res.writeHead(308,{Location:`${base}/${incoming.search}`});return res.end();}
  if(base && !incoming.pathname.startsWith(`${base}/`)){return send(res,404,'Not found',{'Content-Type':'text/plain; charset=utf-8'});}
  const stripped=base?incoming.pathname.slice(base.length)||'/':incoming.pathname;
  const url=new URL(incoming.toString());url.pathname=stripped;
  if(url.pathname.startsWith('/api/'))return api(req,res,url);
  serveStatic(req,res,url);
});
server.listen(config.port,config.host,()=>{
  console.log(`Montenegro Treasure Hunt running at ${config.appOrigin}`);
  if(!config.isProd){console.log('Dev admin:',config.adminEmail,'/',config.adminPassword);if(init.devVoucher)console.log('Test voucher:',init.devVoucher.code);}
});
