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
14. Za svakog odabranog prvo definiši PROFESSION INTERACTION MODEL, zatim Brand Personality, WE ARE / WE ARE NOT, Design DNA, content architecture i art direction prije HTML-a.
15. Napravi potpuno personalizovan standalone `index.html`.
16. Uradi profession-context QA, structural-diversity QA, standardni QA i izračunaj Premium Score.
17. Ako je Premium Score <85 ili bilo koji profession/diversity/QA gate ne prolazi, redizajniraj ili preskoči taj kandidat. Ne označavaj ga LIVE.
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
Ne graditi za privremeno/trajno zatvoren ili nepoznat status.

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

## PROFESSION INTERACTION MODEL - HARD GATE

Prije boja, fontova i layouta mora se odgovoriti: **kako korisnik mentalno doživljava baš ovu profesiju i koji realni poslovni ritual može da postane interfejs sajta?**

Primjeri principa, ne gotovi template-i:
- barber/frizer: stolica, ogledalo, red, rez, fade zone, prije/poslije logika, termin
- pekara/hrana: pult, dnevni ritam, svježa tura, meni tabla, jutro/ručak/veče, takeaway
- stomatologija: put pacijenta, konsultacija, tretmanske grane, stručnost, sigurnost, termin
- beauty: ritual njege, lookbook, kategorije tretmana, detalj, transformacija, termin
- auto servis: prijem vozila, dijagnostika, servisni nalog, radionica, status, poziv
- smještaj: izbor sobe, boravak, lokacija, dostupnost, booking putanja

Ovaj model mora direktno uticati na:
- strukturu prve strane
- navigaciju
- section order
- oblik ponude/usluga
- signature component
- conversion model
- mobilno ponašanje

Ako se profession interaction model može ukloniti, a sajt i dalje izgleda gotovo isto za drugu profesiju, FAIL.

## DESIGN ENGINE

Prije builda obavezno definiši:
- Profession Interaction Model
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
- menu/service type
- review/proof type
- CTA type
- mobile conversion model
- motion character
- signature component
- footer type
- section order

Art direction mora dolaziti iz konkretnog biznisa, lokacije, enterijera, ponude, publike, fotografija, profesije i karaktera - ne iz kategorijskog klišea.

## ANTI-TEMPLATE - STRUCTURAL HARD GATE

Boja i font se NE računaju kao dovoljna razlika.

Zabranjen je ponavljajući skelet tipa:
`veliki hero -> 3/4 service cards -> proof/stat -> contact`.

Za svaki novi sajt uporedi najmanje posljednja 3 relevantna demoa po ovim dimenzijama:
1. hero model
2. navigacioni model
3. glavni layout/grid
4. section order
5. način prikaza ponude/usluga
6. signature UI/metafora
7. conversion/CTA model
8. mobile interaction model
9. surface/geometry sistem
10. footer/završni model

**STRUCTURAL DIVERSITY PASS** zahtijeva:
- najmanje 6 od 10 dimenzija moraju biti suštinski različite od najbližeg prethodnog sajta
- hero + section order + offer module ne smiju sva tri biti isti kao kod bilo kog od prethodna 3 sajta
- ne smiju postojati 3 ili više uzastopnih sekcija sa istom funkcijom i istim rasporedom kao na drugom sajtu
- najviše 1 od 5 sajtova u dnevnom batchu smije koristiti klasični veliki dvokolonski hero
- najviše 1 od 5 smije koristiti klasični grid service cards kao glavni prikaz ponude
- svaki sajt mora imati drugačiji signature interaction/component koji ima smisla baš za profesiju

**SWAP TEST:** zamisli da promijeniš naziv, boje, telefon i tekst. Ako bi sajt i dalje uvjerljivo mogao da bude sajt druge profesije bez promjene strukture - FAIL i obavezan redesign.

Cilj Design DNA sličnosti nije samo <=40%; strukturalni hard gate ima prioritet nad numeričkim scoreom.

Standardizuj kvalitet, funkcionalnost, accessibility, performance i QA. Ne standardizuj izgled ni informacijski model.

## PROFESSION-CONTEXT QA

Prije odobravanja eksplicitno odgovori:
- Koji dio UI-a postoji samo zato što je ovo baš ova profesija?
- Koji je realni korisnički zadatak ove profesije postao glavni conversion put?
- Da li section order prati način na koji kupac razmišlja o ovoj usluzi/proizvodu?
- Da li signature komponenta prenosi nešto stvarno o poslu, a ne samo dekoraciju?
- Da li bi dizajn izgubio smisao ako bi se zamijenila profesija?

Ako je odgovor na posljednje pitanje NE - FAIL.

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

Ne koristi univerzalni section order za sve sajtove. Section order mora nastati iz profession interaction modela.

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
- profession-specific quick action
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
- profession-context QA
- structural-diversity QA
- swap test
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

Minimalni prag za `LIVE_DEMO` je 85/100 uz prolazak hard gateova i obaveznih QA provjera. Premium Score ne može preglasati profession-context ili structural-diversity FAIL.

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
