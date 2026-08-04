# Montenegro Treasure Hunt

GPS avantura kroz Crnu Goru integrisana u sindikatevents.me.
Ovaj modul je jedinstven, čist Netlify stack (Functions + Blobs). Stari
Node/SQLite/Docker pristup je uklonjen da ne bi bilo dvije verzije istog koda.

## Linkovi
- Igra:  https://sindikatevents.me/hunt/
- Admin: https://sindikatevents.me/hunt/admin
- Health: https://sindikatevents.me/hunt/api/health

## Kako je sastavljeno
- Frontend: `public/hunt/` (kopira se u `dist/hunt` tokom builda)
- Backend:  `netlify/functions/hunt-api-v2.mts` → `netlify/functions/_hunt/core.mjs`
- Sadržaj:  `netlify/functions/_hunt/seed-data.mjs` (6 gradova × 5 stanica = 30 lokacija)
- Build i redirecti: **root** `netlify.toml` (`npm run build:netlify`, publish `dist`)

Sve što se tiče deploya kontroliše root `netlify.toml`. U ovom folderu NEMA
zasebnog netlify.toml da ne bi došlo do zabune koja konfiguracija važi.

## Obavezne Netlify env varijable
- `MTH_TOKEN_PEPPER` — najmanje 24 nasumična karaktera
- `MTH_ADMIN_EMAIL` — email za admin prijavu
- `MTH_ADMIN_PASSWORD` — jaka lozinka, najmanje 12 karaktera

Opciono:
- `MTH_ENABLE_TEST_VOUCHER=true` — uključuje test kod `MTH-TEST-ALL` (na produkciji držati isključeno)
- `MTH_INTEGRATION_API_KEY` — ključ za eksterno automatsko kreiranje vaučera

## Provjera poslije deploya
1. `/hunt/api/health` mora vratiti `"ok": true` i `"configured": true`
2. Prijava na `/hunt/admin` sa `MTH_ADMIN_EMAIL` / `MTH_ADMIN_PASSWORD`
3. Generiši vaučer i testiraj ga na `/hunt/`

## Lokalno
- Testovi jezgra: `npm test` (iz ovog foldera) ili `npm run test:hunt` (iz roota)
- Content istina je `seed-data.mjs`. Izmjena tura ide kroz admin panel (Netlify Blobs) ili direktno u seed-data.

## Napomena
Netlify Blobs je trajni storage i podaci ostaju poslije novih deploya. GPS
koordinate stanica nisu terenski verifikovane — prije javnog lansiranja proći
svih 30 lokacija fizički.
