# MINI-SAJT FACTORY - AUTONOMOUS DAILY RUN

Ovaj dokument je source of truth za automatski dnevni run Mini-Sajt Factory sistema u repozitorijumu `HiveSite/sindikat`.

## CILJ

Svaki dnevni run treba da pokuša da isporuči do 5 NOVIH premium demo sajtova za stvarne aktivne lokalne biznise u Crnoj Gori koji nemaju aktivan sopstveni sajt.

Kvalitet ima prednost nad kvotom. Ne graditi loš peti sajt samo da bi broj bio 5.

## OBAVEZNI REDOSLJED

1. Pročitaj `data/preporuke-registry.csv` prije bilo kakvog discovery rada.
2. Pročitaj posljednji `mini-sajt-factory/data/daily-manifest.json`.
3. Discovery većeg broja potencijalnih leadova.
4. Dedupe po Google identitetu / Maps URL-u, telefonu, pa normalizovanom nazivu + gradu.
5. Potvrdi da objekat radi. Kada je moguće koristi najmanje dva aktuelna signala.
6. Provjeri da li ima aktivan sopstveni web sajt/domen.
7. Ako ima svoj aktivni sajt: `SKIPPED_HAS_SITE` i ne graditi.
8. Ako je trajno zatvoren: `SKIPPED_CLOSED` i ne graditi.
9. Ako je status rada nepoznat ili konfliktan: ne graditi dok se ne potvrdi.
10. Istraži kontakt, lokaciju, radno vrijeme, ponudu, reputaciju, fotografije i conversion kanale.
11. Kvalifikuj A/B/C/D/PRESKOČITI.
12. Za build biraj samo A ili B kandidate koji imaju dovoljno potvrđenih podataka da se sajt napravi bez izmišljanja.
13. Nastavi discovery dok ne dobiješ do 5 dobrih kandidata ili dok realno nema više kvalitetnih kandidata za taj run.
14. Za svakog odabranog napravi Brand Personality, WE ARE / WE ARE NOT, Design DNA, content architecture i art direction prije HTML-a.
15. Napravi potpuno personalizovan standalone `index.html`.
16. Uradi QA i izračunaj Premium Score.
17. Ako je Premium Score <85 ili QA ne prolazi, redizajniraj ili preskoči taj kandidat. Ne označavaj ga LIVE.
18. Finalni sajt ide u `preporuke/{slug}/index.html`.
19. Tek nakon stvarne live provjere update registry na `LIVE_DEMO`.
20. Ažuriraj `mini-sajt-factory/data/daily-manifest.json` sa stvarnim rezultatima runa.
21. Ne šalji email, DM, WhatsApp/Viber poruku, cijenu, ponudu ili demo link klijentu bez eksplicitnog approvala korisnika.

## HARD GATE - REGISTRY

Postojeći statusi koje treba poštovati:
- `IN_PROGRESS`
- `LIVE_DEMO`
- `SKIPPED_HAS_SITE`
- `SKIPPED_CLOSED`
- `ARCHIVED`

Ako je `LIVE_DEMO`, ne pravi novi demo.
Ako je `IN_PROGRESS`, nastavi postojeći slug umjesto pravljenja duplikata.
Ako je `SKIPPED_HAS_SITE`, `SKIPPED_CLOSED` ili `ARCHIVED`, preskoči osim ako korisnik izričito ne traži novu provjeru.

## HARD GATE - STATUS RADA

Dozvoljeno za build samo kada je status dovoljno potvrđen kao `RADI`.
Ne graditi za privremeno/traјno zatvoren ili nepoznat status.

## HARD GATE - SOPSTVENI SAJT

Ciljamo isključivo biznise bez aktivnog sopstvenog sajta.
Booking, Airbnb, TripAdvisor, Instagram, Facebook, Google Business i direktorijumi se ne računaju kao sopstveni sajt.

## RESEARCH I SOURCE CONFIDENCE

Za bitne podatke čuvaj vrijednost, izvor, URL, datum provjere i confidence:
- `POTVRĐENO`
- `VJEROVATNO TAČNO`
- `KONFLIKT`
- `NEPOTVRĐENO`
- `NIJE PRONAĐENO`

Ne izmišljaj podatke radi popunjavanja praznina.

## CONTENT / PHOTO / MENU / CONVERSION READINESS

Content readiness: `READY`, `PARTIAL`, `NONE`.
Photo readiness: `STRONG`, `MEDIUM`, `WEAK`.
Menu readiness: `FULL`, `PARTIAL`, `NONE`.
FAQ readiness: `READY`, `PARTIAL`, `NONE`.

Ako nema kompletnog menija, ne predstavljaj djelimičnu ponudu kao kompletan meni.
Ako nema dovoljno fotografija, koristi tipografiju, kompoziciju i manje kvalitetnih vizuala umjesto dupliranja slika.

Conversion prioritet:
1. stvarni rezervacioni sistem
2. telefon
3. potvrđeni WhatsApp
4. email
5. Instagram/Facebook
6. Google Maps

Svaki CTA mora voditi na stvarnu akciju.

## KVALIFIKACIJA

A/B kandidat tipično:
- radi
- nema sopstveni sajt
- nije ranije obrađen
- ima jasan kontakt
- ima dovoljno relevantnog sadržaja
- ima dobre vizuale ili dovoljno sadržaja da dizajn može biti premium bez lažiranja
- postoji jasan problem koji web sajt rješava
- postoji realna vrijednost jednog profesionalnog linka

## DESIGN ENGINE

Prije builda obavezno definiši:
- Brand Personality
- WE ARE
- WE ARE NOT
- Design DNA
- Content Architecture

