# OWNER / MANAGER VOICE HARD GATE

Ovo pravilo važi za SAV javni copy u `preporuke/{slug}/index.html`.

## Glavno pravilo

Research i source provenance ostaju isključivo u internom source ledgeru, research bilješkama i QA dokumentaciji.

Na javnoj stranici copy mora zvučati kao da ga je napisao vlasnik, menadžer ili osoba koja vodi objekat — prirodno, neposredno, konkretno i bez istraživačkog jezika.

## Zabranjeno u javnom copyju

Ne smije se pojavljivati formulacija tipa:

- `javni izvori navode`
- `javni profil navodi`
- `javni listing navodi`
- `prema javnim izvorima`
- `recenzije pominju`
- `review izvori`
- `aktuelni listing`
- `prethodni javni materijali`
- `javno potvrđeno`
- `izvor potvrđuje`
- `nije javno potvrđeno`
- `prema dostupnim podacima`
- `istraživanje pokazuje`
- `profil ordinacije/restorana/salona navodi`

To su interne research formulacije, ne korisnički sadržaj.

## Kako se piše

Činjenicu zadržati, provenance ukloniti.

Primjeri:

- `Javni profil navodi walk-in pristup.` → `Možeš svratiti i bez komplikovane online rezervacije.`
- `Javni listing navodi rad 09–20h.` → `Radimo od 09:00 do 20:00.`
- `Javni profil navodi burek, mantije i gyros.` → `U ponudi su burek, mantije i gyros.`
- `Oralna hirurgija je javno istaknuta.` → `Poseban fokus ordinacije je oralna hirurgija.`
- `Javni profil navodi devet tretmana.` → `U salonu možeš birati između devet tretmana.`
- `Javni direktorij vodi objekat kao auto servis.` → `Bavimo se auto-servisnim uslugama u Nikšiću.`

## Ton

Preferiraj:

- `Kod nas...`
- `Radimo...`
- `U ponudi su...`
- `Možeš...`
- `Za termin...`
- `Nalazimo se...`
- `Pozovi nas...`
- `Ako dolaziš prvi put...`

Ne pretjerivati sa prvim licem ako djeluje neprirodno. Dozvoljen je i neutralan brand copy koji zvuči kao sa zvaničnog sajta.

## Tačnost

Owner voice NE znači dozvolu za izmišljanje.

Svaka činjenica i dalje mora imati interni izvor i confidence status. Ako je podatak konfliktan ili nedovoljno siguran:

- ne prikazuj ga kao čvrstu činjenicu
- napiši korisnički korisnu formulaciju bez pominjanja izvora, npr. `Za aktuelno radno vrijeme pozovi prije dolaska.`

Ne objašnjavati posjetiocu ZAŠTO podatak nije prikazan niti govoriti da se izvori ne slažu.

## Public-copy QA

Prije publish-a pretraži finalni HTML case-insensitive za:

`javni|javno|izvor|listing|review|potvrđen|potvrđeno|istraživanje|prema dostupnim|materijali navode`

Svaki pogodak pregledaj ručno. Ako se odnosi na provenance/research jezik, rewrite je obavezan.

Ako javni copy zvuči kao izvještaj istraživača umjesto kao stvarni sajt objekta:

`OWNER VOICE QA = FAIL`

Takav demo ne može dobiti Premium Score >=85 niti `LIVE_DEMO` status.
