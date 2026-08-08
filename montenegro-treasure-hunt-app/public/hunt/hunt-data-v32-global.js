const FINAL = {
  name: 'Sastavci - Ribnica and Morača confluence',
  lat: 42.43818,
  lng: 19.25772,
  radius: 110,
  clue: 'Two stories stayed separate for years. To finish them, find the place where two waters finally meet beneath old stone.'
};

const checkpoints = [
  {
    id: 'promise',
    name: 'Stara Varoš - Osmanagić Mosque area',
    lat: 42.43534, lng: 19.26035, radius: 95,
    chapter: 'The Promise', area: 'Stara Varoš',
    clue: 'Find a quiet historic place in the old city shaped by community and shared life.',
    hint1: 'Stay inside Stara Varoš and look for a historic gathering place.',
    hint2: 'Look for a minaret near the oldest streets south of the city centre.',
    why: 'This location represents a decision made together. The story fragment found here is about a shared plan, not a private goodbye.',
    artifactTitle: 'Recovered promise note', artifactType: 'note', artifactLines: ['TOGETHER','WE LEAVE','AFTER SUNSET','TOMORROW'],
    task: 'Which word proves this was a shared plan rather than one person deciding alone?', type: 'choice', options: ['TOGETHER','WE LEAVE','AFTER SUNSET','TOMORROW'], answer: 0,
    retry: 'Look for the word that includes both people in the decision.', fragmentBy: 'Ana', fragment: 'You said we would leave together. I packed only what I could carry.',
    evidence: 'Ana expected a shared departure. Nothing here suggests she planned to leave alone.', points: 120
  },
  {
    id: 'time', name: 'Sahat Kula', lat: 42.43595, lng: 19.26115, radius: 90, chapter: 'Six O’Clock', area: 'Stara Varoš',
    clue: 'Find the old place where Podgorica once trusted stone to tell the time.', hint1: 'You are looking for a historic timekeeper in Stara Varoš.', hint2: 'Find the stone clock tower close to Bećir Beg Osmanagić Square.',
    why: 'Their final meeting was fixed by an hour. At a place defined by time, the appointment itself becomes evidence.', artifactTitle: 'Meeting slip', artifactType: 'document', artifactLines: ['MEETING','18:00','SAME PLACE'],
    task: 'Besides place and hour, what detail can make two people keep the same appointment and still never meet?', type: 'choice', options: ['The weather','The date','Their names','The route home'], answer: 1,
    retry: 'An appointment needs a place, a time and one more basic detail.', fragmentBy: 'Marko', fragment: 'I arrived before six. I stayed until the street went quiet. I thought you had chosen not to come.', evidence: 'Marko says he came to the meeting. His account does not prove which day he came.', points: 140
  },
  {
    id: 'record', name: 'Starodoganjska Mosque area', lat: 42.43612, lng: 19.26006, radius: 95, chapter: 'The Missing Letter', area: 'Stara Varoš',
    clue: 'Find a place whose old name still carries the memory of records, trade and things that had to be accounted for.', hint1: 'The clue is hidden in an old word connected with customs and records.', hint2: 'Stay in Stara Varoš and look for the historic Starodoganjska area.',
    why: 'The chapter is about a message that should have been recorded, carried and received - but was not.', artifactTitle: 'Undelivered envelope', artifactType: 'envelope', artifactLines: ['TO: ANA','STATUS: NOT DELIVERED','BACK OF ENVELOPE: MFUUFS'],
    task: 'Move every letter in MFUUFS one step backward in the alphabet. What word appears?', type: 'text', answerText: 'LETTER', retry: 'M becomes L, F becomes E. Continue the same pattern.',
    fragmentBy: 'Ana', fragment: 'There was supposed to be one last letter. I never received it.', evidence: 'A final message was intended for Ana, but the surviving envelope is marked as not delivered.', points: 150
  },
  {
    id: 'safe', name: 'Ribnica Fortress / Depedogen', lat: 42.43772, lng: 19.25712, radius: 105, chapter: 'What Was Kept', area: 'Ribnica',
    clue: 'Find the remains of a place built to protect what mattered and control who could approach.', hint1: 'Think stone, defence and the oldest river routes.', hint2: 'Look for the fortress remains above Ribnica near the old bridge.',
    why: 'A place of protection fits the only physical evidence that survived: a bundle deliberately kept instead of thrown away.', artifactTitle: 'Bundle found with the letters', artifactType: 'bundle', artifactLines: ['FOR A.','DO NOT THROW AWAY','KEEP UNTIL SHE RETURNS'],
    task: 'What is the strongest reason the letters were kept?', type: 'choice', options: ['To erase the relationship','To keep them safe for a return','To sell them','To prove they were fake'], answer: 1,
    retry: 'Read the instruction on the bundle, especially the last line.', fragmentBy: 'Marko', fragment: 'I left the letters where no one would throw them away. I thought one day you might come back for them.', evidence: 'Marko preserved the letters because he still expected Ana might return.', points: 140
  },
  {
    id: 'waiting', name: 'Skaline', lat: 42.43915, lng: 19.25874, radius: 110, chapter: 'The Waiting', area: 'Ribnica riverbank',
    clue: 'Go down toward the river where traffic fades and footsteps become louder than the city.', hint1: 'You are looking for steps descending toward Ribnica.', hint2: 'Find Skaline, between the city centre and the river.',
    why: 'This quieter part of the route holds two separate accounts of waiting. The task is to compare them, not assume they describe the same night.', artifactTitle: 'Two separate notes', artifactType: 'split', artifactLines: ['ANA - 18:05 - STILL WAITING','MARKO - 18:07 - STILL WAITING'],
    task: 'What missing detail prevents us from proving these notes describe the same evening?', type: 'choice', options: ['Their names','The weather','The date','The location'], answer: 2,
    retry: 'The names and times are already visible. What would tell you whether it was the same evening?', fragmentBy: 'Shared', fragment: 'Two people wrote almost the same thing at almost the same hour: still waiting.', evidence: 'Both waited around 18:00. The notes do not show that they waited on the same date.', points: 160
  },
  {
    id: 'ordinary', name: 'Independence Square', lat: 42.44138, lng: 19.26266, radius: 100, chapter: 'An Ordinary Day', area: 'City centre',
    clue: 'Find the open civic space where an ordinary day can disappear into a crowd.', hint1: 'Think of the central public square of Podgorica.', hint2: 'Find Trg nezavisnosti in the city centre.',
    why: 'This busy public place mirrors the ordinariness of Ana’s day. Her list shows whether she was preparing to leave Marko or still expected him beside her.', artifactTitle: 'Ana’s shopping list', artifactType: 'list', artifactLines: ['bread','book','coffee','TWO TRAIN TICKETS','soap'],
    task: 'Which item most clearly shows that Ana still expected a shared future that day?', type: 'choice', options: ['Bread','Book','Two train tickets','Soap'], answer: 2,
    retry: 'Look for the only item clearly intended for two people.', fragmentBy: 'Ana', fragment: 'Nothing in my day looked like goodbye. Two tickets were folded into the same pocket.', evidence: 'Ana still expected Marko to travel with her.', points: 120
  },
  {
    id: 'apology', name: 'Bokeška Street', lat: 42.44215, lng: 19.26086, radius: 100, chapter: 'The Unsent Apology', area: 'City centre',
    clue: 'Find the street where conversations spill outside and the city keeps talking after dark.', hint1: 'Look for a central street known for cafés and evening life.', hint2: 'Find Bokeška ulica.',
    why: 'A street full of conversation contrasts with the words Marko never managed to send.', artifactTitle: 'Draft that was never sent', artifactType: 'letter', artifactLines: ['Still I waited.','Only your voice mattered.','Returning felt impossible.','Regret followed me.','Years did not change it.'],
    task: 'Read the first letter of each line. What word do they spell?', type: 'text', answerText: 'SORRY', retry: 'Read only the first letter of each of the five lines, from top to bottom.',
    fragmentBy: 'Marko', fragment: 'If you ever learn why I left, know that I was apologising for believing the worst of you.', evidence: 'Marko regretted the conclusion he drew after waiting alone.', points: 170
  },
  {
    id: 'memory', name: 'Njegošev Park', lat: 42.44255, lng: 19.25742, radius: 110, chapter: 'Two Versions', area: 'Morača river edge',
    clue: 'Find a green pause between the centre and the river, where two versions of one memory can sit side by side.', hint1: 'Look for a central park beside Morača.', hint2: 'Find Njegošev park.',
    why: 'This pause in the city holds two memories next to each other. They sound identical until you notice what neither statement includes.', artifactTitle: 'Two statements', artifactType: 'split', artifactLines: ['ANA - SAME PLACE / SIX O’CLOCK / NO ONE CAME','MARKO - SAME PLACE / SIX O’CLOCK / NO ONE CAME'],
    task: 'What crucial detail is missing from both statements?', type: 'choice', options: ['The place','The hour','The date','The promise'], answer: 2,
    retry: 'Place and hour are explicitly stated. Look for what an appointment still needs.', fragmentBy: 'Shared', fragment: 'They remembered the same place. The same hour. The same silence. But neither statement names the day.', evidence: 'Their memories agree on place and hour. The date remains unresolved.', points: 170
  },
  {
    id: 'crossing', name: 'Millennium Bridge', lat: 42.44462, lng: 19.25849, radius: 120, chapter: 'Across the River', area: 'Morača',
    clue: 'Find the modern crossing held by a tall pylon and cables - one structure joining two sides of the city.', hint1: 'You are looking for Podgorica’s most recognisable modern bridge.', hint2: 'Find Millennium Bridge.',
    why: 'The bridge gives physical meaning to Marko’s decision to move on only after he believed the meeting had failed.', artifactTitle: 'Marko’s route note', artifactType: 'note', artifactLines: ['18:00 - WAIT','AFTER DARK - CROSS THE RIVER','DO NOT RETURN TONIGHT'],
    task: 'What does this note prove about Marko’s departure?', type: 'choice', options: ['He left before waiting','He left only after disappointment','Ana told him to cross','The meeting place changed'], answer: 1,
    retry: 'Read the sequence of actions from top to bottom.', fragmentBy: 'Marko', fragment: 'I crossed the river only after I believed there was nothing left to return to.', evidence: 'Marko’s departure came after he waited, not before.', points: 150
  },
  {
    id: 'date', name: 'King’s Park', lat: 42.43964, lng: 19.26483, radius: 105, chapter: 'The Date', area: 'City centre',
    clue: 'Find a formal city garden close to the old centre, a calm place to compare two versions of the same appointment.', hint1: 'Look for a landscaped public park near the centre.', hint2: 'Find King’s Park / Kraljev park.',
    why: 'This location is used as the comparison point: two copies of the same appointment survive, and their only meaningful difference is the day.', artifactTitle: 'Two appointment copies', artifactType: 'split', artifactLines: ['COPY A - FRI 18 - 18:00','COPY B - SAT 19 - 18:00'],
    task: 'What must be established before the story can be resolved?', type: 'choice', options: ['Who bought the tickets','Which version each person received','Who waited longer','Who wrote first'], answer: 1,
    retry: 'The two copies disagree on the date. The key is identifying who received which copy.', fragmentBy: 'Shared', fragment: 'There were two versions of the same appointment: Friday the 18th and Saturday the 19th.', evidence: 'A one-day difference can explain how both people kept the same promise and still missed each other.', points: 190
  }
];
window.HUNT_DATA = { FINAL, checkpoints };
