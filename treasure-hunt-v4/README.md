# Treasure Hunt v4 - isolated workspace

This folder is reserved for the new Podgorica Treasure Hunt v4 implementation and is intentionally isolated from the live site code on `main`.

## Current production app
- Live game: https://sindikatevents.me/hunt/
- Live admin: https://sindikatevents.me/hunt/admin

## v4 scope
- 10 rotating Podgorica checkpoints
- 10 teams with different starting offsets
- event/lobby code system
- percentage-based team progress board
- fully digital / paperless mobile flow
- non-linear sad love story: **Deset pisama koja nijesu stigla**
- shared final checkpoint after all 10 story fragments
- final reveal: Ana and Marko reached the same meeting place on different days because the date had been altered

## Safety
This branch/folder is not wired into the production build. The existing live site and current `/hunt/` deployment remain unchanged until the v4 app is explicitly connected and tested.

GPS coordinates, radii and pedestrian access must be field-validated before the live event.
