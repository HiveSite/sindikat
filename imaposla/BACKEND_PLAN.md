# Backend plan za imaposla.me

Backend je Supabase MVP: PostgreSQL, Auth, Row Level Security i Storage za dokaze uplata. Custom backend može doći kasnije za e-poštu, fakture, automatizacije i naprednu naplatu.

## Uloge

- `guest`: javni posjetilac
- `candidate`: kandidat koji traži posao
- `company`: firma/poslodavac
- `admin`: skriveni dio za upravljanje platformom

## Javni dio

- `/` početna
- `/oglasi` lista i filteri
- `/oglasi/[slug-id]` detalj oglasa
- `/gradovi` i `/gradovi/[grad]`
- `/kategorije` i `/kategorije/[kategorija]`
- `/firme` i `/firme/[slug-id]`
- `/za-firme`
- `/login`
- pravne/info stranice

## Kandidat

- Pregled kandidata
- CV builder bez upload fajlova
- PDF izvoz biografije iz browsera
- Moje prijave
- Obavještenja kroz status prijava
- Podešavanja profila

Biografija se čuva kao JSON u `profiles.cv_data`, ne kao fajl u Storage-u.

## Firma

- Profil firme
- Oglasi firme
- Novi oglas koji ide na provjeru
- Selekcija prijava po fazama
- Pregled kandidata koji su se prijavili na oglase te firme
- Pretplata kroz ručnu uplatu
- Slanje dokaza o uplati u private bucket `payment-proofs`
- Baneri na odobrenje

## Upravljanje

- Pregled korisnika
- Odobravanje firmi i oglasa
- Pauziranje/isticanje oglasa
- Pregled narudžbi i dokaza uplata
- Prihvatanje ili odbijanje dokaza uplate
- Odobravanje banera

## Sigurnost

- Novi Auth korisnik automatski dobija profil kroz trigger.
- Korisnik ne može sam sebi promijeniti ulogu.
- Kandidat vidi svoj profil i svoje prijave.
- Firma vidi svoje oglase i prijave na svoje oglase.
- Upravljanje vidi sve potrebno za moderaciju.
- Javno se vide samo aktivni oglasi i odobrene firme.
- Service role key se ne koristi u browseru.
- Dokazi uplata su u privatnom Storage bucket-u.

## Kasnije faze

- E-pošta za prijave i promjene statusa.
- Detaljna istorija svake prijave u korisničkom interfejsu.
- Napredni izvještaji za firme.
- Finalni pravni tekstovi.
- SEO poboljšanja izvan hash ruta ako bude potreban jači organski rast.
