MONTENEGRO TREASURE HUNT - NETLIFY FIXED
========================================

Ovaj ZIP je napravljen za postojeći GitHub repo HiveSite/sindikat i postojeći Netlify domen:
https://sindikatevents.me

KONAČNI LINKOVI
- Igra:  https://sindikatevents.me/hunt/
- Admin: https://sindikatevents.me/hunt/admin

KAKO UBACITI
1. Raspakujte ZIP.
2. Sadržaj ZIP-a ubacite DIREKTNO u glavni nivo repoa, pored postojećeg package.json.
3. Potvrdite overwrite za package.json.
4. Stari folder montenegro-treasure-hunt-app možete obrisati jer više nije potreban za deploy.
5. Commitujte promjene na main. Netlify će sam pokrenuti deploy.

NETLIFY ENVIRONMENT VARIABLES - OBAVEZNO
U Netlify projektu sindikatevents otvorite Site configuration > Environment variables i dodajte:

MTH_TOKEN_PEPPER
- najmanje 24 nasumična karaktera

MTH_ADMIN_EMAIL
- email za admin prijavu

MTH_ADMIN_PASSWORD
- jaka lozinka, najmanje 12 karaktera

Opcionalno:
MTH_ENABLE_TEST_VOUCHER=true
- uključuje test kod MTH-TEST-ALL
- na pravoj produkciji držati false ili obrisati varijablu

MTH_INTEGRATION_API_KEY
- ključ za eksterno automatsko kreiranje vaučera

ŠTA JE ISPRAVLJENO
- aplikacija sada koristi Netlify Functions, ne server.mjs
- trajni podaci se čuvaju kroz Netlify Blobs
- /hunt i /hunt/admin putanje su povezane
- admin login radi kroz sigurni HttpOnly cookie
- admin lozinka se uzima direktno iz Netlify env varijable i njena promjena odmah važi
- GPS accuracy veća od 150 m se pravilno odbija
- vaučer mora imati najmanje jednu validnu turu
- fiksna i dozvoljene ture se provjeravaju prema stvarnim ID-jevima
- externalRef je jedinstven i sprečava duplo kreiranje vaučera za istu prodaju
- validiraju se vrijednost, broj igrača, rok važenja, koordinate, radijus, tip i odgovor stanice
- svi linkovi, manifest, service worker i API reference koriste /hunt
- domen je ispravljen na sindikatevents.me

PROVJERA POSLIJE DEPLOYA
1. Otvorite https://sindikatevents.me/hunt/api/health
2. Mora pisati: "ok": true i "configured": true
3. Otvorite https://sindikatevents.me/hunt/admin
4. Prijavite se vrijednostima MTH_ADMIN_EMAIL i MTH_ADMIN_PASSWORD
5. Generišite vaučer i testirajte ga na /hunt/

NAPOMENA
Netlify Blobs je trajni site-scoped storage i podaci ostaju poslije novih deploya.
Za veoma veliki broj istovremenih aktivacija i finansijski kritične transakcije kasnije je bolje preći na PostgreSQL/Supabase sa baznim transakcijama.
