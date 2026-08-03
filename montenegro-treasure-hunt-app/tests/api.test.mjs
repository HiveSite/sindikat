import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const port=31991,base=`http://127.0.0.1:${port}`,dbFile=path.resolve('data/test-api.sqlite');
let child;
async function wait(){for(let i=0;i<60;i++){try{const r=await fetch(base+'/api/health');if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,100))}throw new Error('server nije startovao')}
async function request(p,o={}){const r=await fetch(base+p,{...o,headers:{'content-type':'application/json',...(o.headers||{})}});const d=await r.json();if(!r.ok)throw new Error(`${p}: ${JSON.stringify(d)}`);return {d,r}}
test.before(async()=>{for(const s of ['', '-shm','-wal'])fs.rmSync(dbFile+s,{force:true});child=spawn(process.execPath,['server.mjs'],{cwd:path.resolve('.'),env:{...process.env,NODE_ENV:'development',PORT:String(port),APP_ORIGIN:base,DATABASE_FILE:dbFile,ENABLE_DEV_TEST_VOUCHER:'true'},stdio:'ignore'});await wait()});
test.after(()=>{child?.kill();for(const s of ['', '-shm','-wal'])fs.rmSync(dbFile+s,{force:true})});
test('svih 6 tura prolazi kroz svih 30 stanica i završava finale',async()=>{
  const first=(await request('/api/player/redeem',{method:'POST',body:JSON.stringify({code:'MTH-TEST-ALL'})})).d;
  const firstAccess=(await request('/api/player/access',{headers:{authorization:`Bearer ${first.token}`}})).d;
  assert.equal(firstAccess.tours.length,6);
  for(const tourSummary of firstAccess.tours){
    const red=(await request('/api/player/redeem',{method:'POST',body:JSON.stringify({code:'MTH-TEST-ALL'})})).d;
    const headers={authorization:`Bearer ${red.token}`};
    const access=(await request('/api/player/access',{headers})).d;
    const tour=access.tours.find(t=>t.slug===tourSummary.slug);
    const created=(await request('/api/player/sessions',{method:'POST',headers,body:JSON.stringify({tourId:tour.id,crewName:`QA ${tour.city}`,captainName:'Kapetan',playerCount:3,mode:'test'})})).d;
    let latest=created.session;
    for(let i=0;i<tour.case.checkpoints.length;i++){
      const cp=tour.case.checkpoints[i];
      const answer=(await request(`/api/player/sessions/${created.session.publicId}/answer`,{method:'POST',headers,body:JSON.stringify({answer:cp.answer,position:{lat:cp.lat,lng:cp.lng,accuracy:5}})})).d;
      assert.equal(answer.correct,true,`${tour.city} stanica ${i+1}`);
      assert.equal(answer.session.checkpointIndex,i+1);
      latest=answer.session;
    }
    assert.equal(latest.status,'completed');
    assert.equal(latest.evidence.length,5);
  }
  const login=await request('/api/admin/login',{method:'POST',body:JSON.stringify({email:'admin@mth.local',password:'MTH-Admin-2026!'})});
  const cookie=login.r.headers.get('set-cookie').split(';')[0];
  const dashboard=(await request('/api/admin/dashboard',{headers:{cookie}})).d;
  assert.equal(dashboard.stats.tours,6);
  assert.equal(dashboard.stats.completedSessions,6);
  const sessions=(await request('/api/admin/sessions',{headers:{cookie}})).d.sessions;
  assert.equal(sessions.filter(s=>s.status==='completed').length,6);
});
