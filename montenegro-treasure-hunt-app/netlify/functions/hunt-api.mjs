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

const runtimeEnv={
  ...process.env,
  MTH_TOKEN_PEPPER:process.env.MTH_TOKEN_SECRET||process.env.MTH_TOKEN_PEPPER||'',
  MTH_ADMIN_PASSWORD:process.env.MTH_ADMIN_KEY||process.env.MTH_ADMIN_PASSWORD||''
};
const api=createApi({store,env:runtimeEnv});

function response(statusCode,data){
  return {statusCode,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'},body:JSON.stringify(data)};
}

function requestPath(event={}){
  const candidate=event.rawUrl||event.rawPath||event.path||'/';
  try{return new URL(candidate,'https://local').pathname}
  catch{return String(event.path||'/').split('?')[0]||'/'}
}

export async function handler(event={}){
  try{
    let body={};
    if(event.body){
      try{body=JSON.parse(event.isBase64Encoded?Buffer.from(event.body,'base64').toString('utf8'):event.body)}
      catch{return response(400,{error:'Neispravan JSON.'})}
    }
    return await api({
      method:event.httpMethod||event.requestContext?.http?.method||'GET',
      path:normalizeApiPath(requestPath(event)),
      headers:event.headers||{},
      body
    });
  }catch(error){
    console.error('hunt-api fatal error',error);
    return response(500,{error:'Treasure Hunt server trenutno nije dostupan.',details:runtimeEnv.CONTEXT==='production'?undefined:String(error?.message||error)});
  }
}
