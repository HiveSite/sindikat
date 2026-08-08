# Podgorica Treasure Hunt v4 - isolated app

This folder is reserved exclusively for the new Podgorica Treasure Hunt v4 implementation. It is intentionally isolated from the existing live `/hunt/` module and from the rest of the Sindikat site.

## Core event model
- ONE Podgorica program / event
- 73 participants
- 10 teams
- 10 rotating core checkpoints
- every team starts at a different checkpoint
- every team completes the same 10 checkpoints in a different rotational order
- the story is non-linear, so every fragment makes sense regardless of the starting point
- after all 10 rotating fragments, every team receives the SAME 11th shared final location
- the 11th location is never part of the rotation

## Access logic
1. Event voucher unlocks the Podgorica experience.
2. Admin creates one group event with 10 team slots.
3. The event generates 10 unique team codes.
4. Each team enters its own team code.
5. The team code deterministically assigns Team 01-10 and start offset 0-9.
6. A team code cannot be reused by another active team.

## Team competition
- shared event lobby
- percentage-based team progress
- score and completion status
- teams NEVER see another team's current GPS position or active challenge
- progress board refreshes during the game

## Story
Title: **Ten Letters That Never Arrived**

Ana and Marko planned to leave Podgorica together. Ten undelivered and undated letter fragments tell both sides of the relationship. Each rotating checkpoint reveals an independent fragment, allowing the story to work from any starting point.

The fragments gradually establish themes of time, promise, separation, hidden letters, departure, waiting, ordinary life continuing, an unfinished apology, crossing and finally an altered date.

After all ten fragments are collected, the teams receive the final direction: **“Where two waters meet beneath old stone…”**

At the shared final location, teams discover that neither Ana nor Marko abandoned the other. The meeting date had been altered. Marko arrived on Friday the 18th. Ana arrived on Saturday the 19th. Both waited at the same place on different evenings and both left believing the other had chosen not to come.

## Mobile-first UX requirements
- 100% phone / web based
- no paper and no app installation
- GPS-based progression
- future locations remain hidden until they become active
- challenge popups are fully responsive
- popup content scrolls internally on small screens
- action buttons remain reachable on short screens
- long text wraps safely without horizontal overflow
- safe-area padding for modern phones
- landscape mode supported
- five game tabs fit on mobile when Team Progress is enabled
- final location cannot unlock before all ten rotating fragments are completed

## Content / language
- player-facing experience is English
- admin may remain internal/local-language oriented
- exact GPS points, radii and pedestrian approaches require field validation before the live event

## Isolation
The v4 app uses its own intended route namespace `/hunt-v4/` and separate Netlify Blob store `montenegro-treasure-hunt-v4`. It must not modify or reuse the live `/hunt/` data store.

Current production remains unchanged:
- Live old game: https://sindikatevents.me/hunt/
- Live old admin: https://sindikatevents.me/hunt/admin

## Validation target
Before promotion to production, the isolated app must pass:
- core API tests
- 10-team rotation test
- shared 11th-final checkpoint test
- mobile popup/responsive QA
- live GPS field validation
- Netlify build validation
