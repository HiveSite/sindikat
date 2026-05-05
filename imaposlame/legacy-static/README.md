# imaposla.me

`imaposla.me` je Supabase povezana platforma za oglase za posao, firme, prijave kandidata, selekciju prijava i ručne uplate.

## Glavni djelovi sajta

- Javno: početna, oglasi, detalj oglasa, gradovi, kategorije, firme, za firme, pravne/info stranice.
- Kandidat: pregled, biografija, moje prijave, obavještenja i podešavanja.
- Firma: pregled, oglasi, novi oglas, selekcija prijava, kandidati, pretplata, baneri i podešavanja.
- Upravljanje: skriveni admin dio za oglase, firme, korisnike, uplate, banere i statistike.

## Backend

Frontend koristi Supabase preko `supabase.js`:

- Auth za prijavu i registraciju.
- PostgreSQL tabele za profile, firme, oglase, prijave, planove, narudžbe, banere i dokaze uplata.
- Row Level Security za razdvajanje prava kandidata, firmi i upravljanja.
- Private storage bucket `payment-proofs` za dokaze uplata.

Biografija kandidata se ne čuva kao uploadovan CV fajl. Kandidat koristi ugrađeni CV builder, podaci se čuvaju u `profiles.cv_data`, a PDF se skida iz browsera.

## Pokretanje backend-a

Za novi Supabase projekat pokreni samo:

1. `supabase-schema.sql`
2. `launch-accounts.sql` nakon što ručno napraviš launch korisnike iz `LAUNCH_ACCOUNTS.md`

Stari split SQL fajlovi su uklonjeni da ne bi bilo konflikta redosljeda i duplih policies.

## Frontend fajlovi

- `index.html` učitava produkcioni frontend.
- `app.js` je glavni render i tok aplikacije.
- `role-flow.js` drži role flag i sigurnu odjavu bez prepisivanja početne stranice.
- `cv-builder.js` vodi kandidat biografiju i PDF izvoz.
- `live-ready.js` dodaje tok ručne uplate i dokaz uplata.
- `live-admin-payments.js` daje upravljanju pregled dokaza uplata.
- CSS fajlovi drže izgled, mobilni prikaz, CV builder, ručne uplate i stabilnost teme.
