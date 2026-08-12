const app = document.querySelector('#app');
const toastEl = document.querySelector('#toast');
const qs = new URLSearchParams(location.search);
const reviewMode = qs.get('review') === '1';
const API = '/hunt/team-api';

const state = {
  teamNo: 0,
  code: '',
  phase: 'entry',
  index: 0,
  score: 0,
  collected: [],
  hints: {},
  attempts: {},
  position: null,
  watchId: null,
  gpsError: '',
  finalSolved: false
};

const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));
const pad = n => String(n).padStart(2, '0');
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('on');
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => toastEl.classList.remove('on'), 2600);
}

async function eventApi(path, { method = 'GET', body } = {}) {
  const r = await fetch(API + path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store'
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Event service is unavailable.');
  return d;
}

function teamKey() { return `pg_hunt_v32_team_${state.teamNo}`; }
function progressValue() {
  if (state.phase === 'complete') return 100;
  if (state.phase === 'finalSearch' || state.phase === 'finalPuzzle') return 95;
  return Math.min(90, state.collected.length * 9);
}

function save() {
  if (!state.teamNo) return;
  localStorage.setItem(teamKey(), JSON.stringify({
    phase: state.phase,
    index: state.index,
    score: state.score,
    collected: state.collected,
    hints: state.hints,
    attempts: state.attempts,
    finalSolved: state.finalSolved
  }));
  eventApi('/progress', {
    method: 'POST',
    body: { code: state.code, progress: progressValue(), score: state.score }
  }).catch(() => {});
}

function restore() {
  try {
    const d = JSON.parse(localStorage.getItem(teamKey()) || 'null');
    if (!d) return false;
    Object.assign(state, d);
    state.collected = Array.isArray(state.collected) ? state.collected.slice(0, checkpoints.length) : [];
    state.index = clamp(Number(state.index) || 0, 0, checkpoints.length);
    return true;
  } catch {
    return false;
  }
}

function route() {
  return checkpoints.map((_, i) => checkpoints[(i + state.teamNo - 1) % checkpoints.length]);
}
function current() { return route()[state.index]; }
function currentBeat() { return STORY_BEATS[Math.min(state.collected.length, STORY_BEATS.length - 1)]; }

function distance(a, b) {
  const R = 6371000;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const q = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(q));
}

function bearing(a, b) {
  const toRad = x => x * Math.PI / 180;
  const toDeg = x => x * 180 / Math.PI;
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) - Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function cardinal(deg) {
  const labels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return labels[Math.round(deg / 45) % 8];
}

function arrivalRadius(cp) {
  const accuracy = Number(state.position?.accuracy || 0);
  const accuracyAllowance = clamp((accuracy - 20) * .45, 0, 30);
  return cp.radius + accuracyAllowance;
}

function gpsReliable() {
  return !state.position || Number(state.position.accuracy || 999) <= 120;
}

function isNear(cp) {
  if (!state.position || !gpsReliable()) return false;
  return distance(state.position, cp) <= arrivalRadius(cp);
}

function navInfo(cp) {
  if (!state.position) return { distance: null, bearing: null, cardinal: '—', signal: 0, accuracy: null };
  const d = Math.round(distance(state.position, cp));
  const b = bearing(state.position, cp);
  const signal = d <= arrivalRadius(cp) ? 100 : clamp(100 - (d / 9), 8, 94);
  return { distance: d, bearing: Math.round(b), cardinal: cardinal(b), signal, accuracy: Math.round(state.position.accuracy || 0) };
}

function distanceText(cp) {
  if (!state.position) return state.gpsError ? 'GPS unavailable' : 'Waiting for GPS';
  if (!gpsReliable()) return 'Weak GPS signal';
  const d = Math.round(distance(state.position, cp));
  if (d <= arrivalRadius(cp)) return 'Location confirmed';
  if (d < 160) return `${d} m · very close`;
  if (d < 450) return `${d} m · close`;
  return `${d} m away`;
}

function gpsInstruction(cp) {
  if (state.gpsError) return `${state.gpsError} Open GPS help if you need instructions.`;
  if (!state.position) return 'Allow location access. We will confirm the field zone when you arrive.';
  if (!gpsReliable()) return 'GPS accuracy is too weak for a fair check. Move into open sky and wait a few seconds.';
  if (isNear(cp)) return 'Field zone confirmed. Open the location and verify what you can see.';
  const info = navInfo(cp);
  return `Move generally ${info.cardinal} (${info.bearing}°). The field signal strengthens as you get closer.`;
}

