# Supabase setup za imaposla.me

Project URL:

```text
https://fjfnnpgaveoonfmwztnr.supabase.co
```

Publishable key je upisan u `supabase.js`. Secret key se ne stavlja u frontend.

## Redosljed za launch

1. Supabase Dashboard -> SQL Editor -> New query.
2. Ako vec nisi: pokreni `supabase-schema.sql`.
3. Pokreni najnoviji `supabase-auth-policies.sql`.
4. Authentication -> Providers -> Email mora biti ukljucen.
5. Authentication -> Users -> Add user: kreiraj naloge iz `LAUNCH_ACCOUNTS.md`.
6. SQL Editor -> pokreni `launch-accounts.sql`.
7. Otvori sajt i testiraj:
   - `admin@imaposla.me`
   - `firma@imaposla.me`
   - `kandidat@imaposla.me`

## Sta je povezano u frontendu

- Supabase client se ucitava preko `supabase.js`.
- Javni oglasi i firme citaju se iz Supabase tabela.
- Registracija i prijava koriste Supabase Auth.
- Firma moze kreirati profil firme i oglas.
- Oglas ide u `pending_review` dok admin ne odobri.
- Kandidat moze poslati prijavu na oglas.
- Kandidat moze uploadovati CV u private bucket `candidate-cv`.
- Admin moze vidjeti korisnike, firme, oglase i odobravati/pauzirati oglase.

## Sta ostaje poslije osnovnog launch-a

- Email notifikacije.
- Napredna naplata i fakture.
- Javni profili kandidata.
- Detaljna ATS istorija i komentari.
- Finalni pravni tekstovi za privatnost i uslove.
