import { NextResponse } from 'next/server'

const url=process.env.NEXT_PUBLIC_SUPABASE_URL
const key=process.env.SUPABASE_SECRET_KEY

function headers(){return {apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'}}

export async function GET(){
  if(!url||!key) return NextResponse.json({projects:[],error:'Supabase env nije podešen.'},{status:503})
  const res=await fetch(`${url}/rest/v1/factory_projects?select=*&order=updated_at.desc&limit=100`,{headers:headers(),cache:'no-store'})
  const rows=await res.json()
  if(!res.ok) return NextResponse.json({projects:[],error:rows?.message||'Supabase read failed'},{status:res.status})
  return NextResponse.json({projects:rows.map(fromDb)})
}

export async function PATCH(req){
  if(!url||!key) return NextResponse.json({error:'Supabase env nije podešen.'},{status:503})
  const body=await req.json()
  if(!body?.id) return NextResponse.json({error:'Nedostaje id.'},{status:400})
  const payload=toDb(body.patch||{})
  payload.updated_at=new Date().toISOString()
  const res=await fetch(`${url}/rest/v1/factory_projects?id=eq.${encodeURIComponent(body.id)}`,{method:'PATCH',headers:{...headers(),Prefer:'return=representation'},body:JSON.stringify(payload)})
  const rows=await res.json()
  if(!res.ok) return NextResponse.json({error:rows?.message||'Supabase update failed'},{status:res.status})
  return NextResponse.json({project:rows[0]?fromDb(rows[0]):null})
}

function fromDb(r){return {id:r.id,externalKey:r.external_key,name:r.name,slug:r.slug,city:r.city,type:r.type,stage:r.stage,operatingStatus:r.operating_status,hasOwnSite:r.has_own_site,registryStatus:r.registry_status,grade:r.grade,sourceData:r.source_data||{},researchData:r.research_data||{},designDna:r.design_dna||{},qa:r.qa||{},scores:r.scores||{},bookingOpportunity:r.booking_opportunity,bookingApproval:r.booking_approval,liveUrl:r.live_url,updatedAt:r.updated_at,phone:r.research_data?.phone||r.source_data?.phone||'',mapsUrl:r.research_data?.maps_url||r.source_data?.maps_url||'',mapConfirmed:!!(r.research_data?.maps_url||r.source_data?.maps_url),contentReadiness:r.research_data?.content_readiness||'PARTIAL',photoReadiness:r.research_data?.photo_readiness||'WEAK',menuReadiness:r.research_data?.menu_readiness||'NONE',conversionReadiness:r.research_data?.conversion_readiness||(r.research_data?.phone?'READY':'PARTIAL'),media:[],contactStatus:r.research_data?.contact_status||'READY',salesAngle:r.research_data?.sales_angle||''}}

function toDb(p){const out={}; const map={name:'name',slug:'slug',city:'city',type:'type',stage:'stage',operatingStatus:'operating_status',hasOwnSite:'has_own_site',registryStatus:'registry_status',grade:'grade',designDna:'design_dna',qa:'qa',scores:'scores',bookingOpportunity:'booking_opportunity',bookingApproval:'booking_approval',liveUrl:'live_url'}; for(const [k,v] of Object.entries(p)) if(map[k]) out[map[k]]=v; return out}