function startGps() {
  if (state.watchId || !navigator.geolocation) {
    if (!navigator.geolocation) {
      state.gpsError = 'This browser does not provide geolocation.';
      updateGpsUI();
    }
    return;
  }
  state.gpsError = '';
  state.watchId = navigator.geolocation.watchPosition(
    p => {
      state.position = {
        lat: p.coords.latitude,
        lng: p.coords.longitude,
        accuracy: p.coords.accuracy
      };
      state.gpsError = '';
      updateGpsUI();
    },
    e => {
      state.gpsError = e.code === 1 ? 'Location permission is off.' : 'GPS could not get a reliable position.';
      updateGpsUI();
    },
    { enableHighAccuracy: true, maximumAge: 1500, timeout: 12000 }
  );
}

function updateGpsUI() {
  if (!['hunt', 'finalSearch'].includes(state.phase)) return;
  const cp = state.phase === 'finalSearch' ? FINAL : current();
  if (!cp) return;
  const info = navInfo(cp);
  const pill = document.querySelector('[data-gps-pill]');
  if (pill) pill.textContent = distanceText(cp);
  const dir = document.querySelector('[data-direction]');
  if (dir) dir.textContent = info.bearing === null ? '—' : `${info.cardinal} · ${info.bearing}°`;
  const dist = document.querySelector('[data-distance]');
  if (dist) dist.textContent = info.distance === null ? '—' : `${info.distance} m`;
  const signal = document.querySelector('[data-signal]');
  if (signal) signal.style.width = `${info.signal}%`;
  const accuracy = document.querySelector('[data-accuracy]');
  if (accuracy) accuracy.textContent = info.accuracy === null ? 'Waiting for signal' : `GPS accuracy ±${info.accuracy} m`;
  const status = document.querySelector('[data-gps-status]');
  if (status) {
    status.classList.toggle('bad', !!state.gpsError || !gpsReliable());
    status.classList.toggle('found', isNear(cp));
    const text = status.querySelector('p');
    if (text) text.textContent = gpsInstruction(cp);
  }
  const check = document.querySelector('[data-check-position]');
  if (check) check.textContent = isNear(cp) ? (state.phase === 'finalSearch' ? 'Open the ending' : 'Open field check') : 'Check my position';
}

function entry() {
  state.phase = 'entry';
  app.innerHTML = `
    <main class="app entry premium-entry">
      <section class="screen entry-screen">
        <div class="entry-visual" aria-hidden="true">
          <img src="assets/cities/podgorica.svg" alt="">
          <div class="entry-grid"></div>
          <div class="case-stamp"><span>CASE</span><b>19/18</b><small>PODGORICA</small></div>
        </div>
        <div class="wrap entry-wrap">
          <div class="brandline"><span class="brandmark">◇</span><span>Montenegro Treasure Hunt · Podgorica</span></div>
          <div class="hero editorial">
            <div class="eyebrow">LIVE CITY MYSTERY · TEN TEAMS</div>
            <h1>Ten Letters<br><em>That Never Arrived</em></h1>
            <p>Walk the city. Verify real places. Unlock a case file that only makes sense when all ten fragments are read in the right order.</p>
          </div>
          <div class="entry-layout">
            <div class="case-teaser">
              <span class="teaser-index">01</span>
              <p><b>One failed meeting.</b><br>Two people later wrote the same claim: <em>I came. You did not.</em></p>
            </div>
            <div class="paper access-card">
              <div class="paper-label">TEAM ACCESS</div>
              <h2>Open your route.</h2>
              <p>Your code identifies the event, your team and a unique starting point. No account. No setup.</p>
              <div class="field dark">
                <input id="teamCode" class="input" placeholder="PG26-01" autocomplete="one-time-code" autocapitalize="characters" aria-label="Team code">
              </div>
              <button class="btn full" id="enter">Enter the case</button>
              <div id="err" class="errorline" role="alert"></div>
              ${reviewMode ? '<div class="reviewnote">Review mode · GPS arrivals can be simulated.</div>' : '<a class="reviewlink" href="?review=1">Desktop review</a>'}
            </div>
          </div>
        </div>
      </section>
    </main>`;
  requestAnimationFrame(() => window.scrollTo(0, 0));
  document.querySelector('#enter').onclick = join;
  document.querySelector('#teamCode').addEventListener('keydown', e => { if (e.key === 'Enter') join(); });
}

