export const CITIES = ['Podgorica','Kotor','Budva','Bar','Tivat','Herceg Novi','Nikšić','Cetinje','Ulcinj']
export const CATEGORIES = ['restoran','salon ljepote','apartmani','auto servis','kafić','stomatološka ordinacija','cvjećara','turistička agencija','frizerski salon','lokalni servis']

const baseScores={artDirection:18,photography:12,content:13,typography:9,layout:9,mobile:9,conversion:5,accessibility:5,performance:5,technical:5}
export const SEED_PROJECTS = [
  {
    id:'demo-1', name:'Konoba Mare', city:'Kotor', type:'restoran', stage:'LIVE', operatingStatus:'RADI', hasOwnSite:false,
    registryStatus:'IN_PROGRESS', grade:'A', mapConfirmed:true, phone:'+382 67 000 101', instagram:'@konobamare',
    photoReadiness:'STRONG', menuReadiness:'FULL', contentReadiness:'READY', conversionReadiness:'READY',
    designDna:{heroType:'editorial split',navigationType:'minimal rail',mainGrid:'asymmetric 12-col',containerBehavior:'mixed bleed',dominantGeometry:'sharp editorial',radiusSystem:'0',elevationSystem:'hairline',surfaceRhythm:'photo-light-dark',accentRole:'small signal',typographyPersonality:'high contrast editorial',displayFont:'serif',bodyFont:'grotesk',typeScale:'large editorial',photographyGeometry:'portrait + wide crop',galleryType:'story rail',menuType:'hairline menu',reviewType:'editorial quote',ctaType:'single strong',mobileConversion:'Pozovi | Mapa',motionCharacter:'restrained',signatureComponent:'harbor rail',footerType:'editorial compact',sectionOrder:'identity-menu-atmosphere-proof-location'},
    qa:{content:true,image:true,accessibility:true,responsive:true,artDirection:true,similarity:true,standalone:true}, scores:{...baseScores,artDirection:19,photography:14,content:14}, liveUrl:'https://sindikatevents.me/preporuke/konoba-mare/'
  },
  {
    id:'demo-2', name:'Studio Forma', city:'Podgorica', type:'salon ljepote', stage:'QA', operatingStatus:'RADI', hasOwnSite:false,
    registryStatus:'IN_PROGRESS', grade:'A', mapConfirmed:true, phone:'+382 69 000 202', instagram:'@studioforma',
    photoReadiness:'MEDIUM', menuReadiness:'PARTIAL', contentReadiness:'READY', conversionReadiness:'READY',
    designDna:{heroType:'text-first collage',navigationType:'floating line',mainGrid:'magazine',containerBehavior:'wide narrow alternating',dominantGeometry:'tall crops',radiusSystem:'4px',elevationSystem:'flat',surfaceRhythm:'cream-photo-ink',accentRole:'editorial marker',typographyPersonality:'fashion grotesk',displayFont:'condensed sans',bodyFont:'humanist sans',typeScale:'poster',photographyGeometry:'portrait stack',galleryType:'vertical contact sheet',menuType:'service list',reviewType:'offset quotes',ctaType:'appointment chip',mobileConversion:'Pozovi | Instagram',motionCharacter:'snappy',signatureComponent:'vertical service ticker',footerType:'oversized type',sectionOrder:'identity-work-services-proof-contact'},
    qa:{content:true,image:true,accessibility:true,responsive:true,artDirection:true,similarity:true,standalone:true}, scores:{...baseScores,artDirection:18,photography:13,content:14}, liveUrl:''
  },
  {
    id:'demo-3', name:'Vila Aurora', city:'Budva', type:'apartmani', stage:'MEDIA', operatingStatus:'RADI', hasOwnSite:false,
    registryStatus:'IN_PROGRESS', grade:'A', mapConfirmed:true, phone:'+382 67 000 303', instagram:'@vilaaurora', hasBookingSystem:false,
    photoReadiness:'MEDIUM', menuReadiness:'NONE', contentReadiness:'READY', conversionReadiness:'READY',
    designDna:{heroType:'restrained gallery',navigationType:'transparent compact',mainGrid:'panoramic',containerBehavior:'full bleed moments',dominantGeometry:'wide windows',radiusSystem:'8px',elevationSystem:'subtle',surfaceRhythm:'sky-white-stone',accentRole:'location marker',typographyPersonality:'calm humanist',displayFont:'humanist sans',bodyFont:'sans',typeScale:'quiet large',photographyGeometry:'wide views',galleryType:'cinematic strip',menuType:'none',reviewType:'minimal proof',ctaType:'call + map',mobileConversion:'Pozovi | Mapa',motionCharacter:'slow',signatureComponent:'horizon line',footerType:'map-led',sectionOrder:'destination-stay-gallery-amenities-proof-location'},
    qa:{content:true,image:true,accessibility:true,responsive:true,artDirection:true,similarity:true,standalone:true}, scores:{...baseScores,artDirection:19,photography:13,content:13}, liveUrl:''
  },
]
