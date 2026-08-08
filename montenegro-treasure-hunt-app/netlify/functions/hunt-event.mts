import { getStore } from '@netlify/blobs';

function json(status:number,data:unknown){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}})}
function teamFromCode(value:unknown){const code=String(value||'').trim().toUpperCase();const m=code.match(/^PG26-(0[1-9]|10)$/);return m?{code,teamNo:Number(m[1])}:null}
function keyFor(n:number){return `event/PG26/team/${String(n).padStart(2,'0')}`}
function eventStore(){return getStore('podgorica-hunt-event-2026',{consistency:'strong'})}
async function readTeam(store:any,n:number){return await store.get(keyFor(n),{type:'json'})||{teamNo:n,progress:0,score:0,status:'not_started',updatedAt:null}}
async function board(store:any){const teams=[];for(let n=1;n<=10;n++)teams.push(await readTeam(store,n));return teams.sort((a,b)=>b.progress-a.progress||b.score-a.score||a.teamNo-b.teamNo)}

export default async function handler(request:Request){
  const store=eventStore();
  try{
    const path=new URL(request.url).pathname;
    let body:any={};
    if(!['GET','HEAD'].includes(request.method)){const raw=await request.text();if(raw)try{body=JSON.parse(raw)}catch{return json(400,{error:'Invalid JSON.'})}}
    if(path.endsWith('/health'))return json(200,{ok:true,event:'PG26',teams:10});
    if(path.endsWith('/join')&&request.method==='POST'){
      const team=teamFromCode(body.code);if(!team)return json(400,{error:'Invalid team code.'});
      const current=await readTeam(store,team.teamNo);const next={...current,teamNo:team.teamNo,status:current.status==='completed'?'completed':'active',joinedAt:current.joinedAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
      await store.setJSON(keyFor(team.teamNo),next);
      return json(200,{ok:true,event:'PG26',team:next,startOffset:team.teamNo-1});
    }
    if(path.endsWith('/progress')&&request.method==='POST'){
      const team=teamFromCode(body.code);if(!team)return json(400,{error:'Invalid team code.'});
      const progress=Math.max(0,Math.min(100,Number(body.progress)||0));const score=Math.max(0,Math.min(99999,Number(body.score)||0));
      const current=await readTeam(store,team.teamNo);const next={...current,teamNo:team.teamNo,progress,score,status:progress>=100?'completed':'active',updatedAt:new Date().toISOString()};
      await store.setJSON(keyFor(team.teamNo),next);
      return json(200,{ok:true,team:next});
    }
    if(path.endsWith('/board')&&request.method==='GET')return json(200,{ok:true,event:'PG26',teams:await board(store)});
    return json(404,{error:'Not found.'});
  }catch(error){console.error('hunt-event',error);return json(500,{error:'Event service unavailable.'})}
}
