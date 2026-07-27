# Studio83 Maps

Studio83 Maps je generator umjetničkih mapa i postera sa interfejsom nalik modernoj Maps aplikaciji.

## Glavne funkcije

- Pretraga grada, adrese ili lokacije
- Ručno pomjeranje, zumiranje i rotacija mape
- Standardni i umjetnički prikaz
- Studio83 palete: Paper, Ink, Sand, Blueprint, Noir, Forest, Blush, Slate i Terracotta
- Kontrole puteva, zgrada, vode, zelenila, terena, pruge, granica i naziva mjesta
- Više markera sa izborom oblika, boje i veličine
- A-B ruta sa međutačkama
- Uređivanje naslova, države, koordinata, fontova i pozicije teksta
- Passepartout okvir, overlay, vignette i paper grain
- Formati 3:4, 4:5, 1:1, A4, A3 i dodatni social/banner formati
- PNG i PDF izvoz
- Mobilni panel sa kontrolama
- Čuvanje podešavanja i prilagođenih tema u browseru

## Najjednostavniji upload

1. Raspakuj ZIP.
2. Uploaduj kompletan sadržaj foldera na hosting.
3. Ne mijenjaj strukturu foldera `src/` i `public/`.
4. Početni fajl je `index.html`.
5. Sajt mora biti otvoren preko HTTP/HTTPS adrese. Nemoj ga pokretati direktnim dvoklikom preko `file://` protokola.

Primjer strukture na hostingu:

```text
public_html/
├── index.html
├── main.js
├── style.css
├── src/
└── public/
```

## Lokalno pokretanje bez instalacije

U folderu projekta pokreni:

```bash
python -m http.server 8080
```

Zatim otvori:

```text
http://localhost:8080
```

## Vite razvojni režim

Za dalji razvoj može se koristiti i Vite:

```bash
npm install
npm run dev
```

Produkcijski build:

```bash
npm run build
```

## Važno

Za učitavanje mapa, pretragu lokacija, rute i CDN biblioteke potrebna je internet konekcija. Aplikacija koristi javne map servise, pa za komercijalni sajt sa većim prometom treba obezbijediti sopstveni ili plaćeni map/tile servis i poštovati njihove uslove korišćenja.
