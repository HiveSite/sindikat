(() => {
  const LEAFLET_VERSION = '1.9.4';
  const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
  const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
  const DEFAULT_CENTER = [42.4413, 19.2636];
  const REFRESH_MS = 8000;
  const instances = new Map();
  let leafletPromise = null;

  function loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (leafletPromise) return leafletPromise;

    leafletPromise = new Promise((resolve, reject) => {
      if (!document.querySelector('link[data-mth-leaflet]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = LEAFLET_CSS;
        link.crossOrigin = '';
        link.dataset.mthLeaflet = '1';
        document.head.appendChild(link);
      }

      const existing = document.querySelector('script[data-mth-leaflet]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.L), { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = LEAFLET_JS;
      script.crossOrigin = '';
      script.dataset.mthLeaflet = '1';
      script.onload = () => resolve(window.L);
      script.onerror = () => reject(new Error('Leaflet mapa nije mogla da se učita.'));
      document.head.appendChild(script);
    });

    return leafletPromise;
  }

  function injectStyles() {
    if (document.querySelector('#mth-real-map-styles')) return;
    const style = document.createElement('style');
    style.id = 'mth-real-map-styles';
    style.textContent = `
      .ops-map.real-osm-map{position:relative;min-height:560px;height:min(68vh,720px);overflow:hidden;border-radius:22px;background:#0b1c22}
      .ops-map.real-osm-map .leaflet-control-container{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .ops-map.real-osm-map .leaflet-control-attribution{font-size:10px;background:rgba(255,255,255,.9)}
      .mth-team-pin{background:transparent;border:0}
      .mth-team-pin span{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:#0b1c22;color:#fff;border:3px solid #fff;box-shadow:0 8px 24px rgba(0,0,0,.35);font-size:12px;font-weight:900;letter-spacing:.02em}
      .mth-team-pin.live span{background:#0e7a5f}
      .mth-team-pin.paused span{background:#b87a14}
      .mth-team-pin.completed span{background:#6d54b5}
      .mth-team-pin.stale span{background:#6c7478}
      .mth-team-pin.warning span{background:#b44d3d}
      .mth-checkpoint-pin{background:transparent;border:0}
      .mth-checkpoint-pin span{display:grid;place-items:center;width:27px;height:27px;border-radius:50%;background:#fff;color:#14262b;border:2px solid #14262b;box-shadow:0 4px 14px rgba(0,0,0,.2);font-size:11px;font-weight:900}
      .mth-final-pin{background:transparent;border:0}
      .mth-final-pin span{display:grid;place-items:center;width:34px;height:34px;transform:rotate(45deg);border-radius:8px;background:#d8b56a;color:#07171d;border:2px solid #fff;box-shadow:0 6px 18px rgba(0,0,0,.3)}
      .mth-final-pin span b{transform:rotate(-45deg);font-size:15px}
      .mth-map-popup{min-width:220px;color:#132227}
      .mth-map-popup h4{margin:0 0 4px;font-size:16px}
      .mth-map-popup .statusline{display:flex;gap:6px;align-items:center;margin:0 0 10px;font-size:12px;font-weight:800}
      .mth-map-popup .statusline i{width:8px;height:8px;border-radius:50%;background:#0e7a5f}
      .mth-map-popup dl{display:grid;grid-template-columns:auto 1fr;gap:5px 10px;margin:0;font-size:12px}
      .mth-map-popup dt{color:#64777c}
      .mth-map-popup dd{margin:0;font-weight:800;text-align:right}
      .mth-map-popup .coords{margin-top:10px;padding-top:8px;border-top:1px solid #dde5e7;color:#66787d;font-size:10px}
      .mth-map-empty{position:absolute;z-index:700;left:50%;top:18px;transform:translateX(-50%);padding:9px 13px;border-radius:999px;background:rgba(7,23,29,.9);color:#dbe8ea;font-size:12px;font-weight:800;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.25)}
      .mth-map-live-badge{background:rgba(7,23,29,.92);color:#fff;border:1px solid rgba(255,255,255,.16);border-radius:12px;padding:8px 10px;box-shadow:0 6px 18px rgba(0,0,0,.22);font:800 11px/1.2 Inter,ui-sans-serif,system-ui;letter-spacing:.04em}
      .mth-map-live-badge b{color:#72e0bb}
      @media(max-width:800px){.ops-map.real-osm-map{min-height:470px;height:62vh;border-radius:16px}}
    `;
    document.head.appendChild(style);
  }

  const pad = n => String(n).padStart(2, '0');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  function ago(value) {
    if (!value) return 'nikad';
    const ms = Date.now() - Date.parse(value);
    if (!Number.isFinite(ms)) return 'nepoznato';
    const s = Math.max(0, Math.floor(ms / 1000));
    if (s < 10) return 'sad';
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    return `${Math.floor(s / 3600)}h`;
  }

  function teamVisual(team) {
    const age = team.updatedAt ? Date.now() - Date.parse(team.updatedAt) : Infinity;
    if (team.status === 'completed') return ['completed', 'Završio'];
    if (team.status === 'paused') return ['paused', 'Pauziran'];
    if (team.gpsError) return ['warning', 'GPS problem'];
    if (age > 90000) return ['stale', 'Bez signala'];
    return ['live', 'U igri'];
  }

  async function getJson(url) {
    const response = await fetch(url, { method: 'GET', cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Mapa nije mogla da učita podatke.');
    return data;
  }

  function teamPopup(team) {
    const [, label] = teamVisual(team);
    const p = team.lastPosition;
    const target = team.expectedCheckpoint?.name || team.currentCheckpointName || team.phase || '—';
    return `<div class="mth-map-popup">
      <h4>Team ${pad(team.teamNo)}</h4>
      <div class="statusline"><i></i>${esc(label)} · ${esc(ago(team.updatedAt))}</div>
      <dl>
        <dt>Meta</dt><dd>${esc(target)}</dd>
        <dt>Udaljenost</dt><dd>${team.distanceToTarget != null ? `${Math.round(team.distanceToTarget)} m` : '—'}</dd>
        <dt>GPS tačnost</dt><dd>${p?.accuracy != null ? `±${Math.round(p.accuracy)} m` : '—'}</dd>
        <dt>Story</dt><dd>${Number(team.collectedCount || 0)}/10</dd>
        <dt>Score</dt><dd>${Number(team.score || 0)}</dd>
        <dt>Last seen</dt><dd>${esc(ago(team.updatedAt))}</dd>
      </dl>
      ${p ? `<div class="coords">${Number(p.lat).toFixed(6)}, ${Number(p.lng).toFixed(6)}</div>` : ''}
    </div>`;
  }

  function checkpointPopup(cp, index) {
    return `<div class="mth-map-popup"><h4>${index + 1}. ${esc(cp.name)}</h4><div>${esc(cp.area || '')}</div><div class="coords">GPS radius ${Number(cp.radius || 0)} m</div></div>`;
  }

  async function renderData(instance) {
    if (!instance.el.isConnected || instance.loading) return;
    instance.loading = true;
    try {
      const [overview, contentResponse] = await Promise.all([
        getJson('/hunt/team-api/admin/overview'),
        getJson('/hunt/team-api/admin/content')
      ]);

      if (!instance.el.isConnected) return;
      instance.layers.clearLayers();

      const L = window.L;
      const bounds = [];
      const checkpoints = contentResponse.content?.checkpoints || [];
      const final = contentResponse.content?.final;

      checkpoints.forEach((cp, index) => {
        if (!Number.isFinite(Number(cp.lat)) || !Number.isFinite(Number(cp.lng))) return;
        const pos = [Number(cp.lat), Number(cp.lng)];
        bounds.push(pos);
        L.marker(pos, {
          pane: 'checkpointPane',
          icon: L.divIcon({
            className: 'mth-checkpoint-pin',
            html: `<span>${index + 1}</span>`,
            iconSize: [27, 27],
            iconAnchor: [13, 13]
          })
        }).bindPopup(checkpointPopup(cp, index)).addTo(instance.layers);
      });

      if (final && Number.isFinite(Number(final.lat)) && Number.isFinite(Number(final.lng))) {
        const pos = [Number(final.lat), Number(final.lng)];
        bounds.push(pos);
        L.marker(pos, {
          pane: 'checkpointPane',
          icon: L.divIcon({
            className: 'mth-final-pin',
            html: '<span><b>◇</b></span>',
            iconSize: [34, 34],
            iconAnchor: [17, 17]
          })
        }).bindPopup(`<div class="mth-map-popup"><h4>Finale · ${esc(final.name || 'Sastavci')}</h4><div class="coords">Završna lokacija</div></div>`).addTo(instance.layers);
      }

      let teamsWithGps = 0;
      (overview.teams || []).forEach(team => {
        const p = team.lastPosition;
        if (!p || !Number.isFinite(Number(p.lat)) || !Number.isFinite(Number(p.lng))) return;
        teamsWithGps += 1;
        const pos = [Number(p.lat), Number(p.lng)];
        bounds.push(pos);
        const [cls] = teamVisual(team);
        L.marker(pos, {
          pane: 'teamPane',
          zIndexOffset: 1000,
          icon: L.divIcon({
            className: `mth-team-pin ${cls}`,
            html: `<span>${pad(team.teamNo)}</span>`,
            iconSize: [38, 38],
            iconAnchor: [19, 19]
          })
        }).bindPopup(teamPopup(team), { maxWidth: 310 }).addTo(instance.layers);

        if (Number(p.accuracy) > 0 && Number(p.accuracy) <= 500) {
          L.circle(pos, {
            pane: 'accuracyPane',
            radius: Number(p.accuracy),
            weight: 1,
            opacity: .35,
            fillOpacity: .06
          }).addTo(instance.layers);
        }
      });

      if (instance.emptyBadge) instance.emptyBadge.remove();
      instance.emptyBadge = null;
      if (!teamsWithGps) {
        const badge = document.createElement('div');
        badge.className = 'mth-map-empty';
        badge.textContent = 'Još nema GPS signala sa timskih telefona.';
        instance.el.appendChild(badge);
        instance.emptyBadge = badge;
      }

      if (!instance.hasFit && bounds.length) {
        instance.map.fitBounds(bounds, { padding: [38, 38], maxZoom: 15 });
        instance.hasFit = true;
      }

      if (instance.liveBadge) {
        instance.liveBadge.innerHTML = `<b>${teamsWithGps}/10 GPS</b> · refresh 8s`;
      }
    } catch (error) {
      console.error('MTH real map', error);
      if (!instance.emptyBadge) {
        const badge = document.createElement('div');
        badge.className = 'mth-map-empty';
        badge.textContent = error?.message || 'Mapa trenutno nije dostupna.';
        instance.el.appendChild(badge);
        instance.emptyBadge = badge;
      }
    } finally {
      instance.loading = false;
    }
  }

  async function initMap(el) {
    if (!el || el.dataset.realMap === '1') return;
    el.dataset.realMap = '1';
    injectStyles();

    try {
      const L = await loadLeaflet();
      if (!el.isConnected) return;
      el.innerHTML = '';
      el.classList.add('real-osm-map');

      const map = L.map(el, {
        zoomControl: true,
        attributionControl: true,
        preferCanvas: true
      }).setView(DEFAULT_CENTER, 14);

      map.createPane('accuracyPane');
      map.getPane('accuracyPane').style.zIndex = '390';
      map.createPane('checkpointPane');
      map.getPane('checkpointPane').style.zIndex = '410';
      map.createPane('teamPane');
      map.getPane('teamPane').style.zIndex = '430';

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'
      }).addTo(map);

      const layers = L.layerGroup().addTo(map);
      const LiveControl = L.Control.extend({
        onAdd() {
          const div = L.DomUtil.create('div', 'mth-map-live-badge');
          div.innerHTML = '<b>0/10 GPS</b> · refresh 8s';
          return div;
        }
      });
      const control = new LiveControl({ position: 'topright' });
      control.addTo(map);
      const liveBadge = control.getContainer();

      const instance = {
        el,
        map,
        layers,
        liveBadge,
        emptyBadge: null,
        loading: false,
        hasFit: false,
        timer: null
      };
      instances.set(el, instance);

      await renderData(instance);
      instance.timer = setInterval(() => renderData(instance), REFRESH_MS);
      requestAnimationFrame(() => map.invalidateSize());
    } catch (error) {
      console.error('MTH map init', error);
      el.innerHTML = `<div class="mth-map-empty">${esc(error?.message || 'Mapa nije mogla da se učita.')}</div>`;
    }
  }

  function disposeMap(el) {
    const instance = instances.get(el);
    if (!instance) return;
    clearInterval(instance.timer);
    try { instance.map.remove(); } catch {}
    instances.delete(el);
  }

  function scan() {
    document.querySelectorAll('.ops-map').forEach(initMap);
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.removedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        if (node.matches?.('.ops-map')) disposeMap(node);
        node.querySelectorAll?.('.ops-map').forEach(disposeMap);
      });
    }
    scan();
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', scan);
  scan();
})();
