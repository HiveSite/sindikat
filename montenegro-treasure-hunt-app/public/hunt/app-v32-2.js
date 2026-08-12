function sheet(title, sub, body, actions = '') {
  document.querySelector('#overlay')?.remove();
  document.body.insertAdjacentHTML('beforeend', `
    <div class="overlay" id="overlay">
      <div class="sheet premium-sheet" role="dialog" aria-modal="true" aria-labelledby="sheetTitle">
        <div class="sheet-head">
          <div class="handle"></div>
          <button class="sheet-close" data-close aria-label="Close">×</button>
          <div class="eyebrow darkeyebrow">${esc(sub)}</div>
          <h2 id="sheetTitle">${esc(title)}</h2>
        </div>
        <div class="sheet-scroll">${body}</div>
        <div class="sheet-actions">${actions || '<button class="btn secondary" data-close>Close</button>'}</div>
      </div>
    </div>`);
  document.querySelectorAll('[data-close]').forEach(b => b.onclick = closeSheet);
  document.querySelector('#overlay').addEventListener('click', e => { if (e.target.id === 'overlay') closeSheet(); });
  document.querySelector('.sheet button, .sheet input')?.focus({ preventScroll: true });
}

function closeSheet() { document.querySelector('#overlay')?.remove(); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

function hintSheet(cp) {
  const level = state.hints[cp.id] || 0;
  const body = `
    <p class="sheetlead">Hints only narrow the physical search area. They never reveal the field-check answer or the story fragment.</p>
    <div class="hintsteps premium-hints">
      <button class="hintstep ${level >= 1 ? 'used' : ''}" data-level="1">
        <span>Hint 1</span><b>Free</b><p>${level >= 1 ? esc(cp.hint1) : 'A gentle directional nudge.'}</p>
      </button>
      <button class="hintstep ${level >= 2 ? 'used' : ''}" data-level="2">
        <span>Hint 2</span><b>-20 pts</b><p>${level >= 2 ? esc(cp.hint2) : 'The place becomes much easier to identify.'}</p>
      </button>
      <button class="hintstep ${level >= 3 ? 'used' : ''}" data-level="3">
        <span>Reveal area</span><b>${level >= 2 ? '-30 pts' : '50 pts total'}</b><p>${level >= 3 ? `Approximate area: ${esc(cp.area)}` : 'Reveal the part of the city. Total hint cost becomes 50 points.'}</p>
      </button>
    </div>`;
  sheet('Find the field stop', 'LOCATION HINTS', body);
  document.querySelectorAll('.hintstep').forEach(b => b.onclick = () => useHint(cp, Number(b.dataset.level)));
}

function useHint(cp, lvl) {
  const old = state.hints[cp.id] || 0;
  if (lvl <= old) return;
  if (lvl === 2 && old < 1) return toast('Open Hint 1 first.');
  if (lvl === 3 && old < 2) return toast('Open Hint 2 first.');
  if (lvl === 2) state.score = Math.max(0, state.score - 20);
  if (lvl === 3) state.score = Math.max(0, state.score - 30);
  state.hints[cp.id] = lvl;
  save();
  closeSheet();
  hintSheet(cp);
}

function artifactMarkup(cp, compact = false) {
  return `
    <div class="artifact field-artifact ${compact ? 'compact' : ''}">
      <div class="artifact-top">
        <span>FIELD CARD · ${esc(cp.seal)}</span>
        <b>${esc(cp.artifactTitle)}</b>
      </div>
      <div class="artifact-body">
        ${cp.artifactLines.map(line => `<div class="artifact-line artifact-${cp.artifactType}">${esc(line)}</div>`).join('')}
      </div>
    </div>`;
}

function locationFound(cp) {
  if (navigator.vibrate) navigator.vibrate([45, 55, 85]);
  sheet(cp.name, '2 / 4 · VERIFY THE PLACE', `
    <div class="verified-banner"><span>FIELD ZONE CONFIRMED</span><b>${esc(cp.seal)}</b></div>
    <p class="sheetlead"><b>You are at the correct stop.</b> Before the archive unlocks, use the real place in front of you to verify one field detail.</p>
    <div class="observation"><span>LOOK AROUND</span><p>${esc(cp.observation)}</p></div>
    <div class="why"><span>WHY THIS PLACE MATTERS</span><p>${esc(cp.why)}</p></div>
    ${artifactMarkup(cp)}
    <div class="nextstep"><b>Next:</b> answer one observation question. Solving it unlocks the next chronological fragment - not a random piece of the story.</div>`,
    '<button class="btn" id="openChallenge">Start field check</button>');
  document.querySelector('#openChallenge').onclick = () => { closeSheet(); challenge(cp); };
}

function challenge(cp) {
  state.attempts[cp.id] = state.attempts[cp.id] || 0;
  let answer = '';
  if (cp.type === 'choice') {
    answer = `<div class="choices" role="group" aria-label="Answer options">${cp.options.map((o, i) => `<button class="choice" data-choice="${i}"><span>${String.fromCharCode(65 + i)}</span>${esc(o)}</button>`).join('')}</div>`;
  } else {
    answer = '<input id="textAnswer" class="answerinput" placeholder="Type your answer" autocomplete="off" aria-label="Your answer">';
  }
  sheet(cp.chapter, '3 / 4 · FIELD CHECK', `
    ${artifactMarkup(cp, true)}
    <div class="question"><small>OBSERVATION QUESTION</small><b>${esc(cp.task)}</b></div>
    ${answer}
    <div id="feedback" class="feedback" aria-live="polite"></div>`,
    '<button class="btn secondary" data-close>Back</button><button class="btn" id="submitAnswer" disabled>Verify answer</button>');

  let selected = null;
  document.querySelectorAll('.choice').forEach(b => b.onclick = () => {
    selected = Number(b.dataset.choice);
    document.querySelectorAll('.choice').forEach(x => x.classList.toggle('selected', x === b));
    document.querySelector('#submitAnswer').disabled = false;
  });
  document.querySelector('#textAnswer')?.addEventListener('input', e => {
    selected = e.target.value;
    document.querySelector('#submitAnswer').disabled = !String(selected).trim();
  });
  document.querySelector('#submitAnswer').onclick = () => checkAnswer(cp, selected);
}

function checkAnswer(cp, value) {
  state.attempts[cp.id] = (state.attempts[cp.id] || 0) + 1;
  const ok = cp.type === 'choice'
    ? Number(value) === cp.answer
    : String(value || '').trim().toUpperCase() === cp.answerText;
  if (!ok) {
    document.querySelector('#feedback').innerHTML = `<b>Not yet.</b><span>${esc(cp.retry)}</span>`;
    return;
  }

  const first = state.attempts[cp.id] === 1;
  const earned = cp.points + (first ? 20 : 0);
  const beatIndex = state.collected.length;
  const beat = STORY_BEATS[beatIndex];
  state.score += earned;
  if (!state.collected.includes(cp.id)) state.collected.push(cp.id);
  save();
  closeSheet();
  fragmentReveal(cp, beat, earned, first, beatIndex);
}

function storyDocumentMarkup(beat, number) {
  if (!beat) return '';
  const sourceClass = String(beat.source || '').toLowerCase().includes('ana') ? 'ana' : String(beat.source || '').toLowerCase().includes('marko') ? 'marko' : 'shared';
  return `
    <div class="story-document ${sourceClass}">
      <div class="doc-meta"><span>ARCHIVE ${pad(number)}</span><b>${esc(beat.source)}</b></div>
      <div class="doc-title">${esc(beat.title)}</div>
      <p>“${esc(beat.quote)}”</p>
      <div class="doc-stamp">RECOVERED</div>
    </div>`;
}

function fragmentReveal(cp, beat, earned, first, beatIndex) {
  sheet(beat?.title || 'Archive fragment', '4 / 4 · ARCHIVE UNLOCK', `
    <div class="unlock-sequence">
      <span class="field-seal">${esc(cp.seal)}</span>
      <i>→</i>
      <span class="archive-no">ARCHIVE ${pad(beatIndex + 1)}</span>
    </div>
    ${storyDocumentMarkup(beat, beatIndex + 1)}
    <div class="know"><span>WHAT THIS ESTABLISHES</span><p>${esc(beat?.establishes || '')}</p></div>
    <div class="reward"><b>+${earned} pts</b><span>${first ? 'Clean field check · first attempt.' : 'Archive fragment secured.'}</span></div>`,
    `<button class="btn" id="keepFragment">${beatIndex + 1 >= STORY_BEATS.length ? 'Open final deduction' : 'File fragment & reveal next field clue'}</button>`);
  document.querySelector('#keepFragment').onclick = () => {
    closeSheet();
    state.index += 1;
    if (state.index >= checkpoints.length) state.phase = 'finalPuzzle';
    save();
    render();
  };
}

function synthesis() {
  const count = state.collected.length;
  const beats = STORY_BEATS.slice(0, count);
  let open = 'Start building the case. Each field stop unlocks the next chronological document.';
  if (count >= 1) open = 'Both planned a shared departure. What turned that plan into two separate memories?';
  if (count >= 3) open = 'A final letter failed to arrive. What information was missing when the meeting happened?';
  if (count >= 5) open = 'Both accounts contain a wait around six. The contradiction is no longer whether someone showed up.';
  if (count >= 8) open = 'Place and hour now match. Which basic appointment detail has still not been established?';
  if (count >= 9) open = 'Two appointment copies disagree on the date. Which version belonged to Ana, and which to Marko?';
  if (count >= 10) open = 'The correction record identifies the failed delivery. Reconstruct the two dates to close the case.';
  return { beats, open };
}

function evidenceSheet() {
  const syn = synthesis();
  const foundFields = state.collected.map(id => checkpoints.find(c => c.id === id)).filter(Boolean);
  const body = syn.beats.length ? `
    <div class="case-brief premium-case-brief">
      <span>CASE 19/18 · WORKING THEORY</span>
      <p>Ana and Marko both believed the other missed their final meeting. The archive is chronological even though your physical route is not.</p>
    </div>
    <div class="case-meter">
      <div><small>ARCHIVE</small><b>${syn.beats.length}/10</b></div>
      <div><small>FIELD STOPS</small><b>${foundFields.length}/10</b></div>
      <div><small>STATUS</small><b>${syn.beats.length === 10 ? 'DEDUCE' : 'OPEN'}</b></div>
    </div>
    <div class="synthesis premium-synthesis"><small>OPEN QUESTION</small><p class="openq">${esc(syn.open)}</p></div>
    <div class="case-timeline">
      ${syn.beats.map((beat, i) => `
        <article class="timeline-fragment">
          <div class="timeline-index">${pad(i + 1)}</div>
          <div>
            <small>${esc(beat.act)} · ${esc(beat.source)}</small>
            <h3>${esc(beat.title)}</h3>
            <p>“${esc(beat.quote)}”</p>
            <b>${esc(beat.establishes)}</b>
          </div>
        </article>`).join('')}
    </div>
    <details class="field-log">
      <summary>Field verification log · ${foundFields.length}/10</summary>
      <div>${foundFields.map((c, i) => `<span><b>${pad(i + 1)}</b>${esc(c.seal)} · ${esc(c.name)}</span>`).join('')}</div>
    </details>`
    : '<div class="empty"><b>The case file is still sealed.</b><p>Verify your first location and the archive timeline will begin here.</p></div>';
  sheet('Case file', 'CHRONOLOGICAL ARCHIVE', body);
}

async function teamsSheet() {
  sheet('Field progress', 'TEN TEAMS · ONE CASE', '<div id="board" class="loadingboard">Loading teams…</div>');
  try {
    const d = await eventApi('/board');
    const board = document.querySelector('#board');
    if (!board) return;
    board.innerHTML = `
      <div class="board-note"><b>This is not a speed race.</b> There is no time bonus. Progress reflects completed case work; score rewards clean solves and fewer paid hints.</div>
      <div class="drawer-list team-board">
        ${d.teams.map(t => `
          <article class="team-card ${t.teamNo === state.teamNo ? 'mine' : ''}">
            <div class="teamline">
              <div><small>${t.teamNo === state.teamNo ? 'YOUR TEAM' : 'FIELD TEAM'}</small><b>Team ${pad(t.teamNo)}</b></div>
              <strong>${Math.round(t.progress || 0)}%</strong>
            </div>
            <div class="bar"><i style="width:${clamp(t.progress || 0, 0, 100)}%"></i></div>
            <div class="teamfoot"><span>${t.status === 'completed' ? 'Case closed' : t.status === 'active' ? 'In the field' : 'Not started'}</span><span>${t.score || 0} pts</span></div>
          </article>`).join('')}
      </div>`;
  } catch (e) {
    const board = document.querySelector('#board');
    if (board) board.innerHTML = `<div class="empty"><b>Team board unavailable.</b><p>${esc(e.message)}</p>${reviewMode ? '<p>Review mode can still test the complete local experience.</p>' : ''}</div>`;
  }
}

function scoreSheet() {
  sheet('Case scoring', 'SECONDARY TO THE STORY', `
    <div class="score-rules premium-score-rules">
      <p><b>Field points</b> vary slightly by stop.</p>
      <p><b>+20 pts</b> for a correct first attempt.</p>
      <p><b>Hint 1</b> is free. Hint 2 costs 20 points. Revealing the area brings the total hint cost to 50 points.</p>
      <p><b>No time bonus.</b> The route is designed for walking, observation and safe movement through the city.</p>
      <p>Your score is a light competitive layer. Closing the case is the actual objective.</p>
      ${reviewMode ? '<button class="btn secondary full" id="resetReview">Reset this team on this device</button>' : ''}
    </div>`);
  document.querySelector('#resetReview')?.addEventListener('click', resetReview);
}

function gpsHelpSheet() {
  sheet('Location access', 'GPS HELP', `
    <div class="score-rules">
      <p><b>iPhone / Safari:</b> Settings → Privacy & Security → Location Services → Safari Websites → While Using.</p>
      <p><b>Android / Chrome:</b> tap the lock/settings icon beside the address → Permissions → Location → Allow.</p>
      <p><b>Weak signal:</b> move away from dense walls or covered areas, keep the phone screen awake and wait a few seconds under open sky.</p>
      <p>The app also checks GPS accuracy. A very weak reading will not falsely unlock a location.</p>
    </div>`);
}

function resetReview() {
  if (!reviewMode) return;
  localStorage.removeItem(teamKey());
  eventApi('/progress', { method: 'POST', body: { code: state.code, progress: 0, score: 0 } }).catch(() => {});
  closeSheet();
  Object.assign(state, {
    phase: 'briefing', index: 0, score: 0, collected: [], hints: {}, attempts: {}, finalSolved: false
  });
  briefing();
  toast('Review progress reset.');
}
