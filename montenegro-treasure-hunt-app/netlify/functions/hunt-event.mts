import { getStore } from '@netlify/blobs';

const STORE='podgorica-hunt-event-2026';
const EVENT='PG26';
const store=getStore(STORE,{consistency:'strong'});

function json(status:number,data:unknown){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
function teamFromCode(value:unknown){const code=String(value||'').trim().toUpperCase();const m=code.match(/^PG26-(0[1-9]|10)$/);return m?{code,teamNo:Number(m[1])}:null}
async function readTeam(n:number){return await store.get(`event/${EVENT}/team/${String(n).padStart(2,'0')}`,{type:'json'})||{teamNo:n,progress:0,score:0,status:'not_started',updatedAt:null}}
async function board(){const teams=[];for(let n=1;n<=10;n++)teams.push(await readTeam(n));return teams.sort((a,b)=>b.progress-a.progress||b.score-a.score||a.teamNo-b.teamNo)}

export default async function handler(request:Request){
  try{
    const url=new URL(request.url);const path=url.pathname;
    let body:any={};
    if(!['GET','HEAD'].includes(request.method)){const raw=await request.text();if(raw)try{body=JSON.parse(raw)}catch{return json(400,{error:'Invalid JSON.'})}}
    if(path.endsWith('/health'))return json(200,{ok:true,event:EVENT,teams:10});
    if(path.endsWith('/join')&&request.method==='POST'){
      const team=teamFromCode(body.code);if(!team)return json(400,{error:'Invalid team code.'});
      const current=await readTeam(team.teamNo);const next={...current,teamNo:team.teamNo,status:current.status==='completed'?'completed':'active',joinedAt:current.joinedAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
      await store.setJSON(`event/${EVENT}/team/${String(team.teamNo).padStart(2,'0')}`,next);
      return json(200,{ok:true,event:EVENT,team:next,startOffset:team.teamNo-1});
    }
    if(path.endsWith('/progress')&&request.method==='POST'){
      const team=teamFromCode(body.code);if(!team)return json(400,{error:'Invalid team code.'});
      const progress=Math.max(0,Math.min(100,Number(body.progress)||0));const score=Math.max(0,Math.min(99999,Number(body.score)||0));
      const current=await readTeam(team.teamNo);const next={...current,teamNo:team.teamNo,progress,score,status:progress>=100?'completed':'active',updatedAt:new Date().toISOString()};
      await store.setJSON(`event/${EVENT}/team/${String(team.teamNo).padStart(2,'0')}`,next);
      return json(200,{ok:true,team:next});
    }
    if(path.endsWith('/board')&&request.method==='GET')return json(200,{ok:true,event:EVENT,teams:await board()});
    return json(404,{error:'Not found.'});
  }catch(error){console.error('hunt-event',error);return json(500,{error:'Event service unavailable.'})}
}
