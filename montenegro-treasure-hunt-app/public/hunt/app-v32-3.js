function finalPuzzle() {
  state.phase = 'finalPuzzle';
  save();
  shell(`
    <section class="final-puzzle premium-final">
      <div class="stagebar finalstage"><span class="active">FINAL DEDUCTION</span></div>
      <div class="eyebrow">ALL 10 ARCHIVE FRAGMENTS RECOVERED</div>
      <h1>Build the only sequence that fits every document.</h1>
      <p class="lead">You now know that both intended to leave together, both believed they reached the meeting at six, two appointment copies existed, and a correction addressed to Ana was never delivered.</p>

      <div class="deduction-board">
        <div class="deduction-row" data-group="marko">
          <span>01</span>
          <div><small>MARKO'S COPY</small><b>Which appointment did Marko follow?</b></div>
          <div class="deduction-options">
            <button data-value="fri">FRI 18 · 18:00</button>
            <button data-value="sat">SAT 19 · 18:00</button>
          </div>
        </div>
        <div class="deduction-row" data-group="ana">
          <span>02</span>
          <div><small>ANA'S COPY</small><b>Which appointment did Ana follow?</b></div>
          <div class="deduction-options">
            <button data-value="fri">FRI 18 · 18:00</button>
            <button data-value="sat">SAT 19 · 18:00</button>
          </div>
        </div>
        <div class="deduction-row" data-group="failure">
          <span>03</span>
          <div><small>THE FAILED LINK</small><b>What should have prevented the mistake?</b></div>
          <div class="deduction-options wide">
            <button data-value="letter">The correction letter</button>
            <button data-value="tickets">The train tickets</button>
            <button data-value="bridge">The river crossing</button>
          </div>
        </div>
      </div>

      <button class="btn full deduction-submit" id="testDeduction" disabled>Test reconstruction</button>
      <div id="finalFeedback" class="final-feedback" aria-live="polite"></div>
    </section>`);

  const picks = {};
  document.querySelectorAll('.deduction-row').forEach(row => {
    row.querySelectorAll('button').forEach(btn => btn.onclick = () => {
      picks[row.dataset.group] = btn.dataset.value;
      row.querySelectorAll('button').forEach(x => x.classList.toggle('selected', x === btn));
      document.querySelector('#testDeduction').disabled = Object.keys(picks).length < 3;
    });
  });

  document.querySelector('#testDeduction').onclick = () => {
    const ok = picks.marko === 'fri' && picks.ana === 'sat' && picks.failure === 'letter';
    const feedback = document.querySelector('#finalFeedback');
    if (!ok) {
      feedback.innerHTML = '<b>The sequence still contradicts the archive.</b><span>Use the two appointment copies together with the correction record addressed to Ana.</span>';
      return;
    }
    feedback.innerHTML = '<b>Reconstruction holds.</b><span>Now take the solved case to its final physical location.</span>';
    state.finalSolved = true;
    state.phase = 'finalSearch';
    save();
    setTimeout(finalSearch, 650);
  };
}

