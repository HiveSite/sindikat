# Podgorica Hunt - production checklist

## Tehnički

- [ ] Root `netlify.toml` ima `/hunt/team-api/*` -> `hunt-event`
- [ ] Root `netlify.toml` ima `/hunt/api/*` -> `hunt-api-v2`
- [ ] `/hunt/` vraća aktuelni premium Podgorica frontend
- [ ] Team kodovi `PG26-01` do `PG26-10` rade
- [ ] Netlify Blobs event store radi i team board vraća podatke
- [ ] Refresh/nastavak lokalnog team progressa testiran
- [ ] Service worker učitava v40 assete bez starog cachea

## Field QA - obavezno prije javnog eventa

- [ ] Svih 10 Podgorica checkpointa fizički prođeno
- [ ] Sastavci finale fizički testirano
- [ ] iPhone Safari GPS testiran
- [ ] Android Chrome GPS testiran
- [ ] Radijusi 45-80 m potvrđeni u realnim uslovima
- [ ] Slab GPS signal i accuracy gating testirani
- [ ] Svi prilazi su javni i bezbjedni za pješake
- [ ] Nema checkpointa koji zahtijeva ulazak u privatni prostor
- [ ] Večernja vidljivost i gužva provjereni ako se event igra uveče

## Experience QA

- [ ] Team 01 i Team 10 odigrani od početka do kraja
- [ ] Story fragmenti se uvijek otključavaju 01 -> 10 bez obzira na fizičku rotaciju
- [ ] Fragment 09 prvi put uvodi dvije različite date kopije
- [ ] Fragment 10 potvrđuje neisporučenu korekciju Ani
- [ ] Finalna rekonstrukcija traži Marko/Fri 18, Ana/Sat 19 i correction letter
- [ ] Team board se komunicira kao progress/score, ne kao brzinska trka
- [ ] Share result radi ili uredno fallbackuje na clipboard
