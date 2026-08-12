(() => {
  const baseEventApi = eventApi;
  state.programId = state.programId || '';
  state.programName = state.programName || '';
  state.programLocation = state.programLocation || '';
  state.programTeamCount = state.programTeamCount || 10;

  eventApi = async function(path, options = {}) {
    let nextPath = path;
    if (state.code && (path === '/board' || path === '/content')) {
      const sep = path.includes('?') ? '&' : '?';
      nextPath = `${path}${sep}code=${encodeURIComponent(state.code)}`;
    }
    return baseEventApi(nextPath, options);
  };

  teamKey = function() {
    const program = state.programId || 'legacy';
    return `mth_v40_${program}_team_${state.teamNo}`;
  };

  entry = function() {
    state.phase = 'entry';
    app.innerHTML = `
      <main class="app entry premium-entry">
        <section class="screen entry-screen">
          <div class="entry-visual" aria-hidden="true">
            <div class="entry-grid"></div>
            <div class="case-stamp"><span>MTH</span><b>LIVE</b><small>MONTENEGRO</small></div>
          </div>
          <div class="wrap entry-wrap">
            <div class="brandline"><span class="brandmark">◇</span><span>Montenegro Treasure Hunt</span></div>
            <div class="hero editorial">
              <div class="eyebrow">LIVE PROGRAM ACCESS</div>
              <h1>One code.<br><em>Your whole route.</em></h1>
              <p>Enter the access code from your coordinator. The code already knows which program you are in, your team number and your starting route.</p>
            </div>
            <div class="entry-layout">
              <div class="case-teaser"><span class="teaser-index">01</span><p><b>No program selection.</b><br>Your code opens the correct live hunt automatically.</p></div>
              <div class="paper access-card">
                <div class="paper-label">PROGRAM ACCESS</div>
                <h2>Enter your code.</h2>
                <p>Use exactly the code given by the coordinator.</p>
                <div class="field dark"><input id="teamCode" class="input" placeholder="YOUR-CODE" autocomplete="one-time-code" autocapitalize="characters" aria-label="Access code"></div>
                <button class="btn full" id="enter">Enter the program</button>
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
  };

  join = async function() {
    const input = document.querySelector('#teamCode');
    const code = input.value.trim().toUpperCase();
    const err = document.querySelector('#err');
    if (!/^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(code)) {
      err.textContent = 'Use the access code given by the coordinator.';
      return;
    }
    const btn = document.querySelector('#enter');
    btn.disabled = true;
    btn.textContent = 'Opening your program…';
    try {
      const d = await eventApi('/join', {method:'POST', body:{code}});
      state.teamNo = d.team.teamNo;
      state.code = code;
      state.programId = d.program?.id || d.event || 'PROGRAM';
      state.programName = d.program?.name || state.programId;
      state.programLocation = d.program?.location || '';
      state.programTeamCount = Number(d.program?.teamCount || 10);
      window.MTH_PROGRAM = d.program || null;
      document.title = `${state.programName} | Montenegro Treasure Hunt`;
      applyContent(d.content);
      applyConfig(d.config);
      state._joinControl = d.team?.control || null;
    } catch (e) {
      if (!reviewMode) {
        err.textContent = e.message;
        btn.disabled = false;
        btn.textContent = 'Enter the program';
        return;
      }
      const trailing = code.match(/(\d{1,2})$/);
      state.teamNo = trailing ? Math.max(1, Number(trailing[1])) : 1;
      state.code = code;
      state.programId = code.split(/[-_]/)[0] || 'REVIEW';
      state.programName = 'Review program';
      toast('Review mode: using local program data.');
    }
    const resumed = restore();
    if (state._joinControl) { const pending = state._joinControl; delete state._joinControl; applyControl(pending); }
    startControlPolling();
    syncPresence(true);
    if (resumed && !['entry','briefing'].includes(state.phase)) {
      startGps();
      return render();
    }
    state.phase = 'briefing';
    briefing();
  };

  const baseShareResult = shareResult;
  shareResult = async function() {
    try {
      const text = `Team ${pad(state.teamNo)} completed ${state.programName || state.programId || 'Montenegro Treasure Hunt'} with ${state.score} points.`;
      if (navigator.share) return await navigator.share({title: state.programName || 'Montenegro Treasure Hunt', text});
      await navigator.clipboard.writeText(text);
      toast('Result copied.');
    } catch (e) {
      if (e?.name !== 'AbortError') return baseShareResult();
    }
  };

  entry();
})();