async function join() {
  const input = document.querySelector('#teamCode');
  const code = input.value.trim().toUpperCase();
  const err = document.querySelector('#err');
  const match = code.match(/^PG26-(0[1-9]|10)$/);
  if (!match) {
    err.textContent = 'Use the team code given by the coordinator.';
    return;
  }
  const btn = document.querySelector('#enter');
  btn.disabled = true;
  btn.textContent = 'Opening your field route…';
  try {
    const d = await eventApi('/join', { method: 'POST', body: { code } });
    state.teamNo = d.team.teamNo;
    state.code = code;
  } catch (e) {
    if (!reviewMode) {
      err.textContent = e.message;
      btn.disabled = false;
      btn.textContent = 'Enter the case';
      return;
    }
    state.teamNo = Number(match[1]);
    state.code = code;
    toast('Review mode: using local team data.');
  }
  const resumed = restore();
  if (resumed && !['entry', 'briefing'].includes(state.phase)) {
    startGps();
    return render();
  }
  state.phase = 'briefing';
  briefing();
}

function briefing() {
  app.innerHTML = `
    <main class="app briefing-app">
      <section class="screen">
        <div class="wrap briefing-wrap">
          <div class="case-header">
            <div class="stepcount">TEAM ${pad(state.teamNo)} · CASE 19/18</div>
            <span class="case-status">UNRESOLVED</span>
          </div>
          <div class="brief-opening">
            <div>
              <div class="eyebrow">ARCHIVE INTAKE</div>
              <h1 class="brief-title">They both said<br><em>“I came.”</em></h1>
            </div>
            <p class="brief-lead">A small archive box recovered near Ribnica contains ten surviving documents tied to Ana and Marko. Years after one failed meeting, both still believed the other had chosen not to appear.</p>
          </div>
          <div class="story-intro paper dossier-intro">
            <div class="paper-label">YOUR ASSIGNMENT</div>
            <p>Each field location unlocks one <b>chronological archive fragment</b>. Teams start at different places, but the story is revealed in the same chronological case sequence for everyone.</p>
            <div class="case-question">How can two people keep the same promise, reach the same intended place at six, and never see each other?</div>
          </div>
          <div class="flowcards premium-flow">
            <article><span>01</span><h3>FIND</h3><p>Use clue, distance and compass bearing to reach one real place.</p></article>
            <article><span>02</span><h3>VERIFY</h3><p>Observe the location itself. The city is part of the puzzle.</p></article>
            <article><span>03</span><h3>SOLVE</h3><p>Answer a focused field question. No future clue is required.</p></article>
            <article><span>04</span><h3>UNLOCK</h3><p>Recover the next chronological fragment of the case.</p></article>
          </div>
          <div class="rules rules-premium"><span>GPS stays on</span><span>Walk - never run through traffic</span><span>Stay in public pedestrian areas</span><span>Archive fragments unlock in order</span></div>
          <button class="btn full hero-btn" id="start">Begin field investigation</button>
        </div>
      </section>
    </main>`;
  requestAnimationFrame(() => window.scrollTo(0, 0));
  document.querySelector('#start').onclick = () => {
    state.phase = 'hunt';
    save();
    startGps();
    render();
  };
}

function shell(body, { dock = true } = {}) {
  const pct = progressValue();
  const beat = currentBeat();
  const actCopy = state.phase === 'complete' ? 'CASE CLOSED · FIELD REPORT' : state.phase === 'finalSearch' ? 'EPILOGUE · FINAL LOCATION' : state.phase === 'finalPuzzle' ? 'FINAL DEDUCTION' : (beat?.act || 'FINAL');
  app.innerHTML = `
    <main class="app hunt-app">
      <header class="topbar premium-topbar">
        <div class="topin">
          <div class="case-mini"><span>CASE 19/18</span><b>TEAM ${pad(state.teamNo)}</b></div>
          <div class="top-progress-copy"><b>${state.collected.length}/10</b><span>archive fragments</span></div>
          <button class="scorepill" id="scoreBtn" aria-label="Open scoring information">${state.score} pts</button>
        </div>
        <div class="progress" aria-label="Game progress"><i style="width:${pct}%"></i></div>
        <div class="actline">${esc(actCopy)}</div>
      </header>
      <div class="wrap game">
        ${body}
        ${dock ? `<nav class="dock premium-dock" aria-label="Game navigation">
          <button id="huntNav" class="active"><span>◇</span>Field</button>
          <button id="evidenceNav"><span>▤</span>Case file</button>
          <button id="teamsNav"><span>◎</span>Teams</button>
        </nav>` : ''}
      </div>
    </main>`;
  requestAnimationFrame(() => window.scrollTo(0, 0));
  document.querySelector('#evidenceNav')?.addEventListener('click', evidenceSheet);
  document.querySelector('#teamsNav')?.addEventListener('click', teamsSheet);
  document.querySelector('#scoreBtn')?.addEventListener('click', scoreSheet);
}

