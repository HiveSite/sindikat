import { NextResponse } from 'next/server'
import { accommodationType, slugify } from '../../../lib/engine'

function rank(p){
  let score=0
  if(p.phone) score+=20
  if(p.rating>=4.2) score+=20
  if(p.reviewCount>=20) score+=15
  if(p.reviewCount>=100) score+=10
  if(!p.website) score+=35
  return score
}

export async function POST(request){
  const body=await request.json().catch(()=>({}))
  const origin=new URL(request.url).origin
  const discovery=await fetch(`${origin}/api/discovery`,{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)
  })
  const data=await discovery.json()
  if(data.mode==='DEMO') return NextResponse.json({mode:'DEMO',target:5,projects:[],message:data.message})

  const eligible=(data.results||[])
    .filter(p=>!p.website)
    .filter(p=>p.businessStatus !== 'CLOSED_PERMANENTLY')
    .sort((a,b)=>rank(b)-rank(a))

  const picked=[]
  const usedTypes=new Set()
  for(const p of eligible){
    if(picked.length>=5) break
    const diversityBonus=usedTypes.has(p.type)?0:1
    if(diversityBonus || picked.length>=3){
      usedTypes.add(p.type)
      picked.push({
        id:p.externalId,
        name:p.name,city:p.city,type:p.type,address:p.address,phone:p.phone,mapsUrl:p.mapsUrl,
        stage:'QUALIFY',operatingStatus:p.businessStatus==='OPERATIONAL'?'RADI':'NEPOZNATO',hasOwnSite:false,
        registryStatus:'DISCOVERED',grade:'B',slug:slugify(`${p.name}-${p.city}`),rating:p.rating,reviewCount:p.reviewCount,
        bookingOpportunity:accommodationType(p.type)?'OFFER':'NOT_NEEDED',bookingApproval:false
      })
    }
  }
  return NextResponse.json({mode:'LIVE_PROVIDER',target:5,examined:eligible.length,projects:picked})
}
