import { NextResponse } from 'next/server'
import { CATEGORIES, CITIES } from '../../../lib/seed'

function normalizePlace(place, queryType){
  const website = place.websiteUri || place.googleMapsUri || ''
  return {
    source:'GOOGLE_PLACES',
    externalId:place.id,
    name:place.displayName?.text || place.name || 'Nepoznat objekat',
    type:place.primaryTypeDisplayName?.text || place.primaryType || queryType,
    city:(place.formattedAddress || '').split(',').slice(-2,-1)[0]?.trim() || '',
    address:place.formattedAddress || '',
    phone:place.nationalPhoneNumber || place.internationalPhoneNumber || '',
    mapsUrl:place.googleMapsUri || '',
    website:website && !website.includes('google.com/maps') ? website : '',
    rating:place.rating || null,
    reviewCount:place.userRatingCount || 0,
    businessStatus:place.businessStatus || '',
  }
}

async function searchGoogle(textQuery, key){
  const res=await fetch('https://places.googleapis.com/v1/places:searchText',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'X-Goog-Api-Key':key,
      'X-Goog-FieldMask':'places.id,places.displayName,places.formattedAddress,places.googleMapsUri,places.websiteUri,places.nationalPhoneNumber,places.internationalPhoneNumber,places.rating,places.userRatingCount,places.businessStatus,places.primaryType,places.primaryTypeDisplayName'
    },
    body:JSON.stringify({ textQuery, languageCode:'sr' })
  })
  if(!res.ok) throw new Error(`Google Places ${res.status}: ${await res.text()}`)
  return (await res.json()).places || []
}

export async function POST(request){
  const body=await request.json().catch(()=>({}))
  const key=process.env.GOOGLE_MAPS_API_KEY
  if(!key){
    return NextResponse.json({mode:'DEMO',message:'GOOGLE_MAPS_API_KEY nije podešen.',results:[]})
  }
  const cities=body.cities?.length ? body.cities : CITIES.slice(0,4)
  const categories=body.categories?.length ? body.categories : CATEGORIES.slice(0,5)
  const maxQueries=Math.min(Number(body.maxQueries||12),20)
  const queries=[]
  for(const city of cities){
    for(const category of categories){
      queries.push({city,category,textQuery:`${category} u ${city}, Crna Gora`})
      if(queries.length>=maxQueries) break
    }
    if(queries.length>=maxQueries) break
  }
  const batches=await Promise.allSettled(queries.map(q=>searchGoogle(q.textQuery,key)))
  const results=[]
  batches.forEach((batch,i)=>{
    if(batch.status==='fulfilled') batch.value.forEach(p=>results.push(normalizePlace(p,queries[i].category)))
  })
  const dedup=[...new Map(results.map(x=>[x.externalId,x])).values()]
  return NextResponse.json({mode:'LIVE_PROVIDER',queries:queries.length,results:dedup})
}
