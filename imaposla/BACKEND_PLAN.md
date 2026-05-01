# Backend plan za imaposla.me

Prva preporuka je Supabase kao MVP backend: PostgreSQL baza, Auth, Storage i Row Level Security. Custom backend možemo dodati kasnije za plaćanja, napredne email tokove i automatizacije.

## Uloge

- `guest`: javni posjetilac
- `candidate`: kandidat koji traži posao
- `company`: firma/poslodavac
- `admin`: administracija platforme

## Javni dio

- `/` početna
- `/oglasi` lista i filteri
- `/oglasi/[slug]` detalj oglasa
- `/gradovi` hub gradova
- `/gradovi/[grad]` SEO lista po gradu
- `/kategorije` hub kategorija
- `/kategorije/[slug]` SEO lista po kategoriji
- `/firme` lista poslodavaca
- `/firme/[slug]` profil firme
- `/kandidati/[user]` javni profil kandidata, samo ako kandidat dozvoli
- `/za-firme` landing za poslodavce
- `/login` i registracija

## Kandidat

- Dashboard sa CV procentom, prijavama i obavještenjima
- CV editor i upload CV fajla
- Lista prijava sa statusom
- Obavještenja
- Podešavanja privatnosti

## Firma

- Dashboard sa brzim akcijama
- Upravljanje oglasima
- Forma za novi oglas
- ATS po oglasu
- Baza kandidata i unlock pravila
- Pretplata i uplate
- Baneri
- Podešavanja firme

## Admin

- Operativni dashboard
- Uplate i aktivacioni kodovi
- Moderacija oglasa
- Korisnici i firme
- Baneri
- Statistike

## MVP faze

### Faza 1: osnovni sistem

- Supabase Auth
- Profili korisnika
- Firme
- Oglasi
- Prijave na oglase
- Upload CV fajla
- Firma vidi prijave na svoje oglase
- Admin odobrava oglase

### Faza 2: ATS i obavještenja

- Faze prijave
- Komentari firme
- Oznake kandidata
- Notifikacije kandidatu
- Email obavještenja za prijave

### Faza 3: pretplate

- Planovi
- Narudžbine
- Manualna bankovna uplata
- Admin potvrda
- Aktivacioni kodovi
- Krediti za dodatne funkcije

### Faza 4: SEO i rast

- Dinamičke SEO stranice za gradove i kategorije
- Sitemap
- Robots
- Baneri
- Statistike i izvještaji

## Sigurnosna pravila

- Kandidat vidi samo svoj profil i svoje prijave.
- Firma vidi samo svoje oglase i prijave na svoje oglase.
- Admin vidi sve.
- Kontakt kandidata nije javno dostupan.
- CV fajlovi nisu javni fajlovi.
- Service role key se ne smije koristiti u browseru.
