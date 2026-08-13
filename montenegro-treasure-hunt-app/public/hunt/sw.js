const BASE='/hunt';
const CACHE='montenegro-hunt-v53-full-preview';
const ASSETS=[
  `${BASE}/`,
  `${BASE}/styles-v31.css?v=50`,
  `${BASE}/ux-v32.css?v=50`,
  `${BASE}/hunt-data-v32-global.js?v=50`,
  `${BASE}/app-v32-1.js?v=50`,
  `${BASE}/app-v32-2.js?v=50`,
  `${BASE}/app-v32-3.js?v=50`,
  `${BASE}/program-runtime.js?v=1`,
  `${BASE}/experience-runtime.js?v=1`,
  `${BASE}/preview-runtime.js?v=1`,
  `${BASE}/manifest.webmanifest`,
  `${BASE}/assets/icon.svg`
];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS).catch(()=>{})))});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]))});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.pathname.includes('/api/')||url.pathname.includes('/team-api')||url.pathname.includes('/platform-api'))return;
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(r=>{
    if(r.ok){const c=r.clone();caches.open(CACHE).then(cache=>cache.put(event.request,c)).catch(()=>{})}
    return r;
  }).catch(()=>caches.match(event.request).then(r=>r||caches.match(`${BASE}/`))));
});
