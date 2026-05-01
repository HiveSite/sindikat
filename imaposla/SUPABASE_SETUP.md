# Supabase setup za imaposla.me

Project URL:

```text
https://fjfnnpgaveoonfmwztnr.supabase.co
```

Publishable key je upisan u `supabase.js`. Secret key se ne stavlja u frontend.

## Redosljed

1. Supabase Dashboard -> SQL Editor -> New query.
2. Pokreni `supabase-schema.sql`.
3. Zatim pokreni `supabase-auth-policies.sql`.
4. Authentication -> Providers -> Email mora biti ukljucen.
5. Za brzi test mozes privremeno iskljuciti email confirmation. Za produkciju ga ukljuci.
6. Storage bucketi se kreiraju iz SQL-a:
   - `avatars` public
   - `company-logos` public
   - `banners` public
   - `candidate-cv` private

## Sta je povezano u frontendu

- Supabase client se ucitava preko `supabase.js`.
- Pocetna, oglasi i firme prvo pokusavaju da citaju iz Supabase tabela.
- Ako tabele jos nisu napravljene ili su prazne, sajt ostaje na demo podacima.
- Login i registracija forma koriste Supabase Auth.

## Sta jos ostaje nakon SQL-a

- Upis novih oglasa u bazu.
- Prava prijava kandidata na oglas.
- Upload CV fajla u private bucket.
- Upload loga firme.
- Admin odobravanje oglasa/firme iz pravih tabela.
- Email notifikacije.
