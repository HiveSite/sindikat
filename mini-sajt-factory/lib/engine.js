export const PIPELINE = ['DISCOVERY','QUALIFY','RESEARCH','DESIGN','BUILD','QA','LIVE','SALES']

export const SCORE_WEIGHTS = {
  artDirection: 20,
  photography: 15,
  content: 15,
  typography: 10,
  layout: 10,
  mobile: 10,
  conversion: 5,
  accessibility: 5,
  performance: 5,
  technical: 5,
}

export const DESIGN_DNA_FIELDS = [
  'heroType','navigationType','mainGrid','containerBehavior','dominantGeometry','radiusSystem',
  'elevationSystem','surfaceRhythm','accentRole','typographyPersonality','displayFont','bodyFont',
  'typeScale','photographyGeometry','galleryType','menuType','reviewType','ctaType',
  'mobileConversion','motionCharacter','signatureComponent','footerType','sectionOrder'
]

export function slugify(value=''){
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'dj')
    .replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')
}

export function premiumScore(scores={}){
  return Object.entries(SCORE_WEIGHTS).reduce((sum,[key,max]) => {
    const value = Number(scores[key] || 0)
    return sum + Math.max(0, Math.min(max, value))
  },0)
}

export function scoreStatus(score){
  if(score >= 90) return 'EXCELLENT'
  if(score >= 85) return 'SALES READY'
  if(score >= 80) return 'NEEDS POLISH'
  return 'NO LIVE'
}

export function hardGate(project){
  const reasons=[]
  if(project.registryStatus === 'LIVE_DEMO') reasons.push('Već postoji LIVE_DEMO')
  if(project.operatingStatus !== 'RADI') reasons.push('Status rada nije potvrđen kao RADI')
  if(project.hasOwnSite === true) reasons.push('Objekat ima aktivan sopstveni sajt')
  if(project.registryStatus === 'SKIPPED_CLOSED') reasons.push('Registry: SKIPPED_CLOSED')
  if(project.registryStatus === 'SKIPPED_HAS_SITE') reasons.push('Registry: SKIPPED_HAS_SITE')
  return { pass: reasons.length===0, reasons }
}

export function liveEligibility(project){
  const gate=hardGate(project)
  const score=premiumScore(project.scores)
  const requiredQa=['content','image','accessibility','responsive','artDirection','similarity','standalone']
  const failedQa=requiredQa.filter(k => project.qa?.[k] !== true)
  const reasons=[...gate.reasons]
  if(score < 85) reasons.push(`Premium Score ${score}/100 je ispod 85`)
  if(failedQa.length) reasons.push(`QA nije prošao: ${failedQa.join(', ')}`)
  if(!project.mapConfirmed) reasons.push('Lokacija/mapa nije potvrđena')
  if(!project.designDna?.signatureComponent) reasons.push('Nema signature elementa')
  return { pass: reasons.length===0, score, reasons }
}

export function accommodationType(type=''){
  const s=type.toLowerCase()
  return ['hotel','apart','vila','hostel','sobe','lodging','smještaj','smestaj','guest house'].some(x=>s.includes(x))
}

export function bookingOpportunity(project){
  if(!accommodationType(project.type)) return 'NOT_NEEDED'
  if(project.hasBookingSystem) return 'NOT_NEEDED'
  return project.bookingApproval ? 'APPROVED' : 'OFFER'
}

export function designSimilarity(a={},b={}){
  const fields=DESIGN_DNA_FIELDS.filter(k=>a[k] && b[k])
  if(!fields.length) return 0
  const same=fields.filter(k=>String(a[k]).trim().toLowerCase()===String(b[k]).trim().toLowerCase()).length
  return Math.round((same/fields.length)*100)
}
