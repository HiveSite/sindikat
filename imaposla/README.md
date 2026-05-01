# imaposla.me

Ovo je nova, odvojena verzija sajta nastala iz demo ideje `partneri/workhub2.html`.

## Šta je urađeno

- Novi naziv i brend: `imaposla.me`
- Odvojeni fajlovi: `index.html`, `styles.css`, `app.js`
- Javni dio: početna, oglasi, detalj oglasa, gradovi, kategorije, firme, za firme, login, sistemske stranice
- Kandidat dio: dashboard, CV, prijave, obavještenja, podešavanja
- Firma dio: dashboard, oglasi, novi oglas, ATS, kandidati, pretplata, baneri, podešavanja
- Admin dio: dashboard, uplate, oglasi, korisnici, baneri, statistike
- Mobilno prilagođen layout
- Demo podaci u JavaScript-u, spremno za zamjenu Supabase podacima

## Sljedeća faza

Nakon pregleda frontend prototipa:

1. Napraviti Supabase projekat.
2. Pokrenuti SQL iz `supabase-schema.sql`.
3. Podesiti Supabase Auth i Storage.
4. Zamijeniti demo state u `app.js` pozivima prema Supabase-u.
5. Hostovati frontend na Vercel, Netlify ili Cloudflare Pages.
