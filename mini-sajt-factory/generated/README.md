# Generated workspace

Ovaj folder je interna radna zona Factory-ja za build/version metadata i privremene rezultate.

Finalni javni demo se NE servira odavde.

Publish pravilo:
- radni rezultat: `mini-sajt-factory/generated/{slug}/...`
- finalni standalone output: `preporuke/{slug}/index.html`
- registry update: `data/preporuke-registry.csv`

Tek nakon QA + Premium Score >=85 + live provjere projekat dobija `LIVE_DEMO`.
