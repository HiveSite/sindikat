import { getStore } from '@netlify/blobs';
import { createApi, normalizeApiPath } from './_hunt/core.mjs';

const blob=getStore('montenegro-treasure-hunt',{consistency:'strong'});
const store={
  async get(key){return await blob.get(key,{type:'json'})},
  async set(key,value){await blob.setJSON(key,value)},
  async delete(key){await blob.delete(key)},
  async list(prefix){const {blobs}=await blob.list({prefix});return blobs.map(x=>x.key)}
};
const api=createApi({store,env:process.env});

export async function handler(event){
  let body={};
  if(event.body){try{body=JSON.parse(event.isBase64Encoded?Buffer.from(event.body,'base64').toString('utf8'):event.body)}catch{return {statusCode:400,headers:{'content-type':'application/json'},body:JSON.stringify({error:'Neispravan JSON.'})}}
  }
  const rawPath=new URL(event.rawUrl||`https://local${event.path||'/'}`).pathname;
  return api({method:event.httpMethod||'GET',path:normalizeApiPath(rawPath),headers:event.headers||{},body});
}
