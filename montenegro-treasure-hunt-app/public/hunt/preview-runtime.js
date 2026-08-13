(() => {
  if (!reviewMode || !qs.get('program') || window.__MTH_FULL_PREVIEW__) return;
  window.__MTH_FULL_PREVIEW__ = true;

  const programId = String(qs.get('program') || '').trim().toUpperCase();
  const requestedTeam = Math.max(1, Number(qs.get('team') || 1));
  let previewProgram = null;
  let syncTimer = null;

  const originalEventApi = eventApi;
  const originalStartGps = typeof startGps === 'function' ? startGps : null;

  function closeTransientUi() {
    try { if (typeof closeSheet === 'function') closeSheet(); } catch {}
    document.querySelector('#controlOverlay')?.remove();
  }

  function previewEventApi(path, options = {}) {
    if (['/progress', '/presence'].includes(path) || path.startsWith('/control')) {
      return Promise.resolve({ ok: true, preview: true, config: eventConfig });
    }
    if (path === '/board') {
      return originalEventApi(`/board?program=${encodeURIComponent(programId)}`, options);
    }
    if (path === '/content') {
      return originalEventApi(`/content?program=${encodeURIComponent(programId)}`, options);
    }
    return originalEventApi(path, options);
  }

  eventApi = previewEventApi;
  startControlPolling = function() {};
  syncPresence = function() {};
  startGps = function() {
    state.gpsError = '';
    state.position = null;
  };
  save = function(logAction = '') {
    if (logAction) state.lastAction = logAction;
    syncToolbar();
  };
  restore = function() { return false; };

  function steps() {
    const list = [
      { key: 'access', label: '00 · Access screen' },
      { key: 'briefing', label: '01 · Briefing' }
    ];
    checkpoints.forEach((cp, i) => list.push({
      key: `stop:${i}`,
      label: `${String(i + 2).padStart(2, '0')} · Stop ${i + 1} · ${cp.name || cp.chapter || 'Field stop'}`
    }));
    list.push(
      { key: 'finalPuzzle', label: `${String(checkpoints.length + 2).padStart(2, '0')} · Final deduction` },
      { key: 'finalSearch', label: `${String(checkpoints.length + 3).padStart(2, '0')} · Final location` },
      { key: 'complete', label: `${String(checkpoints.length + 4).padStart(2, '0')} · Ending` }
    );
    return list;
  }

  function currentKey() {
    if (state.phase === 'entry') return 'access';
    if (state.phase === 'briefing') return 'briefing';
    if (state.phase === 'hunt') return `stop:${Math.max(0, Math.min(checkpoints.length - 1, Number(state.index || 0)))}`;
    if (state.phase === 'finalPuzzle') return 'finalPuzzle';
    if (state.phase === 'finalSearch') return 'finalSearch';
    if (state.phase === 'complete') return 'complete';
    return 'briefing';
  }

  function resetProgress() {
    Object.assign(state, {
      phase: 'entry',
      index: 0,
      score: 0,
      collected: [],
      hints: {},
      attempts: {},
      position: null,
      gpsError: '',
      finalSolved: false,
      wrongAnswers: 0,
      controlRevision: 0,
      gpsOverride: null,
      lastAction: 'Preview ready',
      coordinatorNote: '',
      teamPaused: false
    });
  }

  function renderAccess() {
    closeTransientUi();
    state.phase = 'entry';
    entry();
    requestAnimationFrame(() => {
      const input = document.querySelector('#teamCode');
      const button = document.querySelector('#enter');
      const note = document.querySelector('.reviewnote');
      if (input) {
        input.value = `${programId} · PREVIEW`;
        input.disabled = true;
        input.setAttribute('aria-label', 'Preview mode - access code bypassed');
      }
      if (button) button.textContent = 'Enter full preview';
      if (note) note.textContent = 'FULL PREVIEW · code, GPS and live team writes are bypassed.';
    });
  }

  join = async function() {
    state.phase = 'briefing';
    state.lastAction = 'Started full preview';
    briefing();
    syncToolbar();
  };

  function jump(key) {
    closeTransientUi();
    const total = checkpoints.length;
    if (key === 'access') return renderAccess();
    if (key === 'briefing') {
      resetProgress();
      state.phase = 'briefing';
      return briefing();
    }
    if (key.startsWith('stop:')) {
      const index = Math.max(0, Math.min(total - 1, Number(key.split(':')[1]) || 0));
      state.index = index;
      state.collected = route().slice(0, index).map(cp => cp.id);
      state.phase = 'hunt';
      state.finalSolved = false;
      return render();
    }
    state.index = total;
    state.collected = route().map(cp => cp.id);
    if (key === 'finalPuzzle') {
      state.phase = 'finalPuzzle';
      state.finalSolved = false;
      return render();
    }
    if (key === 'finalSearch') {
      state.phase = 'finalSearch';
      state.finalSolved = true;
      return render();
    }
    if (key === 'complete') {
      state.phase = 'complete';
      state.finalSolved = true;
      return render();
    }
  }

  function move(delta) {
    const list = steps();
    const index = Math.max(0, list.findIndex(x => x.key === currentKey()));
    const next = list[Math.max(0, Math.min(list.length - 1, index + delta))];
    if (next) jump(next.key);
  }

  function addStyles() {
    if (document.querySelector('#mth-full-preview-style')) return;
    const style = document.createElement('style');
    style.id = 'mth-full-preview-style';
    style.textContent = `
      body.mth-full-preview{padding-top:58px!important}
      body.mth-full-preview .topbar{top:58px!important}
      .mth-previewbar{position:fixed;z-index:12000;left:0;right:0;top:0;height:58px;display:flex;align-items:center;gap:8px;padding:8px 12px;box-sizing:border-box;background:rgba(5,20,25,.97);border-bottom:1px solid rgba(255,255,255,.12);color:#eef7f7;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.28)}
      .mth-previewbrand{display:flex;align-items:center;gap:9px;min-width:190px}.mth-previewbrand i{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#d8b56a;color:#07171d;font-style:normal;font-weight:1000}.mth-previewbrand small{display:block;color:#78949a;font-size:9px;font-weight:900;letter-spacing:.12em}.mth-previewbrand b{display:block;max-width:210px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}
      .mth-previewbar select,.mth-previewbar button,.mth-previewbar a{height:36px;box-sizing:border-box;border:1px solid rgba(255,255,255,.13);border-radius:10px;background:#0d2b32;color:#eef7f7;padding:0 10px;font:800 11px/1 Inter,ui-sans-serif,system-ui;text-decoration:none;cursor:pointer}.mth-previewbar select{max-width:330px}.mth-previewbar button:hover,.mth-previewbar a:hover{border-color:#d8b56a}.mth-previewbar .primary{background:#d8b56a;color:#07171d;border-color:#d8b56a}.mth-previewmeta{margin-left:auto;display:flex;align-items:center;gap:8px;color:#89a2a8;font-size:10px;font-weight:800}.mth-previewmeta b{color:#72e0bb}.mth-previewbar .mobile-label{display:none}
      @media(max-width:820px){body.mth-full-preview{padding-top:104px!important}body.mth-full-preview .topbar{top:104px!important}.mth-previewbar{height:104px;flex-wrap:wrap;align-content:center}.mth-previewbrand{min-width:calc(100% - 92px);flex:1}.mth-previewbrand b{max-width:55vw}.mth-previewmeta{display:none}.mth-previewbar select{order:5;flex:1;max-width:none}.mth-previewbar [data-preview-team]{order:6;width:86px}.mth-previewbar [data-preview-prev],.mth-previewbar [data-preview-next]{width:42px;padding:0}.mth-previewbar [data-preview-reset]{display:none}.mth-previewbar .mobile-label{display:inline}}
    `;
    document.head.appendChild(style);
  }

  function renderToolbar() {
    addStyles();
    document.body.classList.add('mth-full-preview');
    document.querySelector('#mthPreviewBar')?.remove();
    const stageOptions = steps().map(x => `<option value="${esc(x.key)}">${esc(x.label)}</option>`).join('');
    const teamOptions = Array.from({ length: Math.max(1, Number(state.programTeamCount || previewProgram?.teamCount || 1)) }, (_, i) => `<option value="${i + 1}">Team ${pad(i + 1)}</option>`).join('');
    document.body.insertAdjacentHTML('beforeend', `
      <div class="mth-previewbar" id="mthPreviewBar">
        <div class="mth-previewbrand"><i>◇</i><div><small>FULL GAME PREVIEW</small><b>${esc(state.programName || programId)} · ${esc(state.programLocation || '')}</b></div></div>
        <button data-preview-prev title="Previous stage">←<span class="mobile-label"> Prev</span></button>
        <button data-preview-next class="primary" title="Next stage"><span class="mobile-label">Next </span>→</button>
        <select data-preview-stage aria-label="Preview stage">${stageOptions}</select>
        <select data-preview-team aria-label="Preview team">${teamOptions}</select>
        <button data-preview-reset>Reset</button>
        <a href="/hunt/admin" title="Return to admin">Exit</a>
        <div class="mth-previewmeta"><span>GPS <b>BYPASS</b></span><span>LIVE WRITES <b>OFF</b></span></div>
      </div>`);

    const bar = document.querySelector('#mthPreviewBar');
    bar.querySelector('[data-preview-prev]').onclick = () => move(-1);
    bar.querySelector('[data-preview-next]').onclick = () => move(1);
    bar.querySelector('[data-preview-stage]').onchange = e => jump(e.target.value);
    bar.querySelector('[data-preview-team]').onchange = e => {
      const key = currentKey();
      state.teamNo = Math.max(1, Number(e.target.value || 1));
      state.lastAction = `Previewing Team ${pad(state.teamNo)}`;
      jump(key);
    };
    bar.querySelector('[data-preview-reset]').onclick = () => {
      state.teamNo = 1;
      resetProgress();
      renderAccess();
      syncToolbar();
    };
    syncToolbar();
  }

  function syncToolbar() {
    const bar = document.querySelector('#mthPreviewBar');
    if (!bar) return;
    const stage = bar.querySelector('[data-preview-stage]');
    const team = bar.querySelector('[data-preview-team]');
    if (stage && stage.value !== currentKey()) stage.value = currentKey();
    if (team && team.value !== String(state.teamNo || 1)) team.value = String(state.teamNo || 1);
  }

  async function bootPreview() {
    app.innerHTML = `<main class="app"><section class="screen"><div class="wrap" style="min-height:80vh;display:grid;place-items:center"><div class="paper" style="max-width:520px"><div class="paper-label">FULL GAME PREVIEW</div><h2>Loading ${esc(programId)}…</h2><p>Preparing route, story, final deduction and review controls.</p></div></div></section></main>`;
    try {
      const response = await fetch(`/hunt/team-api/content?program=${encodeURIComponent(programId)}`, { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.content || !data.program) throw new Error(data.error || 'Program preview could not be loaded.');

      previewProgram = data.program;
      state.programId = data.program.id || programId;
      state.programName = data.program.name || state.programId;
      state.programLocation = data.program.location || '';
      state.programTeamCount = Number(data.program.teamCount || 1);
      state.teamNo = Math.min(requestedTeam, state.programTeamCount);
      state.code = '';
      window.MTH_PROGRAM = data.program;
      document.title = `${state.programName} · Full Preview | MTH`;
      applyContent(data.content);
      applyConfig({ ...(data.config || {}), active: true, paused: false, gpsRequired: false, emergencyMessage: '', announcement: '' });
      resetProgress();
      state.teamNo = Math.min(requestedTeam, state.programTeamCount);
      renderToolbar();
      renderAccess();
      clearInterval(syncTimer);
      syncTimer = setInterval(syncToolbar, 400);
    } catch (error) {
      app.innerHTML = `<main class="app"><section class="screen"><div class="wrap" style="min-height:80vh;display:grid;place-items:center"><div class="paper" style="max-width:560px"><div class="paper-label">PREVIEW ERROR</div><h2>Program se nije učitao.</h2><p>${esc(error.message || 'Unknown preview error')}</p><p><a href="/hunt/admin">Return to admin</a></p></div></div></section></main>`;
    }
  }

  window.addEventListener('beforeunload', () => {
    clearInterval(syncTimer);
    if (originalStartGps && state.watchId != null && navigator.geolocation) {
      try { navigator.geolocation.clearWatch(state.watchId); } catch {}
    }
  });

  bootPreview();
})();
