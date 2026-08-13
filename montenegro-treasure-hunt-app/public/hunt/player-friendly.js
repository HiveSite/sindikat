(() => {
  if (window.__MTH_FRIENDLY_UX__) return;
  window.__MTH_FRIENDLY_UX__ = true;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const safe = fn => { try { fn(); } catch (e) { console.warn('MTH friendly UX', e); } };
  const later = fn => requestAnimationFrame(() => safe(fn));

  function setText(el, value) {
    if (el && el.textContent !== value) el.textContent = value;
  }

  function insertOnce(parent, position, key, html) {
    if (!parent || document.querySelector(`[data-friendly="${key}"]`)) return null;
    parent.insertAdjacentHTML(position, html);
    return document.querySelector(`[data-friendly="${key}"]`);
  }

  function decorateEntry() {
    const card = $('.access-card');
    if (!card) return;
    const input = $('#teamCode');
    const btn = $('#enter');

    insertOnce(card, 'afterbegin', 'entry-kicker', `
      <div class="friendly-entry-kicker" data-friendly="entry-kicker">
        <span>START HERE</span><b>Your coordinator gave you everything you need.</b>
      </div>`);

    const field = card.querySelector('.field');
    if (field) insertOnce(field, 'beforebegin', 'entry-flow', `
      <div class="friendly-entry-flow" data-friendly="entry-flow">
        <div><i>1</i><span><b>Enter your team code</b><small>Use the code from your coordinator.</small></span></div>
        <div><i>2</i><span><b>Allow location</b><small>GPS confirms when you reach each field stop.</small></span></div>
        <div><i>3</i><span><b>Follow one clue at a time</b><small>Your story unlocks automatically as you solve.</small></span></div>
      </div>`);

    if (field) insertOnce(field, 'afterend', 'entry-code-help', `
      <div class="friendly-code-help" data-friendly="entry-code-help">No account needed · no program selection · progress stays with this device.</div>`);

    if (input && !input.dataset.friendlyBound) {
      input.dataset.friendlyBound = '1';
      input.spellcheck = false;
      input.autocomplete = 'one-time-code';
      input.addEventListener('input', () => {
        const next = input.value.toUpperCase().replace(/\s+/g, '');
        if (next !== input.value) input.value = next;
      });
    }
    setText(btn, 'Open my game →');
  }

  function decorateBriefing() {
    const wrap = $('.briefing-wrap');
    if (!wrap) return;
    const header = $('.case-header', wrap);
    const totalStops = typeof checkpoints !== 'undefined' && Array.isArray(checkpoints) ? checkpoints.length : 0;
    const team = typeof state !== 'undefined' ? state.teamNo : 0;
    const program = typeof state !== 'undefined' ? (state.programName || 'Live program') : 'Live program';

    if (header) insertOnce(header, 'afterend', 'brief-summary', `
      <div class="friendly-summarybar" data-friendly="brief-summary">
        <div><small>YOU ARE</small><b>Team ${String(team || 1).padStart(2, '0')}</b></div>
        <div><small>PROGRAM</small><b>${String(program).replace(/[<>]/g, '')}</b></div>
        <div><small>YOUR ROUTE</small><b>${totalStops || '—'} field stops</b></div>
      </div>`);

    const start = $('#start');
    if (start) {
      insertOnce(start, 'beforebegin', 'brief-ready', `
        <div class="friendly-ready" data-friendly="brief-ready">
          <b>Before you start</b>
          <span>Keep GPS on</span><span>Walk safely</span><span>Read only the current clue</span>
        </div>`);
      setText(start, 'Start first clue →');
    }
  }

  function missionMessage() {
    let cp = null;
    try { cp = typeof current === 'function' ? current() : null; } catch {}
    let near = false;
    let reliable = true;
    try { near = !!(cp && typeof isNear === 'function' && isNear(cp)); } catch {}
    try { reliable = typeof gpsReliable !== 'function' || gpsReliable(); } catch {}
    const hasPosition = typeof state !== 'undefined' && !!state.position;
    const hasError = typeof state !== 'undefined' && !!state.gpsError;

    if (near) return {step:'STEP 2 OF 4', title:'You found the field stop', copy:'Open the field check, look around and verify one detail from the real place.', tone:'success'};
    if (hasError) return {step:'STEP 1 OF 4', title:'Location needs your attention', copy:'Enable location access, then come back here. Your clue and progress are safe.', tone:'warning'};
    if (hasPosition && !reliable) return {step:'STEP 1 OF 4', title:'Give GPS a few seconds', copy:'Move into a more open area and wait for a stronger signal before checking again.', tone:'warning'};
    if (!hasPosition) return {step:'STEP 1 OF 4', title:'Find the place from the clue', copy:'Read the clue first. When you are moving, allow location so the game can confirm your arrival.', tone:''};
    return {step:'STEP 1 OF 4', title:'Keep moving toward the clue', copy:'Use distance and direction below. Check your position again when you think you are close.', tone:''};
  }

  function decorateMission() {
    const card = $('.premium-mission');
    if (!card || $('.final-search', card)) return;
    const stage = $('.stagebar', card);
    const msg = missionMessage();
    if (stage) {
      let box = $('[data-friendly="mission-now"]');
      if (!box) {
        stage.insertAdjacentHTML('afterend', `<div class="friendly-now ${msg.tone}" data-friendly="mission-now"><small></small><b></b><p></p></div>`);
        box = $('[data-friendly="mission-now"]');
      }
      setText($('small', box), msg.step);
      setText($('b', box), msg.title);
      setText($('p', box), msg.copy);
      box.className = `friendly-now ${msg.tone}`;
    }

    const button = $('[data-check-position]', card);
    let near = false;
    let reliable = true;
    try { const cp = typeof current === 'function' ? current() : null; near = !!(cp && isNear(cp)); } catch {}
    try { reliable = typeof gpsReliable !== 'function' || gpsReliable(); } catch {}
    const hasPosition = typeof state !== 'undefined' && !!state.position;
    if (button) {
      if (near) setText(button, 'I’m here - verify this place →');
      else if (!hasPosition) setText(button, 'Enable location & check');
      else if (!reliable) setText(button, 'Check GPS signal again');
      else setText(button, 'Check my position');
    }

    const hint = $('#hint');
    if (hint) {
      setText(hint, 'I need a hint');
      if (!hint.nextElementSibling?.classList.contains('friendly-hint-note')) {
        hint.insertAdjacentHTML('afterend', '<small class="friendly-hint-note">Hint 1 is free. Stronger hints may cost points.</small>');
      }
    }

    const gps = $('[data-gps-status]', card);
    if (gps && !gps.querySelector('.friendly-gps-label')) {
      const label = near ? 'LOCATION CONFIRMED' : (hasPosition ? 'LIVE GPS' : 'GPS CHECK');
      gps.insertAdjacentHTML('afterbegin', `<strong class="friendly-gps-label">${label}</strong>`);
      gps.setAttribute('aria-live', 'polite');
    }
  }

  function decorateSheet() {
    const sheet = $('.sheet');
    if (!sheet) return;
    const eyebrow = $('.darkeyebrow', sheet)?.textContent || '';
    const match = eyebrow.match(/([1-4])\s*\/\s*4/);
    if (match && !sheet.querySelector('[data-friendly="sheet-progress"]')) {
      const currentStep = Number(match[1]);
      const head = $('.sheet-head', sheet);
      head?.insertAdjacentHTML('beforeend', `
        <div class="friendly-sheet-progress" data-friendly="sheet-progress">
          <span>${[1,2,3,4].map(n => `<i class="${n <= currentStep ? 'on' : ''}"></i>`).join('')}</span>
          <b>Step ${currentStep} of 4</b>
        </div>`);
    }

    const openChallenge = $('#openChallenge', sheet);
    if (openChallenge) {
      setText(openChallenge, 'Continue to the question →');
      const verified = $('.verified-banner', sheet);
      if (verified && !verified.nextElementSibling?.classList.contains('friendly-confirmation')) {
        verified.insertAdjacentHTML('afterend', '<div class="friendly-confirmation"><b>✓ Correct location</b><span>Now use what is physically around you.</span></div>');
      }
    }

    const question = $('.question', sheet);
    if (question && !question.previousElementSibling?.classList.contains('friendly-question-tip')) {
      question.insertAdjacentHTML('beforebegin', '<div class="friendly-question-tip"><b>Look at the place, not the story.</b><span>Choose the answer that matches what you can actually see.</span></div>');
    }

    const submit = $('#submitAnswer', sheet);
    if (submit) setText(submit, 'Check my answer');

    const keep = $('#keepFragment', sheet);
    if (keep) {
      const reward = $('.reward', sheet);
      if (reward && !reward.nextElementSibling?.classList.contains('friendly-unlock-note')) {
        const done = typeof state !== 'undefined' ? state.collected.length : 0;
        const total = typeof checkpoints !== 'undefined' && Array.isArray(checkpoints) ? checkpoints.length : done;
        reward.insertAdjacentHTML('afterend', `<div class="friendly-unlock-note"><b>Story saved · ${done}/${total}</b><span>Your next clue will open when you continue.</span></div>`);
      }
      if (!/final deduction/i.test(keep.textContent || '')) setText(keep, 'Save fragment & show next clue →');
    }

    const feedback = $('#feedback', sheet);
    if (feedback) feedback.setAttribute('aria-live', 'assertive');
  }

  function decorateFinalPuzzle() {
    const card = $('.premium-final');
    if (!card) return;
    const stage = $('.stagebar', card);
    if (stage) insertOnce(stage, 'afterend', 'final-puzzle-now', `
      <div class="friendly-now" data-friendly="final-puzzle-now">
        <small>FINAL · STEP 1 OF 2</small><b>Reconstruct the story</b>
        <p>Pick one answer in every row. You can change any choice before checking your reconstruction.</p>
      </div>`);
    const submit = $('#testDeduction');
    if (submit) setText(submit, 'Check my reconstruction →');
    $$('.deduction-row').forEach((row, i) => row.setAttribute('aria-label', `Final question ${i + 1}`));
  }

  function decorateFinalSearch() {
    const card = $('.final-search');
    if (!card) return;
    const stage = $('.stagebar', card);
    if (stage) insertOnce(stage, 'afterend', 'final-search-now', `
      <div class="friendly-now success" data-friendly="final-search-now">
        <small>FINAL · STEP 2 OF 2</small><b>One last place</b>
        <p>Your deduction is solved. Follow the final clue, reach the location and reveal the ending.</p>
      </div>`);
    const btn = $('[data-check-position]', card);
    let near = false;
    try { near = typeof isNear === 'function' && isNear(FINAL); } catch {}
    if (btn) setText(btn, near ? 'I’m here - reveal the ending →' : 'Check final location');
  }

  function decorateComplete() {
    const ending = $('.premium-ending');
    if (!ending) return;
    const eyebrow = $('.eyebrow', ending);
    if (eyebrow) insertOnce(eyebrow, 'beforebegin', 'complete-chip', '<div class="friendly-complete-chip" data-friendly="complete-chip">✓ GAME COMPLETE</div>');
    const result = $('.premium-result', ending);
    if (result) insertOnce(result, 'beforebegin', 'complete-summary', `
      <div class="friendly-complete-summary" data-friendly="complete-summary">
        <b>You made it.</b><span>Your route, field checks, story and final deduction are complete.</span>
      </div>`);
    setText($('#shareResult'), 'Share my result');
    setText($('#openCaseFile'), 'Read the full story');
    setText($('#openBoard'), 'See all teams');
  }

  function decorateFeedback() {
    const feedback = $('#feedback');
    if (!feedback || !feedback.textContent.trim()) return;
    if (!feedback.classList.contains('friendly-feedback')) feedback.classList.add('friendly-feedback');
  }

  function decorateAll() {
    safe(decorateEntry);
    safe(decorateBriefing);
    safe(decorateMission);
    safe(decorateSheet);
    safe(decorateFinalPuzzle);
    safe(decorateFinalSearch);
    safe(decorateComplete);
    safe(decorateFeedback);
  }

  function wrap(name, after = decorateAll) {
    try {
      const original = window[name];
      if (typeof original !== 'function' || original.__friendlyWrapped) return;
      const wrapped = function(...args) {
        const result = original.apply(this, args);
        later(after);
        return result;
      };
      wrapped.__friendlyWrapped = true;
      window[name] = wrapped;
    } catch (e) {
      console.warn(`MTH friendly UX could not wrap ${name}`, e);
    }
  }

  ['entry','briefing','render','finalPuzzle','finalSearch','complete','locationFound','challenge','fragmentReveal','evidenceSheet','teamsSheet','scoreSheet','hintSheet','gpsHelpSheet'].forEach(name => wrap(name));
  wrap('checkAnswer', () => { decorateAll(); setTimeout(() => safe(decorateFeedback), 0); });

  document.addEventListener('click', event => {
    if (event.target.closest('.choice,.deduction-options button,[data-check-position],#submitAnswer,#keepFragment')) {
      setTimeout(() => safe(decorateAll), 0);
    }
  }, {passive:true});

  document.addEventListener('DOMContentLoaded', () => later(decorateAll));
  later(decorateAll);
})();