function fieldNavigationMarkup(cp) {
  const info = navInfo(cp);
  return `
    <div class="field-nav">
      <div class="nav-primary">
        <div><span>DISTANCE</span><b data-distance>${info.distance === null ? '—' : `${info.distance} m`}</b></div>
        <div><span>BEARING</span><b data-direction>${info.bearing === null ? '—' : `${info.cardinal} · ${info.bearing}°`}</b></div>
      </div>
      <div class="signal-head"><span>FIELD SIGNAL</span><small data-accuracy>${info.accuracy === null ? 'Waiting for signal' : `GPS accuracy ±${info.accuracy} m`}</small></div>
      <div class="signal-track"><i data-signal style="width:${info.signal}%"></i></div>
    </div>`;
}

function render() {
  if (state.phase === 'briefing') return briefing();
  if (state.phase === 'finalPuzzle') return finalPuzzle();
  if (state.phase === 'finalSearch') return finalSearch();
  if (state.phase === 'complete') return complete();
  if (state.phase !== 'hunt') return entry();
  const cp = current();
  if (!cp) {
    state.phase = 'finalPuzzle';
    save();
    return finalPuzzle();
  }
  const beat = currentBeat();
  shell(`
    <section class="mission-card premium-mission">
      <div class="stagebar"><span class="active">1 FIND</span><span>2 VERIFY</span><span>3 SOLVE</span><span>4 UNLOCK</span></div>
      <div class="mission-head">
        <div>
          <div class="eyebrow">FIELD STOP ${state.index + 1} / 10 · ${esc(cp.seal)}</div>
          <h1>${esc(cp.chapter)}</h1>
          <p class="mission-sub">Next archive unlock: <b>${esc(beat?.title || 'Final deduction')}</b></p>
        </div>
        <div class="gpspill" data-gps-pill>${esc(distanceText(cp))}</div>
      </div>
      <div class="cluebox premium-clue">
        <small>FIELD CLUE</small>
        <p>${esc(cp.clue)}</p>
      </div>
      ${fieldNavigationMarkup(cp)}
      <div class="gps-status ${state.gpsError || !gpsReliable() ? 'bad' : ''} ${isNear(cp) ? 'found' : ''}" data-gps-status>
        <span class="pulse"></span><p>${esc(gpsInstruction(cp))}</p>
      </div>
      <div class="primary-actions">
        <button class="btn full" data-check-position>${isNear(cp) ? 'Open field check' : 'Check my position'}</button>
        <button class="btn secondary full" id="hint">Need a location hint</button>
        ${state.gpsError ? '<button class="textbtn" id="gpsHelp">How to enable location</button>' : ''}
        ${reviewMode ? '<button class="btn review full" id="simulate">Simulate field arrival</button>' : ''}
      </div>
    </section>`);
  document.querySelector('[data-check-position]').onclick = () => checkPosition(cp);
  document.querySelector('#hint').onclick = () => hintSheet(cp);
  document.querySelector('#gpsHelp')?.addEventListener('click', gpsHelpSheet);
  document.querySelector('#simulate')?.addEventListener('click', () => locationFound(cp));
}

function checkPosition(cp) {
  if (isNear(cp)) return locationFound(cp);
  if (!state.position) {
    startGps();
    toast(state.gpsError ? 'Location access is required to continue.' : 'Getting your GPS position…');
    return;
  }
  if (!gpsReliable()) {
    toast('GPS accuracy is too weak. Move into open sky and try again.');
    return;
  }
  const info = navInfo(cp);
  toast(`${info.distance} m away · move ${info.cardinal}`);
}
