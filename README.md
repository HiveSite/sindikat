# imaposla.me Next.js verzija

Ovo je nova Next.js verzija sajta u posebnom folderu `imaposlame`. Postojeci live frontend u folderu `imaposla` nije mijenjan.

## Sta je prebaceno

- Prave Next rute bez `#/` adresa.
- Javni dio: pocetna, oglasi, detalj oglasa, gradovi, kategorije, firme, za firme, pravne stranice.
- Auth: prijava i registracija preko Supabase-a.
- Kandidat: pregled, biografija/CV builder, moje prijave.
- Firma: profil, oglasi, novi oglas, selekcija prijava, pretplata i dokaz uplate.
- Upravljanje: oglasi, firme, korisnici i dokazi uplata.
- Supabase query sloj u `lib/queries`.
- Browser Supabase klijent u `lib/supabase/client.ts`.
- Public Supabase klijent za server komponente u `lib/supabase/server.ts`.
- Middleware zastita za kandidat, firma i upravljanje rute.

## Pokretanje

```bash
cd imaposlame
npm install
npm run dev
```

Ako zelis env fajl:

```bash
copy .env.example .env.local
```

Env varijable su obavezne. Aplikacija namjerno ne koristi hardcoded Supabase fallback, da staging ili lokalni rad ne bi slucajno pisali u produkcionu bazu.

## Supabase

Prije produkcionog deploy-a pokreni `supabase-production.sql` kao novi query u Supabase SQL editoru. Taj fajl dodaje:

- automatsko pravljenje `profiles` reda poslije registracije
- `cv_data` i `cv_updated_at` za CV builder
- `payment_proofs` tabelu i privatni `payment-proofs` bucket
- `confirm_payment_proof` RPC za sigurnu admin potvrdu uplate
- pravila za firme, oglase, planove, narudzbe, dokaze uplate i pretplate
- zastitu da korisnik ne moze sam sebi promijeniti ulogu

## Napomena

Ovo je Next.js migracija cijelog sajta. Za launch obavezno proci QA kroz sva 4 tipa korisnika: gost, kandidat, firma i upravljanje.