Design DNA minimum:
- hero type
- navigation type
- main grid
- container behavior
- dominant geometry
- radius system
- elevation/shadow system
- surface rhythm
- accent color role
- typography personality
- display font
- body font
- type scale
- photography geometry
- gallery type
- menu type
- review type
- CTA type
- mobile conversion model
- motion character
- signature component
- footer type
- section order

Art direction mora dolaziti iz konkretnog biznisa, lokacije, enterijera, ponude, publike, fotografija i karaktera - ne iz kategorijskog klišea.

## ANTI-TEMPLATE

Svaki sajt mora imati najmanje jedan smislen signature element.
Novi sajt poredi sa prethodnim demoima. Ako djeluje kao isti template sa drugim bojama, redizajniraj.
Cilj je približno <=40% Design DNA sličnosti sa bliskim prethodnim demoima.

Standardizuj kvalitet, funkcionalnost, accessibility, performance i QA. Ne standardizuj izgled.

## CONTENT ARCHITECTURE

Stranica treba da odgovori na:
- šta je ovo mjesto/biznis
- zašto je relevantno
- šta konkretno nudi
- kako izgleda/osjeća se
- zašto da mu se vjeruje
- koje nedoumice treba ukloniti
- gdje je
- kako stupiti u kontakt

Ne koristi univerzalni section order za sve sajtove.

## FOTOGRAFIJE

Prioritet su provjerljive fotografije iz zvaničnih izvora biznisa ili korisnički upload.
Ne predstavljaj stock kao stvarnu fotografiju objekta.
Ne ponavljaj istu fotografiju više puta kroz sajt, uključujući resize/crop varijante.
Ako prava na korišćenje nisu dovoljno jasna, radije napravi dizajn sa manje fotografija nego da ubaciš sporan asset.

## MOBILE

Mobile nije samo resize. Posebno definiši:
- mobile hero crop
- h1 size
- navigation behavior
- gallery behavior
- CTA behavior
- map height
- section padding
- stacking
- quick bar
- touch targets >=44px

## ACCESSIBILITY

Obavezno:
- jedan h1
- pravilna heading hijerarhija
- semantic HTML i landmarks
- skip-to-content
- focus-visible
- keyboard navigation
- alt tekstovi
- aria-label za icon-only kontrole
- WCAG AA kontrast gdje je moguće
- prefers-reduced-motion
- tap target >=44px
- boja nije jedini indikator

## PERFORMANCE

- optimizovane slike kada je moguće
- width/height ili aspect-ratio
- lazy loading za nehero slike
- decoding async
- minimalan JS
- ne uvoditi framework u finalni demo
- bez horizontalnog scrolla
- bez console errors

## FAKE UI JE ZABRANJEN

Ne koristiti:
- `href="#"` za funkcionalne akcije
- fake forms
- lažnu rezervaciju
- dugme koje ništa ne radi
- fake ratings
- fake stats

## STANDALONE HARD GATE

Finalni folder mora biti samo:
`preporuke/{slug}/index.html`

Finalni `index.html` mora sadržati sav lokalni CSS i JS inline i ne smije zavisiti od lokalnog `style.css`, `app.js`, JSON fajlova, image foldera, component partiala ili framework bundlea.

Dozvoljeni eksterni resursi samo kada imaju smisla: potvrđene remote fotografije, Google Maps embed, web font provider, stvarni reservation servis i stvarni eksterni linkovi.

Svaki demo mora imati:
`<meta name="robots" content="noindex, nofollow, noarchive">`

## QA

Minimalno provjeri:
- interakcije
- responsive
- visual consistency
- accessibility
- robustness
- console/network/performance kada su dostupni alati
- content accuracy
- image duplicate/load/crop QA
- art direction
- portfolio similarity
- standalone QA

Ako browser QA nije stvarno izvršen, ne tvrdi da je prošao. Ako to blokira LIVE prema pravilima, ostavi sajt kao build/QA rezultat i nastavi sa drugim kandidatom.

## PREMIUM SCORE

Maksimum 100:
- Art Direction 20
- Photography 15
- Content 15
- Typography 10
- Layout/Pacing 10
- Mobile UX 10
- Conversion 5
- Accessibility 5
- Performance 5
- Technical QA 5

90-100 = Excellent
85-89 = Prodajno spremno
80-84 = Potrebna dorada
<80 = Ne ide live

Minimalni prag za `LIVE_DEMO` je 85/100 uz prolazak hard gateova i obaveznih QA provjera.

## ACCOMMODATION / BOOKING

Za hotel, apartmane, vilu, hostel, sobe i druge smještaje provjeri booking opportunity.
Ako nemaju svoj booking sistem, označi `OFFER`.
NE PRAVI Apps Script / Sheets booking sistem prije eksplicitnog approvala korisnika.
Nakon approvala booking je zaseban workflow.

## SIGURNOSNI FILTER KATEGORIJA

Ne uključuj kao prospecte biznise primarno vezane za:
- kockanje / klađenje
- prodaju alkohola ili druge opojne proizvode
- nikotin/vape
- oružje
- drogu ili druge regulisane opasne proizvode
- pornografski/adult sadržaj

## DNEVNI MANIFEST

`mini-sajt-factory/data/daily-manifest.json` treba da sadrži:
- `date`
- `status`
- `target`
- `discovered_count`
- `qualified_count`
- `completed_count`
- `projects[]`

Za svaki projekat:
- name
- slug
- city
- type
- grade
- premium_score
- repo_path
- live_url samo ako je stvarno provjeren
- booking_opportunity
- status
- blockers[]

## KOMUNIKACIJA

Dnevni autonomni run završava na pripremi prodajnog materijala. Ne kontaktira prospecte samostalno.
