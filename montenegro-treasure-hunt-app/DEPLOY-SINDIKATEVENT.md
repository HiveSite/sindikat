# Deploy - sindikatevents.me/hunt/

Aktuelni Hunt build je dio Netlify deploya glavnog `sindikat-main` repoa.

## Source of truth

U punom repou koristite **root `netlify.toml`**.

Potrebne produkcijske rute su:

```toml
[[redirects]]
  from = "/hunt/team-api/*"
  to = "/.netlify/functions/hunt-event/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/hunt/api/*"
  to = "/.netlify/functions/hunt-api-v2/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/hunt/"
  to = "/hunt/index.html"
  status = 200
  force = true
```

## Build

Glavni repo koristi `npm run build:netlify`, a `scripts/build-netlify.mjs` kopira aktuelni `montenegro-treasure-hunt-app/public/hunt` u `dist/hunt`.

## Poslije deploya

Provjeriti:

- `https://sindikatevents.me/hunt/`
- validan team code `PG26-01` do `PG26-10`
- `/hunt/team-api/health`
- team board
- GPS permission i field unlock na telefonu
- finalni Sastavci unlock

## Napomena

Stare Node/SQLite/Docker/VPS instrukcije više nisu aktuelna produkcijska arhitektura za ovaj build.
