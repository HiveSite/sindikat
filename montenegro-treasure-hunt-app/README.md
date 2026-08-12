# Montenegro Treasure Hunt

Aktuelni user-facing `/hunt/` build je **Podgorica City Treasure Hunt - Ten Letters That Never Arrived**.

## Produkcijski URL-ovi

- Igra: `https://sindikatevents.me/hunt/`
- Admin: `https://sindikatevents.me/hunt/admin`
- Event team API: `/hunt/team-api/*`
- Core/admin API: `/hunt/api/*`

## Aktuelna arhitektura

- Podgorica event frontend: `public/hunt/`
- Podgorica team/event state: `netlify/functions/hunt-event.mts` + Netlify Blobs
- Core/admin API: `netlify/functions/hunt-api-v2.mts` i `_hunt/core.mjs`
- Legacy multi-city content engine: `content/tours.json` / `_hunt/seed-data.mjs`
- Static build: `scripts/build-netlify.mjs`

`public/hunt/index.html` trenutno učitava premium Podgorica event build (`app-v32-*` + `hunt-data-v32-global.js`). Legacy multi-city player fajlovi su zadržani zbog kompatibilnosti i admin/core infrastrukture, ali nisu aktuelni user-facing flow.

## Team kodovi

Podgorica live event koristi kodove:

- `PG26-01`
- ...
- `PG26-10`

Produkcija potvrđuje kod kroz `hunt-event.mts`. `?review=1` omogućava lokalni UI review i simulaciju dolaska na checkpoint; ako event API nije dostupan, review mode može koristiti lokalni team state.

## Lokalna provjera

```bash
npm test
node --test tests/content.test.mjs
```

Za UI review servirati `public/` kao statički root i otvoriti:

`/hunt/?review=1`

## Netlify

U glavnom `sindikat-main` repou **root `netlify.toml` je source of truth** za produkcijski deploy. `netlify.toml` u ovom izdvojenom modulu služi kao standalone mirror hunt ruta.

Potrebne rute:

- `/hunt/team-api/*` → `hunt-event`
- `/hunt/api/*` → `hunt-api-v2` u glavnom repou
- `/hunt/` → `hunt/index.html`

## Prije javnog eventa

Kod je tehnički QA testiran, ali svih 10 Podgorica field stopova i Sastavci finale treba proći fizički na iPhone i Android uređajima prije javnog korišćenja. Posebno potvrditi GPS signal, bezbjedan pješački prilaz i realan radijus otključavanja na terenu.
