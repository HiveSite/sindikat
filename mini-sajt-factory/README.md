# Mini-Sajt Factory - Central Command

Interni sistem za dnevnu proizvodnju premium mini-sajtova.

## Repo struktura
- `mini-sajt-factory/` - centralna komanda i engine
- `../preporuke/{slug}/index.html` - finalni standalone demo sajtovi
- `../data/preporuke-registry.csv` - source of truth registry

## Šta radi
- Daily Command dashboard i cilj 5 projekata dnevno
- Google Places Discovery provider kada se doda `GOOGLE_MAPS_API_KEY`
- hard gateovi: registry, status rada, sopstveni sajt
- research/source ledger
- content/photo/menu/conversion readiness
- Media Studio sa uploadom i ulogama fotografija
- Design DNA + anti-template similarity gate
- Premium Score 100 + LIVE prag 85
- QA gateovi
- accommodation detector + booking opportunity/approval hard gate
- sales approval status

## Booking pravilo
Za smještaje se automatski kreira samo `BOOKING OPPORTUNITY`. Apps Script/Sheets/booking web app se ne gradi dok `bookingApproval !== true`.

## Output pravilo
Svaki finalni demo se upisuje isključivo u `preporuke/{slug}/index.html`, a registry se ažurira u `data/preporuke-registry.csv` tek nakon stvarne provjere live URL-a.
