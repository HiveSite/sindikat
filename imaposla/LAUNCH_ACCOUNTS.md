# Launch nalozi

Zbog sigurnosti, lozinke se ne čuvaju u repozitorijumu. Napravi korisnike ručno u Supabase Dashboardu i postavi jake privremene lozinke koje ćeš poslije promijeniti.

Supabase -> Authentication -> Users -> Add user -> Create new user

## Nalozi koje treba napraviti

```text
admin@imaposla.me
firma@imaposla.me
kandidat@imaposla.me
```

## Uloge

Nakon kreiranja korisnika pokreni `launch-accounts.sql` u Supabase SQL Editoru. Taj SQL:

- postavlja `admin@imaposla.me` na ulogu `admin`
- postavlja `firma@imaposla.me` na ulogu `company`
- postavlja `kandidat@imaposla.me` na ulogu `candidate`
- kreira odobren profil firme za `firma@imaposla.me`

## Važno

Ako su stare lozinke ikad bile upisane ili poslate kroz chat, promijeni ih prije javnog launch-a. U repozitorijumu više ne držimo lozinke.
