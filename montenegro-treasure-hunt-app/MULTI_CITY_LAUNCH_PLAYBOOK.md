# Montenegro Treasure Hunt - Multi-city Launch Playbook

## 1. Product model

One platform, many programs.

Every program has its own:
- city / operating area
- team count
- access codes
- 3-20 field stops
- rotating start assignment
- field clues and GPS radii
- chronological story beats
- final deduction
- final physical location
- launch status: Draft -> Ready -> Live -> Archived
- live map, team telemetry, admin controls and event log

Players always use the same public URL. Their access code resolves the correct program and team automatically.

## 2. Route assignment rule

If a program has N field stops, the first N teams start at different stops.

Example with 8 stops and 20 teams:
- Team 01 and Team 09 and Team 17 start at Stop 1
- Team 02 and Team 10 and Team 18 start at Stop 2
- ...
- Team 08 and Team 16 start at Stop 8

The physical route is rotated, while the story always unlocks chronologically.

Operational target:
- ideal: 1-2 teams per starting stop
- acceptable: 3 teams per starting stop
- 4+ teams per start: add more stops or stagger start times

## 3. Route design standard

Target experience:
- 60-150 minutes depending on city
- 6-12 stops for most public programs
- 3-20 supported by the platform
- mostly walkable and continuous
- no required road running
- no restricted/private property
- no unsafe shortcuts
- no task whose answer requires climbing, entering closed structures or approaching traffic

Every field stop must pass five tests:
1. It is easy to identify once the team is actually there.
2. The answer can be confirmed from something physically visible.
3. GPS is stable enough for a fair arrival check.
4. The clue does not simply reveal the location name.
5. The stop contributes meaning to the program story.

## 4. GPS standard

Default target radius:
- dense old town / open square: 35-65 m
- park / river edge: 50-80 m
- larger landmark / weak urban canyon: 70-120 m

Do not publish a radius based only on desktop maps.

Field validation:
- test each stop on at least two different phones
- test while walking toward the point from two directions
- record typical GPS accuracy
- check whether buildings create persistent drift
- confirm the check does not trigger from the previous stop
- increase radius only when the physical observation task still prevents false completion

## 5. Field task standard

Preferred task types:

### Visible feature
Ask for something physically observable: a clock face, arch, relief, inscription, number, material, color pattern or structural element.

### Count
Count a small stable set of visible objects. Avoid things that can move or disappear.

### Compare
Compare two architectural or spatial details visible at the same location.

### Read and transform
Use a permanent inscription or number, then apply a simple transformation.

### Direction / relationship
Ask how the place relates to a river, square, gate, hill, wall or another fixed feature.

Avoid:
- trivia that can be solved from Google without visiting
- answers based on temporary signs
- businesses that may close or change branding
- staff interaction as a required step
- anything requiring entry into a paid venue unless the event explicitly includes admission

## 6. Story standard

The city is evidence, not decoration.

Each program needs:
- one central question
- a clear mystery or unresolved situation
- one chronological fragment per field stop
- every fragment must change what the team can reasonably conclude
- a contradiction or unresolved pattern before the finale
- a final deduction that uses evidence already earned
- a final location whose physical meaning supports the resolution

Recommended structure:
- Act I - establish people, object, promise or event
- Act II - show what apparently went wrong
- Act III - expose the contradiction
- Final deduction - reconstruct the only explanation that fits every fragment
- Epilogue - walk to the final place and close the story

Do not make the final puzzle depend on information that was never shown earlier.

## 7. Program Builder workflow

### Overview
Set:
- program name
- city
- number of teams
- access-code prefix
- duration estimate
- difficulty
- language
- support contact
- meeting point
- safety notes

### Experience
Write:
- title and synopsis
- player briefing
- central question
- final context
- ending copy

### Route and tasks
For every stop set:
- stable ID
- public name for admin use
- latitude / longitude
- GPS radius
- area
- chapter / seal
- field clue
- hint 1
- hint 2
- physical observation instruction
- reason the location matters
- task
- answer options / correct answer
- retry feedback
- points

### Story
Create exactly one story beat for every field stop.

### Finale
Set:
- final GPS location
- final clue
- one or more deduction questions
- options and correct values
- failure and success feedback

### Launch QA
Do not mark Ready / Live until the QA screen has no blocking errors.

## 8. Status model

