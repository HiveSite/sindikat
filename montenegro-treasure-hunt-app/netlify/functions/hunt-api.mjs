import { getStore } from '@netlify/blobs';
import { createApi, normalizeApiPath } from './_hunt/core.mjs';

const blob=getStore('montenegro-treasure-hunt',{consistency:'strong'});
const store={
  async get(key){return await blob.get(key,{type:'json'})},
  async set(key,value){await blob.setJSON(key,value)},
  async delete(key){await blob.delete(key)},
  async list(prefix){const {blobs}=await blob.list({prefix});return blobs.map(x=>x.key)}
};

// Netlify secret uses a neutral name; the existing core expects MTH_TOKEN_PEPPER.
const runtimeEnv={
  ...process.env,
  MTH_TOKEN_PEPPER:process.env.MTH_TOKEN_SECRET||process.env.MTH_TOKEN_PEPPER||''
};
const api=createApi({store,env:runtimeEnv});

export async function handler(event){
  let body={};
  if(event.body){try{body=JSON.parse(event.isBase64Encoded?Buffer.from(event.body,'base64').toString('utf8'):event.body)}catch{return {statusCode:400,headers:{'content-type':'application/json'},body:JSON.stringify({error:'Neispravan JSON.'})}}
  }
  const rawPath=new URL(event.rawUrl||`https://local${event.path||'/'}`).pathname;
  return api({method:event.httpMethod||'GET',path:normalizeApiPath(rawPath),headers:event.headers||{},body});
}
