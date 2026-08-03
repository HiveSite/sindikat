const origin=process.env.CHECK_ORIGIN||'http://127.0.0.1:3000';
for(const path of ['/hunt/','/hunt/admin','/hunt/api/health']){
  const r=await fetch(origin+path,{redirect:'manual'});
  console.log(`${r.status} ${path}`);
  if(!r.ok)process.exitCode=1;
}
