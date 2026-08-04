const BASE='/hunt';
const CACHE='mth-hunt-v10-responsive-1';
const ASSETS=[`${BASE}/`,`${BASE}/styles.css`,`${BASE}/hotfix.css?v=10`,`${BASE}/app.js`,`${BASE}/hotfix.js?v=10`,`${BASE}/manifest.webmanifest`,`${BASE}/assets/icon.svg`];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)))});
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.pathname.startsWith(`${BASE}/api/`))return;event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}return response}).catch(()=>caches.match(event.request).then(response=>response||caches.match(`${BASE}/`))))});