function finalSearch() {
  state.phase = 'finalSearch';
  save();
  startGps();
  shell(`
    <section class="mission-card premium-mission final-search">
      <div class="stagebar finalstage"><span class="active">EPILOGUE · FIND THE END</span></div>
      <div class="mission-head">
        <div>
          <div class="eyebrow">FINAL FIELD LOCATION</div>
          <h1>Take the two stories to one place.</h1>
          <p class="mission-sub">Your reconstruction is complete. The city still has one last piece of meaning to add.</p>
        </div>
        <div class="gpspill" data-gps-pill>${esc(distanceText(FINAL))}</div>
      </div>
      <div class="cluebox premium-clue final-clue"><small>FINAL CLUE</small><p>${esc(FINAL.clue)}</p></div>
      <div class="final-context"><span>CASE THEORY</span><p><b>Marko:</b> Friday 18 · 18:00<br><b>Ana:</b> Saturday 19 · 18:00<br><b>Failed link:</b> the undelivered correction.</p></div>
      ${fieldNavigationMarkup(FINAL)}
      <div class="gps-status ${state.gpsError || !gpsReliable() ? 'bad' : ''} ${isNear(FINAL) ? 'found' : ''}" data-gps-status><span class="pulse"></span><p>${esc(gpsInstruction(FINAL))}</p></div>
      <div class="primary-actions">
        <button class="btn full" data-check-position>${isNear(FINAL) ? 'Open the ending' : 'Check my position'}</button>
        ${state.gpsError ? '<button class="textbtn" id="gpsHelp">How to enable location</button>' : ''}
        ${reviewMode ? '<button class="btn review full" id="simFinal">Simulate final arrival</button>' : ''}
      </div>
    </section>`);

  document.querySelector('[data-check-position]').onclick = () => {
    if (isNear(FINAL)) completeStory();
    else if (!state.position) {
      startGps();
      toast('Getting your GPS position…');
    } else if (!gpsReliable()) {
      toast('GPS accuracy is too weak. Move into open sky and try again.');
    } else {
      const info = navInfo(FINAL);
      toast(`${info.distance} m away · move ${info.cardinal}`);
    }
  };
  document.querySelector('#gpsHelp')?.addEventListener('click', gpsHelpSheet);
  document.querySelector('#simFinal')?.addEventListener('click', completeStory);
}

function completeStory() {
  if (state.phase === 'complete') return;
  state.phase = 'complete';
  state.score += 250;
  save();
  if (navigator.vibrate) navigator.vibrate([60, 50, 60, 50, 120]);
  complete();
}

function complete() {
  state.phase = 'complete';
  shell(`
    <section class="ending premium-ending">
      <div class="case-closed-seal"><span>CASE</span><b>CLOSED</b><small>19/18</small></div>
      <div class="eyebrow">SASTAVCI · WHERE TWO WATERS MEET</div>
      <h1>They both came.</h1>
      <p class="ending-deck">The contradiction was never a broken promise. It was a one-day error that each person experienced as abandonment.</p>

      <div class="ending-copy final-dossier">
        <div class="dossier-line"><span>MARKO</span><b>FRIDAY 18 · 18:00</b></div>
        <div class="dossier-line"><span>ANA</span><b>SATURDAY 19 · 18:00</b></div>
        <div class="dossier-line"><span>CORRECTION</span><b>NOT DELIVERED</b></div>
        <p>Marko followed the Friday copy. Ana held the Saturday copy. A correction had been prepared for Ana, but the delivery record shows it never reached her. Both waited at the intended place, at the intended hour, one day apart.</p>
      </div>

      <div class="recovered-letter">
        <small>THE LETTER THAT NEVER ARRIVED</small>
        <p>ANA - ignore the previous appointment copy. The meeting is <b>Friday 18 at 18:00.</b></p>
        <span>DELIVERY STATUS · FAILED</span>
      </div>

      <div class="ending-line">Two sincere versions of one story finally meet here - where Ribnica and Morača do.</div>
      <div class="result-card premium-result">
        <small>TEAM ${pad(state.teamNo)} · FIELD REPORT</small>
        <b>${state.score} pts</b>
        <span>10 field verifications · 10 archive fragments · final deduction</span>
      </div>
      <div class="ending-actions">
        <button class="btn full" id="shareResult">Share case result</button>
        <button class="btn secondary full" id="openCaseFile">Open recovered case file</button>
        <button class="textbtn" id="openBoard">See team field progress</button>
      </div>
    </section>`, { dock: false });
  document.querySelector('#openBoard').onclick = teamsSheet;
  document.querySelector('#openCaseFile').onclick = evidenceSheet;
  document.querySelector('#shareResult').onclick = shareResult;
}

async function shareResult() {
  const text = `Team ${pad(state.teamNo)} closed Case 19/18 in the Podgorica City Treasure Hunt with ${state.score} points.`;
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Podgorica City Treasure Hunt', text });
      return;
    }
    await navigator.clipboard.writeText(text);
    toast('Result copied.');
  } catch (e) {
    if (e?.name !== 'AbortError') toast('Sharing is not available on this device.');
  }
}

if ('serviceWorker' in navigator && !reviewMode) {
  navigator.serviceWorker.register('/hunt/sw.js').catch(() => {});
}

entry();
