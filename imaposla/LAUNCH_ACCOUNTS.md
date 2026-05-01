# Launch nalozi

Zbog sigurnosti, lozinke se ne kreiraju direktno SQL-om. Napravi ova tri korisnika u Supabase Dashboardu:

Supabase -> Authentication -> Users -> Add user -> Create new user

## Nalozi

Admin:

```text
Email: admin@imaposla.me
Password: Imaposla-Admin-2026!
```

Firma:

```text
Email: firma@imaposla.me
Password: Imaposla-Firma-2026!
```

Kandidat:

```text
Email: kandidat@imaposla.me
Password: Imaposla-Kandidat-2026!
```

## Nakon kreiranja korisnika

Pokreni `launch-accounts.sql` u Supabase SQL Editoru. Taj SQL:

- postavlja admin nalog na role `admin`
- postavlja firma nalog na role `company`
- postavlja kandidat nalog na role `candidate`
- kreira odobren profil firme za `firma@imaposla.me`

## Vazno

Ove lozinke su privremene launch lozinke. Nakon prvog ulaska ih promijeni u Supabase/Auth flow-u.
