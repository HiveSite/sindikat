import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { createApi, normalizeApiPath } from './_hunt/core.mjs';

let blobStore=null;
function getBlobStore(){
  if(!blobStore)blobStore=getStore('montenegro-treasure-hunt',{consistency:'strong'});
  return blobStore;
}

const store={
  async get(key){return await getBlobStore().get(key,{type:'json'})},
  async set(key,value){await getBlobStore().setJSON(key,value)},
  async delete(key){await getBlobStore().delete(key)},
  async list(prefix){const {blobs=[]}=await getBlobStore().list({prefix});return blobs.map(x=>x.key)}
};

const testVoucherEnabled=String(process.env.MTH_ENABLE_TEST_VOUCHER||'false').toLowerCase()==='true';
const runtimeEnv={
  ...process.env,
  MTH_TOKEN_PEPPER:process.env.MTH_TOKEN_SECRET||process.env.MTH_TOKEN_PEPPER||(testVoucherEnabled?'mth-test-runtime-key-2026-stable-player-access':''),
  MTH_ADMIN_PASSWORD:process.env.MTH_ADMIN_KEY||process.env.MTH_ADMIN_PASSWORD||(testVoucherEnabled?crypto.randomBytes(32).toString('hex'):'')
};
const api=createApi({store,env:runtimeEnv});

function jsonResponse(status,data){
  return new Response(JSON.stringify(data),{
    status,
    headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
  });
}

export default async function handler(request){
  try{
    let body={};
    if(!['GET','HEAD'].includes(request.method)){
      const raw=await request.text();
      if(raw){
        try{body=JSON.parse(raw)}
        catch{return jsonResponse(400,{error:'Neispravan JSON.'})}
      }
    }

    const result=await api({
      method:request.method,
      path:normalizeApiPath(new URL(request.url).pathname),
      headers:Object.fromEntries(request.headers.entries()),
      body
    });

    return new Response(result.body,{
      status:result.statusCode,
      headers:result.headers||{'content-type':'application/json; charset=utf-8'}
    });
  }catch(error){
    console.error('hunt-api fatal error',error);
    return jsonResponse(500,{
      error:'Treasure Hunt server trenutno nije dostupan.',
      details:runtimeEnv.CONTEXT==='production'?undefined:String(error?.message||error)
    });
  }
}

// Configuration refresh: 2026-08-04
