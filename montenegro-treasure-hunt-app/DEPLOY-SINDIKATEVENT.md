# Deploy na sindikatevent.me/hunt/

## URL-ovi

- Igra: `https://sindikatevent.me/hunt/`
- Admin: `https://sindikatevent.me/hunt/admin`

## 1. Pokrenite Node aplikaciju

Na serveru, iz ovog foldera:

```bash
cp .env.example .env
# uredite .env
node server.mjs
```

Obavezne vrijednosti u `.env`:

```env
NODE_ENV=production
PORT=3000
HOST=127.0.0.1
BASE_PATH=/hunt
APP_ORIGIN=https://sindikatevent.me
DATABASE_FILE=./data/mth.sqlite
TOKEN_PEPPER=unesite-dugu-nasumicnu-vrijednost-minimum-24-znaka
ADMIN_EMAIL=vas-admin-email
ADMIN_PASSWORD=vrlo-jaka-lozinka
INTEGRATION_API_KEY=dugacak-integracioni-kljuc
ENABLE_DEV_TEST_VOUCHER=false
```

## 2. Nginx konfiguracija

U postojećem `server` bloku za `sindikatevent.me` dodajte:

```nginx
location = /hunt {
    return 308 /hunt/;
}

location /hunt/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Zatim:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

`proxy_pass` namjerno nema završni `/`, jer aplikacija očekuje `/hunt` prefiks.

## 3. Provjera

```bash
curl -I https://sindikatevent.me/hunt/
curl https://sindikatevent.me/hunt/api/health
```

Otvorite:

- `https://sindikatevent.me/hunt/`
- `https://sindikatevent.me/hunt/admin`

## Ako je glavni sajt na Vercelu

Ovu SQLite Node aplikaciju prvo hostujte na VPS-u ili servisu sa trajnim diskom. U glavnom Vercel projektu dodajte rewrite prema tom hostu:

```json
{
  "rewrites": [
    {
      "source": "/hunt/:path*",
      "destination": "https://NODE-APP-HOST/hunt/:path*"
    }
  ]
}
```

Baza mora ostati na hostu sa trajnim diskom.
