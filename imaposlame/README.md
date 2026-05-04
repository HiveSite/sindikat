# imaposla.me Next.js verzija

Ovo je nova Next.js verzija sajta u posebnom folderu `imaposlame`. Postojeći live frontend u folderu `imaposla` nije mijenjan.

## Šta je prebačeno

- Prave Next rute bez `#/` adresa.
- Javni dio: početna, oglasi, detalj oglasa, gradovi, kategorije, firme, za firme, pravne stranice.
- Auth: prijava i registracija preko Supabase-a.
- Kandidat: pregled, biografija/CV builder, moje prijave.
- Firma: profil, oglasi, novi oglas, selekcija prijava, pretplata.
- Upravljanje: oglasi, korisnici i uplate.
- Supabase query sloj u `lib/queries`.
- Browser Supabase klijent u `lib/supabase/client.ts`.
- Public Supabase klijent za server komponente u `lib/supabase/server.ts`.

## Pokretanje

```bash
cd imaposlame
npm install
npm run dev
```

Ako želiš env fajl:

```bash
copy .env.example .env.local
```

## Napomena

Ovo je početna Next.js migracija cijelog sajta. Supabase šema ostaje ista kao u postojećem projektu. Za ozbiljan launch treba još proći QA kroz sva 4 tipa korisnika: gost, kandidat, firma i upravljanje.