Draft
- editing and field testing
- must not be treated as launch-ready

Ready
- all technical QA passes
- field validation completed
- still closed to players

Live
- access codes work
- event is open
- live map and team control are operational

Archived
- closed to new players
- historical data is retained

## 9. Field validation day

Bring:
- at least two different phones
- mobile data on both devices
- one coordinator account
- one test team code
- backup notes with exact coordinates

For every stop record:
- actual walking approach
- safe pedestrian approach
- GPS accuracy range
- whether radius fires too early
- whether clue is understandable without naming the answer
- whether the visible task has exactly one fair answer
- approximate walking time to the next stop
- congestion / queue risk
- night-time suitability if relevant

Run one complete route from start to finish before changing status to Ready.

## 10. Launch-day operating model

Before start:
- open Control Center
- select correct program
- verify program status and codes
- open Live map
- confirm staff roles
- test one code
- confirm GPS permission prompt
- brief teams on pedestrian safety

During event:
- keep Live map visible
- watch stale GPS / attention states
- use temporary GPS unlock only for genuine signal issues
- pause an individual team if needed
- use broadcast for event-wide information
- keep internal notes for incidents

After event:
- export results
- record failed clues or GPS zones
- archive the program when finished
- update route content before the next run

## 11. Recommended Montenegro rollout order

These are content-development candidates, not automatically publishable routes. Every stop must still be field-tested.

### Cetinje - strong first expansion candidate
Theme direction: royal archive / state memory / competing versions of history.

Why it works:
- compact historic core
- strong sequence of cultural institutions and public heritage
- official Montenegro tourism highlights King Nikola's Palace, Biljarda, Cetinje Monastery and multiple museums

Route-development focus:
- keep the walk concentrated in the historic centre
- favor exterior observations so museum opening hours do not block gameplay
- use permanent architectural and civic details

### Kotor - premium flagship candidate
Theme direction: sealed city / missing record / gates, walls and competing witnesses.

Why it works:
- highly legible old-town environment
- UNESCO historic context
- walls, gates, squares, churches and clock-tower details create natural observation tasks

Operational caution:
- heavy seasonal pedestrian congestion
- narrow passages and GPS drift between stone buildings
- avoid forcing teams onto steep fortress routes as part of the standard game

### Budva - strong seasonal candidate
Theme direction: layers of the city / old walls / archaeology / a story hidden under the modern resort.

Why it works:
- compact Old Town
- citadel, walls, church quarter and archaeological context create visible field tasks

Operational caution:
- summer crowd density
- nightlife / event-day congestion
- route must remain pedestrian and readable when the old town is busy

### Nikšić - good scalable local program
Theme direction: city of industry, culture and memory.

Why it works:
- civic centre can support a less tourist-heavy hunt
- official tourism materials highlight Bedem and wider historic / cultural landmarks

Route-development focus:
- build a genuinely walkable central cluster rather than sending teams to distant attractions
- use the central city as the base route and treat farther landmarks as separate future programs

### Bar - strong thematic program, needs access planning
Theme direction: the city that moved / ruins, water and rebuilding.

Why it works:
- Old Bar offers unusually strong physical storytelling through ruins, aqueduct, baths, religious buildings and fortification remains

Operational caution:
- verify entrance / ticket requirements and opening conditions before using interior paid areas
- if access cannot be guaranteed, build tasks around always-accessible exterior observations

### Herceg Novi - excellent story city, higher physical-load risk
Theme direction: stairs, fortresses and messages moving between levels of the city.

Why it works:
- strong identity around the old town and fortresses
- official tourism materials highlight Forte Mare and Kanli Kula

Operational caution:
- elevation and stairs increase physical demand
- paid-access fortress interiors must not be required unless included in the event plan

## 12. Launch sequence for expansion

Phase 1
- stabilize Podgorica as the reference program
- run one full operational test using Program Builder + Launch QA

Phase 2
- build Cetinje and one coastal pilot as Draft
- field-walk both
- fix route and GPS issues

Phase 3
- promote one new city to Ready
- run closed beta with 2-4 teams

Phase 4
- go Live publicly
- collect event logs and route feedback

Phase 5
- duplicate the operating method to the next city, not the exact story

The platform should scale by reusing the engine, QA process and admin workflow while giving each city its own physical evidence and narrative identity.
