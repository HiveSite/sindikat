# MINI-SAJT FACTORY — PREMIUM 9/10 HARD GATE

Ovaj dokument je obavezan za svaki novi Factory sajt. Cilj nije demo koji samo radi, nego završen premium web proizvod koji je dovoljno jak da se pokaže vlasniku bez objašnjavanja.

## 1. SCORE FLOOR

- cilj svakog sajta: realnih 90/100 ili više kada su dostupni kvalitetni podaci i fotografije
- apsolutni minimum za LIVE_DEMO ostaje 85/100
- nijedna kategorija ne smije biti ispod 8/10
- Art direction, Content, Mobile UX i Technical QA moraju biti najmanje 9/10 za oznaku PREMIUM_READY
- ako jedna hard-gate kategorija padne, ukupan zbir ne može sakriti problem

## 2. OBAVEZNI SLOJEVI

Svaki sajt mora imati:

- jedinstven Profession Experience Model
- jedinstven Brand Personality + WE ARE / WE ARE NOT
- najmanje 6 smislenih sekcija kada sadržaj to podržava
- jasan identity moment
- detaljnu realnu ponudu
- najmanje jedan profession-specific signature element
- najmanje dva conversion momenta
- trust/proof sloj bez izmišljanja
- owner/manager voice
- kontakt
- stvarnu lokaciju
- stvarni Google Maps embed
- mobilni conversion model
- najmanje tri media uloge

## 3. MEDIA CONTRACT

Svaki sajt mora uvijek imati vizuelni sadržaj.

Minimalne uloge:

- `hero`
- `detail`
- `gallery`

Dodatne preporučene:

- `interior`
- `exterior`
- `service`
- `team`
- `location`
- `about`

Ako stvarna fotografija još nije uploadovana:

- koristi profession-specific placeholder ilustraciju/grafiku
- placeholder mora odgovarati Design DNA sajta
- ne koristiti generički sivi box
- ne koristiti istu placeholder kompoziciju kroz portfolio
- sajt nikad ne smije imati praznu rupu za fotografiju

Kada korisnik uploaduje fotografiju kroz Factory Media Studio:

- stvarna fotografija automatski preuzima odgovarajuću media ulogu
- placeholder se više ne prikazuje
- upload ne smije rušiti layout
- `object-fit`, crop i focal point moraju ostati kontrolisani
- alt tekst je obavezan prije finalnog client-ready statusa

## 4. MAP HARD GATE

Svaki sajt mora imati stvarni embed konkretne lokacije.

Obavezno:

- Google Maps iframe ili drugi stvarni map embed
- `title` na iframe-u
- responsive visina
- bez horizontalnog scrolla
- dugme `Otvori Google Maps` / `Navigacija`
- potvrđen business query/adresa

Ako lokacija nije potvrđena:

- BUILD BLOCKED
- nema QA PASS
- nema LIVE_DEMO

## 5. OWNER VOICE HARD GATE

Public copy mora zvučati kao vlasnik/menadžer/brand.

Zabranjeno na javnom sajtu:

- `javni izvori navode`
- `javni profil`
- `listing`
- `review izvori`
- `istraživanje pokazuje`
- `prema dostupnim podacima`
- objašnjavanje konflikta izvora
- objašnjavanje kako je demo istražen

Interni source ledger zadržava provenance. Javni sajt ne prikazuje research proces.

Ako je podatak konfliktan:

- izostavi spornu vrijednost
- ili koristi prirodan CTA: `Za aktuelno radno vrijeme pozovi prije dolaska.`

## 6. CONTENT DEPTH

Premium sajt ne smije biti kratka landing skica.

Kada materijal dozvoljava, ciljaj 7-11 content momenata kroz:

- identity
- offer
- experience
- proof
- process / how it works
- profession-specific educational moment
- atmosphere / media
- FAQ / objection removal
- location
- action

Ne dodavati prazne sekcije radi broja.

## 7. VISUAL DIFFERENCE HARD GATE

Novi sajt mora biti strukturno drugačiji od posljednjih 5.

Boja i font se ne računaju kao strukturna razlika.

Mora se razlikovati najmanje u 6 od ovih 10:

1. hero model
2. navigation model
3. section order
4. main grid
5. offer presentation
6. signature UI
7. photography geometry
8. conversion model
9. mobile composition
10. footer / closing composition

Ako su hero + offer + section order isti kao drugom sajtu:

- automatski REDESIGN

## 8. SWAP TEST

Zamijeni naziv, boje i tekst drugim biznisom.

Ako sajt i dalje djeluje smisleno za drugu profesiju:

- FAIL
- redesign

## 9. MOBILE 9/10

Posebno dizajnirati:

- mobile hero
- mobile media crops
- nav
- section pacing
- CTA bar
- map height
- font scale
- tap targets >=44px
- safe-area
- bez preklapanja sticky elemenata

Responsive resize nije dovoljan.

## 10. TECHNICAL 9/10

Obavezno:

- standalone output
- jedan H1
- semantic landmarks
- noindex/nofollow/noarchive
- `:focus-visible`
- `prefers-reduced-motion`
- real CTA linkovi
- bez `href="#"`
- bez fake formi
- embed mapa
- najmanje 3 media slota
- lazy loading za non-hero media
- bez horizontalnog scrolla
- bez console errora kada je browser QA dostupan

## 11. PRODUCTION BUILD GUARD

Live hosting build mora provjeriti minimum:

- page depth >= 6 sections
- exactly one H1
- media slots >= 3
- embedded map exists
- no fake href
- noindex exists
- focus-visible exists
- reduced-motion exists

Ako bilo šta od ovoga nedostaje:

- production build FAIL
- stranica se ne računa kao objavljena

## 12. DEFINITION OF PREMIUM_READY

Sajt je PREMIUM_READY tek kada:

- djeluje kao završeni pravi sajt biznisa
- sadržajno nije tanak
- public copy zvuči kao sam biznis
- ima jasnu i jedinstvenu art direction logiku
- vizuelno ne liči na prethodne Factory sajtove
- ima media fallback i može odmah prihvatiti korisničke fotografije
- ima stvarnu mapu
- mobile verzija je namjerno komponovana
- nema lažne funkcije
- svi glavni CTA-i rade
- Premium Score >= 90 kada su izvršivi QA slojevi dostupni

Najvažnije: standardizujemo kvalitet i tehnički sistem, nikad izgled.
