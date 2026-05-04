# Supabase setup za imaposla.me

Project URL:

```text
https://fjfnnpgaveoonfmwztnr.supabase.co
```

Publishable key je upisan u `supabase.js`. Secret key se ne stavlja u frontend.

## Redosljed za novi Supabase projekat

1. Supabase Dashboard -> SQL Editor -> New query.
2. Pokreni `supabase-schema.sql`.
3. Authentication -> Providers -> Email mora biti uključen.
4. Authentication -> Users -> Add user: kreiraj naloge iz `LAUNCH_ACCOUNTS.md`.
5. SQL Editor -> pokreni `launch-accounts.sql`.
6. Otvori sajt i testiraj:
   - `admin@imaposla.me`
   - `firma@imaposla.me`
   - `kandidat@imaposla.me`

## Šta `supabase-schema.sql` sada sadrži

- Auth trigger koji automatski pravi `profiles` red poslije registracije.
- Uloge `candidate`, `company`, `admin`.
- Zaštitu da običan korisnik ne može sam promijeniti svoju ulogu.
- Tabele za profile, firme, oglase, prijave, faze prijava, planove, narudžbe, pretplate, banere i dokaze uplata.
- `profiles.cv_data` i `profiles.cv_updated_at` za CV builder bez uploadovanih CV fajlova.
- Private bucket `payment-proofs` za dokaze uplata.
- Row Level Security pravila za javni dio, kandidata, firmu i upravljanje.

## Šta je povezano u frontendu

- Javni oglasi čitaju samo `active` oglase.
- Javni profili firmi čitaju samo odobrene firme.
- Firma može kreirati profil firme, oglas, narudžbu plana, baner i dokaz uplate.
- Oglas ide u `pending_review` dok ga upravljanje ne odobri.
- Kandidat pravi biografiju u CV builderu i šalje prijavu bez upload fajla.
- Firma vidi samo prijave na svoje oglase.
- Upravljanje vidi korisnike, firme, oglase, uplate i banere.

## Važno za postojeći Supabase projekat

Ako je baza već napravljena starim query-jima, nemoj nasumično pokretati stare SQL fajlove. Prvo provjeri koje tabele i policies postoje. Najčistiji put je da se za postojeću bazu napravi jedna migracija koja je usklađena sa trenutnim `supabase-schema.sql`.

## Nije dio MVP-a

- Automatska e-pošta za svaku promjenu statusa.
- Kartično plaćanje.
- Fakture.
- Javni profili kandidata.
- Finalni pravni tekstovi od advokata.
