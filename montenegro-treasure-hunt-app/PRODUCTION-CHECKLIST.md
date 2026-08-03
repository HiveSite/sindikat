# Production checklist

## Obavezno prije javnog lansiranja

- [ ] Promijenjen `TOKEN_PEPPER`
- [ ] Promijenjeni admin email i lozinka
- [ ] `ENABLE_DEV_TEST_VOUCHER=false`
- [ ] HTTPS domen povezan
- [ ] Trajni disk ili Docker volume za `data/mth.sqlite`
- [ ] Dnevni backup SQLite fajla
- [ ] Testirana kupovina na eksternoj stranici i automatsko/službeno generisanje vaučera
- [ ] Svih 30 stanica fizički testirano telefonom
- [ ] GPS radijusi potvrđeni na iPhone i Android uređajima
- [ ] Provjereni signal, pristup, radno vrijeme i sezonske prepreke
- [ ] Pravila privatnosti, uslovi korišćenja i kontakt uneseni na prodajnoj stranici
- [ ] Urađen test prekida interneta, refresh stranice i nastavka sesije
- [ ] Urađen test pogrešnog odgovora, hinta, bonusa i završetka
- [ ] Urađen test onemogućenog i isteklog vaučera
