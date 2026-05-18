# imaposla.me — Redesign / Production Polish Report

Datum: 2026-05-17

## Cilj

Prenijeti preglednost i raspored iz `preview.html` mockup-a na postojeći Next/Supabase sajt, ali bez pravljenja demo-only funkcionalnosti i bez lomljenja postojećih backend tokova.

## Izmijenjeni fajlovi na grani

| Fajl | Šta je urađeno |
|---|---|
| `app/production-polish.css` | Novi završni CSS sloj: dashboard/grid sistem, responzivni layout, zaštita od overflow/preklapanja, sređene kartice oglasa, admin kartice, forme, ATS layout, search bar, section head i mobile breakpoints. |
| `app/layout.tsx` | Uvezen `production-polish.css` poslije `globals.css`, tako da polish radi bez rizika da se prepiše postojeći osnovni stil. |
| `REDESIGN_REPORT.md` | Ovaj izvještaj sa pregledom urađenog i QA koracima. |

## Šta je konkretno popravljeno u UI/UX-u

- Dashboard layout je stabilniji na desktopu i mobilnom.
- `section-head` sada bolje odvaja naslov i akcije.
- Kartice oglasa se prelamaju sigurnije na manjim ekranima.
- Dugački naslovi, emailovi, URL-ovi i opisi ne izlaze iz okvira.
- Dugmad, filteri i akcije imaju sigurnije širine i wrapping.
- Admin kartice imaju stabilniji raspored i bolju mobile adaptaciju.
- Firma job kartice i akcije bolje se slažu na manjim širinama.
- ATS panel ima sigurniji sticky/detail layout i mobile fallback.
- Forme koriste grid koji se ruši na jednu kolonu na mobilnom.
- Dodati su mobile breakpoints za smanjenje rizika preklapanja elemenata.

## Šta treba ručno testirati prije merge/deploy

1. Homepage na desktopu i mobilnom.
2. `/oglasi` filtere i kartice oglasa.
3. `/oglasi/[slug]` detalj oglasa i prijavu kandidata.
4. Login/register/logout.
5. Kandidat dashboard, biografiju, sačuvane oglase i prijave.
6. Firma dashboard, profil firme, novi oglas, moji oglasi i pretplatu.
7. ATS `/firma/selekcija` na desktopu i mobilnom.
8. Admin dashboard, oglase, firme, korisnike i uplate.
9. Upload avatar/logo/banner bez SVG fajlova.
10. Supabase RLS i migracije na live bazi.

## Preostalo za narednu fazu

- Dodati admin UI za audit log.
- Prebaciti najosjetljivije admin akcije u server-side RPC/server action sloj.
- Završiti stvarne email job alerts.
- Završiti ili sakriti worker ratings.
- Dodati account deletion flow ako je potreban za produkciju.
