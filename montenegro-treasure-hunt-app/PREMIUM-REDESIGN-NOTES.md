# Podgorica City Treasure Hunt - premium redesign handoff

## Production frontend

The user-facing Podgorica experience lives in `public/hunt/` and is loaded by `public/hunt/index.html`.

## What changed

- Decoupled the physical 10-team route rotation from the chronological Ana/Marko story.
- Preserved unique team starting points without allowing an early checkpoint to spoil the final date twist.
- Rebuilt the story as 10 fixed archive fragments across three acts.
- Reworked every physical checkpoint into a field verification tied to the real type/character of the location.
- Added a distance + compass-bearing field navigation layer.
- Reduced base GPS unlock radii to 45-80 m and added GPS-accuracy gating/adaptive tolerance.
- Rebuilt Evidence as a chronological case file plus a separate field verification log.
- Removed time-based competitive pressure. The team board now frames score as a secondary layer.
- Replaced the one-click final multiple choice with a three-part reconstruction: Marko's copy, Ana's copy and the failed correction.
- Added a final recovered-letter payoff at Sastavci and result sharing.
- Rebuilt the UI into an editorial/archive visual system with field cards, paper dossiers, stamps, progress hierarchy and responsive mobile layouts.
- Added explicit `/hunt/team-api/*` routing to the standalone app Netlify config.
- Restored service-worker registration and bumped the cache/version query to v40.
- Added scroll-position reset between major screens so a new mission never opens halfway down the page.

## Narrative order

1. Two tickets
2. Six o'clock
3. The missing letter
4. Kept, not destroyed
5. Still waiting
6. The wrong conclusion
7. No private goodbye
8. The same memory
9. Two copies
10. Correction not delivered

The date contradiction is therefore not revealed until the final two archive fragments, regardless of which physical checkpoint a team receives first.

## QA completed

- JavaScript syntax check: pass.
- Existing core tests: 4/4 pass.
- Existing content test: pass.
- Browser-render QA at 390x844: entry, briefing, hunt, verification sheet and archive unlock pass without page errors.
- Full simulated Team 10 run: 10/10 field stops, 10/10 archive fragments, final reconstruction, Sastavci finale and Case File all pass without page errors.
- Team 10 verified to start at King's Park while still receiving archive fragment 01 first.

## Main changed files

- `public/hunt/index.html`
- `public/hunt/hunt-data-v32-global.js`
- `public/hunt/hunt-data-v32.js`
- `public/hunt/app-v32-1.js`
- `public/hunt/app-v32-2.js`
- `public/hunt/app-v32-3.js`
- `public/hunt/ux-v32.css`
- `public/hunt/manifest.webmanifest`
- `public/hunt/sw.js`
- `netlify.toml`
