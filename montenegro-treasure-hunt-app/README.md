# Montenegro Treasure Hunt - `/hunt` izdanje

Ovo izdanje je unaprijed podešeno da radi na:

- Player: `https://sindikatevent.me/hunt/`
- Admin: `https://sindikatevent.me/hunt/admin`

Važno: folder u Git repou sam po sebi ne pravi URL. Node aplikacija mora biti pokrenuta na serveru, a glavni domen mora proxy-rutirati `/hunt/` prema ovoj aplikaciji. Pogledajte `DEPLOY-SINDIKATEVENT.md`.

Potpuna web aplikacija sa player flowom, ugrađenom mapom, admin panelom i SQLite bazom.

## Šta je uključeno

- Node.js 22 HTTP server - bez npm biblioteka i bez eksternih CDN servisa
- SQLite baza u `data/mth.sqlite`
- Player aplikacija na `/`
- Admin panel na `/admin`
- Vaučeri sa hashiranim kodovima
- Jednokratna aktivacija produkcijskih vaučera
- Test vaučer za neograničeno lokalno testiranje svih 6 tura
- 6 gradova i 30 glavnih stanica
- GPS live režim i test simulacija
- Potpuno ugrađena SVG mapa - nema Google Maps, OSM tileova ni Leafleta
- Server-side provjera odgovora, GPS udaljenosti, poena, hintova i bonusa
- Čuvanje i nastavak aktivne igre
- Admin uređivanje priče, stanica, zadataka, dokaza, bonusa i događaja
- Admin generisanje vaučera i pregled aktivnih sesija
- PWA manifest i service worker
- Docker paket sa trajnim SQLite volumenom

## Najbrži lokalni start - Windows

1. Instalirajte Node.js 22 ili noviji.
2. Raspakujte ZIP.
3. Dvaput kliknite `run-local.bat`.
4. Otvorite `http://localhost:3000`.

## Start kroz terminal

```bash
cp .env.example .env
node server.mjs
```

Nema `npm install` koraka jer aplikacija koristi samo ugrađene Node.js module.

## Lokalni pristupi

Player test vaučer:

```text
MTH-TEST-ALL
```

Razvojni admin:

```text
Email: admin@mth.local
Lozinka: MTH-Admin-2026!
```

Ove vrijednosti služe samo lokalnom razvoju. Prije produkcije promijenite `.env`.

## Produkcijski `.env`

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_FILE=./data/mth.sqlite
APP_ORIGIN=https://play.vasdomen.me
TOKEN_PEPPER=minimum-24-karaktera-duga-slucajna-vrijednost
ADMIN_EMAIL=admin@vasdomen.me
ADMIN_PASSWORD=vrlo-jaka-lozinka-minimum-12-karaktera
INTEGRATION_API_KEY=dugacak-kljuc-za-prodajnu-stranicu
ENABLE_DEV_TEST_VOUCHER=false
SESSION_HOURS=12
PLAYER_ACCESS_DAYS=30
```

Server odbija produkcijski start ako ključne tajne nijesu podešene.

## Docker

```bash
cp .env.example .env
# Uredite .env i postavite jake produkcijske vrijednosti.
docker compose up -d --build
```

SQLite fajl ostaje sačuvan u Docker volumenu `mth-data`.

## Player flow

1. Korisnik kupuje na drugoj stranici.
2. Admin ili prodajni sistem generiše vaučer.
3. Korisnik unosi kod.
4. Vidi samo ture koje paket pokriva.
5. Otvara detalj ture sa ugrađenom mapom cijele rute.
6. Unosi ime posade, kapetana i broj igrača.
7. Bira GPS uživo ili test simulaciju, kada je test pristup dozvoljen.
8. Mapa prikazuje aktivnu stanicu i položaj posade.
9. Na lokaciji se otključava zadatak.
10. Server provjerava odgovor i GPS uslov.
11. Dokaz se dodaje u dosije, poeni se upisuju i otključava se sljedeća stanica.
12. Poslije pete stanice otvara se finale.

## Admin panel

- **Pregled** - osnovna statistika
- **Ture i sadržaj** - metadata, priča, stanice, zadaci, dokazi, bonusi i događaji
- **Vaučeri** - generisanje, paket, broj igrača, rok, dozvoljene ture, referenca eksterne kupovine
- **Aktivne igre** - status, posada, rezultat, napredak, događaji i reset sesije
- **Testiraj** - admin kreira privremeni test pristup za izabranu turu

## Baza

Glavne tabele:

- `admin_users`
- `admin_sessions`
- `tours`
- `vouchers`
- `player_access`
- `game_sessions`
- `game_events`
- `audit_log`

Vaučer i session tokeni se u bazi čuvaju samo kao SHA-256 hash sa serverskim pepperom. Admin lozinke se čuvaju preko `scrypt` derivacije.

## Integracija sa prodajnom stranicom

Prodajni backend nakon uspješne kupovine poziva:

```http
POST /api/integrations/vouchers
X-MTH-API-Key: <INTEGRATION_API_KEY>
Content-Type: application/json

{
  "externalRef": "ORDER-1042",
  "label": "Flex paket",
  "value": 89,
  "maxPlayers": 6,
  "allowedTourIds": ["<database-tour-id>"],
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

Odgovor sadrži novi kod. Prodajna stranica ga zatim prikazuje kupcu i šalje emailom. Poziv mora ići sa servera prodajne stranice, nikada iz browsera.

## API

### Player

- `POST /api/player/redeem`
- `GET /api/player/access`
- `POST /api/player/select-tour`
- `POST /api/player/sessions`
- `GET /api/player/sessions/:publicId`
- `PATCH /api/player/sessions/:publicId`
- `POST /api/player/sessions/:publicId/hint`
- `POST /api/player/sessions/:publicId/answer`
- `POST /api/player/sessions/:publicId/sidequest`

### Admin

- `POST /api/integrations/vouchers` - server-to-server kreiranje poslije kupovine

### Admin

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/dashboard`
- `GET /api/admin/tours`
- `GET|PUT /api/admin/tours/:id`
- `POST /api/admin/tours/:id/preview`
- `GET|POST /api/admin/vouchers`
- `PATCH /api/admin/vouchers/:id/status`
- `GET /api/admin/sessions`
- `GET /api/admin/sessions/:id`
- `POST /api/admin/sessions/:id/reset`

## Važna produkcijska napomena

Ova verzija je pogodna za VPS, Docker, Railway, Fly.io ili drugi Node hosting sa trajnim diskom. Klasični serverless hosting sa nestalnim filesystemom nije odgovarajući za SQLite. Za takav hosting treba zamijeniti `src/db.mjs` PostgreSQL adapterom, dok frontend i API ugovor mogu ostati isti.

Prije naplate obavezno fizički proći svih 30 stanica i potvrditi GPS radijuse, bezbjednost, pristup, radno vrijeme i pitanja sa pozicije igrača.
