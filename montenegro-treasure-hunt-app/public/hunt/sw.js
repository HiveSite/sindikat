const BASE='/hunt';
const CACHE='podgorica-hunt-v31-evidence-flow';
const ASSETS=[`${BASE}/`,`${BASE}/styles-v31.css?v=31`,`${BASE}/app-v31.js?v=31`,`${BASE}/manifest.webmanifest`,`${BASE}/assets/icon.svg`];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS).catch(()=>{})))});
self.addEventListener('activate',event=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]))});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.pathname.includes('/api/'))return;event.respondWith(fetch(event.request,{cache:'no-store'}).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(cache=>cache.put(event.request,c)).catch(()=>{})}return r}).catch(()=>caches.match(event.request).then(r=>r||caches.match(`${BASE}/`))))});