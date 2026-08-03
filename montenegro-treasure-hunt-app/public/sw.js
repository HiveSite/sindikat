const BASE='/hunt';
const CACHE='mth-hunt-v2';
const ASSETS=[`${BASE}/`,`${BASE}/styles.css`,`${BASE}/app.js`,`${BASE}/manifest.webmanifest`,`${BASE}/assets/icon.svg`];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.pathname.startsWith(`${BASE}/api/`))return;e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match(`${BASE}/`))))});
