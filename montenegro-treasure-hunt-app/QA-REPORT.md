# QA report - Montenegro Treasure Hunt Node App

Datum: 2026-08-03

## Automatske provjere

Pokrenuto:

```bash
node --check server.mjs
node --check public/app.js
node --check public/admin.js
node --test tests/*.test.mjs
```

Rezultat:

- 2 test suite-a prošla
- 0 padova
- 6 tura učitano iz baze
- 30 od 30 glavnih stanica završeno preko stvarnog API-ja
- 30 server-side odgovora potvrđeno
- 30 dokaza upisano u sesije
- 6 od 6 sesija završeno finalom
- Admin login potvrđen
- Admin statistika i lista sesija potvrđene
- Test vaučer potvrđen kao ponovljiv samo u razvojnom režimu
- Produkcijski vaučeri ostaju jednokratni

## Provjerene funkcije

- Aktivacija vaučera
- Lista dozvoljenih tura
- Zaključavanje vaučera za izabranu turu
- Kreiranje posade i sesije
- Test i GPS režim
- Server-side provjera odgovora
- GPS uslov za live režim
- Hint evidencija i kazna
- Poeni i pogrešni odgovori
- Dokazi i napredak
- Sidequest upis
- Finale
- Čuvanje aktivne sesije
- Admin login/logout
- Uređivanje sadržaja ture
- Admin preview token
- Generisanje i deaktivacija vaučera
- Pregled i reset sesije
- Server-to-server voucher endpoint
- Ugrađena SVG mapa bez map API-ja i tile servisa

## Ručna provjera koja ostaje prije javnog lansiranja

- Mobile Safari na stvarnom iPhone uređaju
- Chrome na stvarnom Android uređaju
- GPS preciznost na svih 30 lokacija
- PWA instalacija i povratak iz backgrounda
- Slab internet i ponovno slanje napretka
- Backup i restore produkcijske SQLite baze
- Eksterna kupovina, email kupcu i voucher API poziv
- Fizički prolazak svih ruta
