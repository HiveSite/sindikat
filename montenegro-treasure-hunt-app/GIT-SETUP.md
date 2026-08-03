# Git repo setup

Ovaj folder je spreman da se kopira kao jedan direktorijum u postojeći Git repozitorijum.

## Dodavanje u postojeći repo

```bash
cp -R montenegro-treasure-hunt-app /putanja/do/repozitorijuma/
cd /putanja/do/repozitorijuma
git add montenegro-treasure-hunt-app
git commit -m "Add Montenegro Treasure Hunt app"
```

## Lokalni start

```bash
cd montenegro-treasure-hunt-app
cp .env.example .env
node server.mjs
```

Otvori `http://localhost:3000`.

## Prije produkcije

1. Uredi `.env` i postavi jake tajne.
2. Postavi `ENABLE_DEV_TEST_VOUCHER=false`.
3. Pokreni `npm test`.
4. Koristi hosting sa trajnim diskom za `data/mth.sqlite`.
5. Ne commituj `.env` ni SQLite bazu - `.gitignore` ih već isključuje.
