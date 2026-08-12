export const DEFAULT_CONFIG = {
  "eventId": "PG26",
  "name": "Ten Letters That Never Arrived",
  "active": true,
  "paused": false,
  "leaderboard": true,
  "allowHints": true,
  "gpsRequired": true,
  "announcement": "",
  "emergencyMessage": "",
  "updatedAt": null
};

export const DEFAULT_CONTENT = {
  "version": "4.1.0",
  "final": {
    "name": "Sastavci - confluence of Ribnica and Morača",
    "lat": 42.43818,
    "lng": 19.25772,
    "radius": 70,
    "clue": "Two accounts stayed separate for years. Finish the case where two waters finally become one."
  },
  "checkpoints": [
    {
      "id": "promise",
      "name": "Osmanagić Mosque area",
      "lat": 42.43534,
      "lng": 19.26035,
      "radius": 55,
      "chapter": "The Shared Place",
      "area": "Stara Varoš",
      "seal": "COMMUNITY",
      "clue": "Begin in Stara Varoš. Find a historic place whose skyline is marked by a slender vertical tower used to call a community together.",
      "hint1": "Stay south of the city centre, inside the oldest street pattern.",
      "hint2": "Look for Osmanagić Mosque and its minaret.",
      "why": "This stop is verified by what you can actually see. The archive only unlocks after your team reaches the place and identifies its defining feature.",
      "observation": "Stand where the main building and its vertical landmark are both visible.",
      "artifactTitle": "Field verification 01",
      "artifactType": "field",
      "artifactLines": [
        "OBSERVE THE SKYLINE",
        "IDENTIFY THE VERTICAL LANDMARK",
        "CONFIRM THE PLACE"
      ],
      "task": "Which visible feature best confirms that you found the intended historic place?",
      "type": "choice",
      "options": [
        "A minaret",
        "A cable pylon",
        "A stadium floodlight",
        "A lighthouse"
      ],
      "answer": 0,
      "retry": "Look upward. The defining vertical feature belongs to a mosque.",
      "points": 120
    },
    {
      "id": "time",
      "name": "Sahat Kula",
      "lat": 42.43595,
      "lng": 19.26115,
      "radius": 45,
      "chapter": "The Timekeeper",
      "area": "Stara Varoš",
      "seal": "TIME",
      "clue": "Find the old stone structure Podgorica once trusted to make time visible in the centre of Stara Varoš.",
      "hint1": "You are looking for a historic clock tower.",
      "hint2": "Find Sahat Kula near Bećir Beg Osmanagić Square.",
      "why": "The location itself is the field clue. Your team must verify the feature that made this structure a public timekeeper.",
      "observation": "Look at the upper part of the tower before opening the archive layer.",
      "artifactTitle": "Field verification 02",
      "artifactType": "field",
      "artifactLines": [
        "STONE TOWER",
        "PUBLIC TIMEKEEPER",
        "VERIFY THE UPPER FEATURE"
      ],
      "task": "What visible feature makes this structure a timekeeper rather than an ordinary tower?",
      "type": "choice",
      "options": [
        "A clock face",
        "A drawbridge",
        "A weather vane",
        "A bell-shaped roof only"
      ],
      "answer": 0,
      "retry": "Use the feature that directly communicates time.",
      "points": 140
    },
    {
      "id": "record",
      "name": "Starodoganjska Mosque area",
      "lat": 42.43612,
      "lng": 19.26006,
      "radius": 55,
      "chapter": "The Old Record",
      "area": "Stara Varoš",
      "seal": "RECORD",
      "clue": "Stay in the old quarter and find the place whose historic name still carries the memory of customs, trade and things that had to be accounted for.",
      "hint1": "The old word “dogana” is connected with customs and records.",
      "hint2": "Look for the Starodoganjska Mosque area in Stara Varoš.",
      "why": "This checkpoint ties the physical old quarter to the case theme of records: what was sent, what was received and what went missing.",
      "observation": "Confirm you are still inside the dense historic fabric of Stara Varoš before solving.",
      "artifactTitle": "Field verification 03",
      "artifactType": "record",
      "artifactLines": [
        "DOGANA",
        "TRADE / CUSTOMS",
        "RECORD / ACCOUNT"
      ],
      "task": "Complete the field keyword: DOGANA was tied to ______ and records.",
      "type": "text",
      "answerText": "CUSTOMS",
      "retry": "Think of goods entering a city and the paperwork checked at entry.",
      "points": 150
    },
    {
      "id": "safe",
      "name": "Ribnica Fortress / Depedogen",
      "lat": 42.43772,
      "lng": 19.25712,
      "radius": 60,
      "chapter": "The Safe Point",
      "area": "Ribnica",
      "seal": "KEEP",
      "clue": "Find the stone remains above Ribnica - a place shaped by defence, control and keeping important things protected.",
      "hint1": "Move toward the old river crossing and fortress remains.",
      "hint2": "Find the Ribnica Fortress / Depedogen area.",
      "why": "A defensive site gives the archive a physical idea: preservation. The field task asks you to identify the role the place itself suggests.",
      "observation": "Look at the stone remains and their position above the river route.",
      "artifactTitle": "Field verification 04",
      "artifactType": "bundle",
      "artifactLines": [
        "STONE",
        "CONTROL THE APPROACH",
        "KEEP / PROTECT"
      ],
      "task": "Which function best fits the place in front of you?",
      "type": "choice",
      "options": [
        "Protection and control",
        "Open-air market only",
        "Railway platform",
        "Modern office complex"
      ],
      "answer": 0,
      "retry": "Use the stone defensive remains and their position over the river approach.",
      "points": 145
    },
    {
      "id": "waiting",
      "name": "Skaline",
      "lat": 42.43915,
      "lng": 19.25874,
      "radius": 60,
      "chapter": "Down to the River",
      "area": "Ribnica riverbank",
      "seal": "DESCENT",
      "clue": "Leave the louder streets and find the steps that pull the city downward toward Ribnica.",
      "hint1": "You are looking for a pedestrian descent between the centre and the river.",
      "hint2": "Find Skaline.",
      "why": "This checkpoint is about movement through the real terrain. The route changes level here, and the field check should be obvious under your feet.",
      "observation": "Notice how the route changes elevation as the city gives way to the river.",
      "artifactTitle": "Field verification 05",
      "artifactType": "route",
      "artifactLines": [
        "CITY LEVEL",
        "STEPS / DESCENT",
        "RIVER LEVEL"
      ],
      "task": "What physical movement defines this location?",
      "type": "choice",
      "options": [
        "Descending by steps toward the river",
        "Climbing a cable bridge",
        "Entering a tunnel",
        "Crossing railway tracks"
      ],
      "answer": 0,
      "retry": "Pay attention to the level change between the centre and Ribnica.",
      "points": 150
    },
    {
      "id": "ordinary",
      "name": "Independence Square",
      "lat": 42.44138,
      "lng": 19.26266,
      "radius": 60,
      "chapter": "The Public Square",
      "area": "City centre",
      "seal": "CROWD",
      "clue": "Find Podgorica’s central open civic square - a place where an ordinary day can disappear into public movement.",
      "hint1": "Think of the main central square.",
      "hint2": "Find Trg nezavisnosti.",
      "why": "The contrast matters: a private story is unfolding in one of the city’s most public spaces. Your field check confirms the character of the place.",
      "observation": "Stand where the openness of the square is clear around you.",
      "artifactTitle": "Field verification 06",
      "artifactType": "field",
      "artifactLines": [
        "OPEN SPACE",
        "PUBLIC MOVEMENT",
        "CITY CENTRE"
      ],
      "task": "Which description best matches the space you are standing in?",
      "type": "choice",
      "options": [
        "An open civic square",
        "A fortress courtyard",
        "A river gorge",
        "A private garden"
      ],
      "answer": 0,
      "retry": "Use the scale and openness of the public space around you.",
      "points": 120
    },
    {
      "id": "apology",
      "name": "Bokeška Street",
      "lat": 42.44215,
      "lng": 19.26086,
      "radius": 65,
      "chapter": "The Talking Street",
      "area": "City centre",
      "seal": "VOICE",
      "clue": "Find the central street where cafés, tables and conversation spill into the public realm.",
      "hint1": "Look for one of the centre’s best-known social streets.",
      "hint2": "Find Bokeška ulica.",
      "why": "The physical character of this street - conversation in public - is the counterpoint to words in the case that were never delivered.",
      "observation": "Notice how much of the street is shaped by people sitting, meeting and talking.",
      "artifactTitle": "Field verification 07",
      "artifactType": "letter",
      "artifactLines": [
        "VOICES OUTSIDE",
        "WORDS TRAVEL",
        "SOME WORDS DO NOT"
      ],
      "task": "What gives this street its strongest social character?",
      "type": "choice",
      "options": [
        "Cafés and conversation",
        "Cargo cranes",
        "Airport gates",
        "Fortress walls"
      ],
      "answer": 0,
      "retry": "Use what the street is known for at ground level.",
      "points": 150
    },
    {
      "id": "memory",
      "name": "Njegošev Park",
      "lat": 42.44255,
      "lng": 19.25742,
      "radius": 70,
      "chapter": "The Quiet Edge",
      "area": "Morača river edge",
      "seal": "PAUSE",
      "clue": "Find a green pause between the centre and Morača - a place where the pace of the city visibly changes.",
      "hint1": "Look for a central park beside the river.",
      "hint2": "Find Njegošev Park.",
      "why": "The route needs a pause for comparison. Here the environment itself changes from dense streets to a greener edge near the river.",
      "observation": "Look for the relationship between the park, the city centre and the river edge.",
      "artifactTitle": "Field verification 08",
      "artifactType": "split",
      "artifactLines": [
        "CITY / MOVEMENT",
        "PARK / PAUSE",
        "RIVER / EDGE"
      ],
      "task": "Which transition best describes this location?",
      "type": "choice",
      "options": [
        "From city centre toward a green river edge",
        "From airport to runway",
        "From harbour to sea",
        "From tunnel to station"
      ],
      "answer": 0,
      "retry": "Use the park and the nearby Morača as your two reference points.",
      "points": 155
    },
    {
      "id": "crossing",
      "name": "Millennium Bridge",
      "lat": 42.44462,
      "lng": 19.25849,
      "radius": 80,
      "chapter": "The Crossing",
      "area": "Morača",
      "seal": "CROSS",
      "clue": "Find Podgorica’s modern river crossing held by a tall pylon and a fan of cables.",
      "hint1": "You are looking for the city’s most recognisable modern bridge.",
      "hint2": "Find Millennium Bridge.",
      "why": "This is one of the few checkpoints where the structure itself is the answer: one engineered object joining two sides across Morača.",
      "observation": "Look for the pylon, cables and the span across the river.",
      "artifactTitle": "Field verification 09",
      "artifactType": "route",
      "artifactLines": [
        "SIDE A",
        "CABLE-STAYED SPAN",
        "SIDE B"
      ],
      "task": "Type the name of the tall structural element above the deck that anchors the cable fan.",
      "type": "text",
      "answerText": "PYLON",
      "retry": "It is the tall vertical structural element that the cables connect to.",
      "points": 160
    },
    {
      "id": "date",
      "name": "King’s Park",
      "lat": 42.43964,
      "lng": 19.26483,
      "radius": 65,
      "chapter": "The Formal Garden",
      "area": "City centre",
      "seal": "ORDER",
      "clue": "Find a landscaped city garden near the old centre, shaped more by order and paths than by traffic.",
      "hint1": "Look for a formal public park close to the centre.",
      "hint2": "Find King’s Park / Kraljev park.",
      "why": "The last field verification is about order: a calm, structured place used to unlock the final archive layer before deduction.",
      "observation": "Notice the difference between the park’s planned paths and the surrounding street network.",
      "artifactTitle": "Field verification 10",
      "artifactType": "record",
      "artifactLines": [
        "ORDER",
        "PATHS",
        "COMPARE TWO VERSIONS"
      ],
      "task": "Which description best fits the place you reached?",
      "type": "choice",
      "options": [
        "A landscaped public park",
        "A defensive fort",
        "A market hall",
        "An industrial yard"
      ],
      "answer": 0,
      "retry": "Use the planned greenery and public paths around you.",
      "points": 135
    }
  ],
  "storyBeats": [
    {
      "act": "ACT I · THE PROMISE",
      "title": "Two tickets",
      "source": "Ana",
      "artifactType": "ticket",
      "quote": "I bought two tickets. I kept them together because I thought we were leaving together.",
      "establishes": "Ana expected a shared departure. The story did not begin with one person quietly leaving the other."
    },
    {
      "act": "ACT I · THE PROMISE",
      "title": "Six o’clock",
      "source": "Marko",
      "artifactType": "note",
      "quote": "I was there before six. I stayed until the street went quiet.",
      "establishes": "Marko says he reached the meeting and waited. The hour is clear, but the full appointment is not."
    },
    {
      "act": "ACT I · THE PROMISE",
      "title": "The missing letter",
      "source": "Ana",
      "artifactType": "envelope",
      "quote": "You said there would be one last letter before we left. I never received it.",
      "establishes": "A final message was meant to reach Ana before the meeting, but it did not."
    },
    {
      "act": "ACT II · THE BREAK",
      "title": "Kept, not destroyed",
      "source": "Marko",
      "artifactType": "bundle",
      "quote": "I could not throw the letters away. I kept them because the story never felt finished.",
      "establishes": "Marko preserved the correspondence. His later actions do not fit someone who wanted the relationship erased."
    },
    {
      "act": "ACT II · THE BREAK",
      "title": "Still waiting",
      "source": "Shared record",
      "artifactType": "split",
      "quote": "Two separate notes survive. Both say almost the same thing: still waiting, just after six.",
      "establishes": "Both accounts contain a real wait around 18:00. The contradiction is no longer “who came?”"
    },
    {
      "act": "ACT II · THE BREAK",
      "title": "The wrong conclusion",
      "source": "Marko",
      "artifactType": "letter",
      "quote": "I left because I believed your absence was an answer. Years later, that certainty became the thing I regretted most.",
      "establishes": "Marko left after waiting because he interpreted Ana’s absence as a choice."
    },
    {
      "act": "ACT II · THE BREAK",
      "title": "No private goodbye",
      "source": "Ana",
      "artifactType": "list",
      "quote": "Nothing in that day looked like goodbye. The second ticket was still in my pocket.",
      "establishes": "Ana also expected the shared plan to happen. Her behaviour does not fit a deliberate disappearance."
    },
    {
      "act": "ACT III · THE CONTRADICTION",
      "title": "The same memory",
      "source": "Shared record",
      "artifactType": "split",
      "quote": "Same place. Six o’clock. I waited. No one came.",
      "establishes": "Their memories match on place and hour. One basic appointment detail is still missing from both statements."
    },
    {
      "act": "ACT III · THE CONTRADICTION",
      "title": "Two copies",
      "source": "Archive",
      "artifactType": "split",
      "quote": "Two versions of the appointment survived. One is marked FRI 18. The other is marked SAT 19. Both say 18:00.",
      "establishes": "The case now contains two different dates for what everyone believed was one meeting."
    },
    {
      "act": "ACT III · THE CONTRADICTION",
      "title": "Correction not delivered",
      "source": "Delivery record",
      "artifactType": "record",
      "quote": "Correction for A.: use FRI 18, 18:00. Delivery status: NOT DELIVERED.",
      "establishes": "Ana’s Saturday copy contained the error. A correction was prepared, but it never reached her."
    }
  ]
};
