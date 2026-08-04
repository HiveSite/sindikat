import test from 'node:test';
import assert from 'node:assert/strict';
import { createApi, normalizeApiPath } from '../netlify/functions/_hunt/core.mjs';

class MemoryStore{
  map=new Map();
  async get(k){return this.map.has(k)?structuredClone(this.map.get(k)):null}
  async set(k,v){this.map.set(k,structuredClone(v))}
  async delete(k){this.map.delete(k)}
  async list(prefix){return [...this.map.keys()].filter(k=>k.startsWith(prefix))}
}
const env={
  MTH_TOKEN_PEPPER:'12345678901234567890123456789012',
  MTH_ADMIN_EMAIL:'admin@example.com',
  MTH_ADMIN_PASSWORD:'VeryStrongPassword123!',
  MTH_ENABLE_TEST_VOUCHER:'true',
  URL:'https://sindikatevents.me',
  CONTEXT:'dev'
};

function data(r){return JSON.parse(r.body)}

test('putanje se prevode na API rute',()=>{
  assert.equal(normalizeApiPath('/hunt/api/admin/me'),'/api/admin/me');
  assert.equal(normalizeApiPath('/.netlify/functions/hunt-api/player/redeem'),'/api/player/redeem');
});

test('admin, vaučer, igra i GPS validacija rade',async()=>{
  const store=new MemoryStore();
  const api=createApi({store,env});
  let r=await api({path:'/api/health'});assert.equal(r.statusCode,200);assert.equal(data(r).configured,true);
  r=await api({method:'POST',path:'/api/admin/login',body:{email:env.MTH_ADMIN_EMAIL,password:env.MTH_ADMIN_PASSWORD}});assert.equal(r.statusCode,200);
  const cookie=r.headers['set-cookie'].split(';')[0];
  r=await api({path:'/api/admin/tours',headers:{cookie}});const tours=data(r).tours;assert.equal(tours.length,6);
  r=await api({method:'POST',path:'/api/admin/vouchers',headers:{cookie},body:{label:'Test',value:89,maxPlayers:6,allowedTourIds:[tours[0].id],externalRef:'ORDER-1'}});assert.equal(r.statusCode,201);const code=data(r).voucher.code;
  r=await api({method:'POST',path:'/api/admin/vouchers',headers:{cookie},body:{label:'Duplikat',value:89,maxPlayers:6,allowedTourIds:[tours[0].id],externalRef:'ORDER-1'}});assert.equal(r.statusCode,409);
  r=await api({method:'POST',path:'/api/player/redeem',body:{code}});assert.equal(r.statusCode,200);const token=data(r).token,auth={authorization:`Bearer ${token}`};
  r=await api({method:'POST',path:'/api/player/sessions',headers:auth,body:{tourId:tours[0].id,crewName:'QA',captainName:'Kapetan',playerCount:3,mode:'live'}});assert.equal(r.statusCode,201);let session=data(r).session;const cp=tours[0].case.checkpoints[0];
  r=await api({method:'POST',path:`/api/player/sessions/${session.publicId}/answer`,headers:auth,body:{answer:cp.answer,position:{lat:cp.lat,lng:cp.lng,accuracy:300}}});assert.equal(r.statusCode,400);assert.match(data(r).error,/GPS signal/);
  r=await api({method:'POST',path:`/api/player/sessions/${session.publicId}/answer`,headers:auth,body:{answer:cp.answer,position:{lat:cp.lat,lng:cp.lng,accuracy:5}}});assert.equal(r.statusCode,200);assert.equal(data(r).correct,true);
});

test('ne prihvata vaučer bez ture',async()=>{
  const store=new MemoryStore();const api=createApi({store,env});
  const login=await api({method:'POST',path:'/api/admin/login',body:{email:env.MTH_ADMIN_EMAIL,password:env.MTH_ADMIN_PASSWORD}});const cookie=login.headers['set-cookie'].split(';')[0];
  const r=await api({method:'POST',path:'/api/admin/vouchers',headers:{cookie},body:{label:'Prazan',value:10,maxPlayers:2,allowedTourIds:[]}});
  assert.equal(r.statusCode,400);
});

test('test vaučer radi sa produkcionim nazivima varijabli',async()=>{
  const store=new MemoryStore();
  const api=createApi({store,env:{
    MTH_TOKEN_PEPPER:'12345678901234567890123456789012',
    MTH_ADMIN_EMAIL:'admin@example.com',
    MTH_ADMIN_PASSWORD:'VeryStrongPassword123!',
    MTH_ENABLE_TEST_VOUCHER:'true',
    URL:'https://sindikatevents.me'
  }});
  let r=await api({path:'/api/health'});assert.equal(r.statusCode,200);assert.equal(data(r).configured,true);
  r=await api({method:'POST',path:'/api/player/redeem',body:{code:'MTH-TEST-ALL'}});assert.equal(r.statusCode,200);
  const token=data(r).token;
  r=await api({path:'/api/player/access',headers:{authorization:`Bearer ${token}`}});assert.equal(r.statusCode,200);assert.equal(data(r).tours.length,6);
});
