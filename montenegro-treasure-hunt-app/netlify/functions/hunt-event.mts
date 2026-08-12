import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { DEFAULT_CONFIG, DEFAULT_CONTENT } from './_hunt-event/defaults.mjs';

const EVENT_ID = 'PG26';
const TEAM_COUNT = 10;
const EVENT_STORE = 'podgorica-hunt-event-2026';
const AUTH_STORE = 'montenegro-treasure-hunt';
const nowIso = () => new Date().toISOString();
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const clean = (v, max = 500) => String(v ?? '').trim().slice(0, max);
const pad = n => String(n).padStart(2, '0');
const teamKey = n => `event/${EVENT_ID}/team/${pad(n)}`;
const logPrefix = n => `event/${EVENT_ID}/log/team-${pad(n)}/`;
const configKey = `event/${EVENT_ID}/config`;
const contentKey = `event/${EVENT_ID}/content`;

function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    }
  });
}

function teamFromCode(value) {
  const code = String(value || '').trim().toUpperCase();
  const m = code.match(/^PG26-(0[1-9]|10)$/);
  return m ? { code, teamNo: Number(m[1]) } : null;
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(x => x.trim()).filter(Boolean).map(x => {
    const i = x.indexOf('=');
    return i < 0 ? ['', ''] : [decodeURIComponent(x.slice(0, i)), decodeURIComponent(x.slice(i + 1))];
  }).filter(([k]) => k));
}

function adminPepper() {
  return process.env.MTH_TOKEN_SECRET || process.env.MTH_TOKEN_PEPPER || '';
}

async function requireAdmin(request) {
  const raw = parseCookies(request.headers.get('cookie') || '').mth_admin;
  const pepper = adminPepper();
  if (!raw || !pepper) return null;
  const hash = crypto.createHash('sha256').update(`${pepper}:${raw}`).digest('hex');
  const auth = getStore(AUTH_STORE, { consistency: 'strong' });
  const session = await auth.get(`admin-session/${hash}`, { type: 'json' });
  if (!session || !session.expiresAt || session.expiresAt <= nowIso()) return null;
  return { email: process.env.MTH_ADMIN_EMAIL || session.email || 'admin', role: 'admin' };
}

function eventStore() {
  return getStore(EVENT_STORE, { consistency: 'strong' });
}

function defaultTeam(n) {
  return {
    teamNo: n,
    status: 'not_started',
    progress: 0,
    score: 0,
    phase: 'entry',
    currentIndex: 0,
    collectedCount: 0,
    hintsCount: 0,
    wrongAnswers: 0,
    currentCheckpointId: null,
    currentCheckpointName: null,
    currentArea: null,
    distanceToTarget: null,
    lastPosition: null,
    gpsError: '',
    joinedAt: null,
    completedAt: null,
    updatedAt: null,
    lastAction: 'Not started',
    control: { revision: 0, action: null, payload: null, issuedAt: null },
    note: ''
  };
}

async function readTeam(store, n) {
  return { ...defaultTeam(n), ...(await store.get(teamKey(n), { type: 'json' }) || {}) };
}

async function writeTeam(store, team) {
  const next = { ...team, updatedAt: nowIso() };
  await store.setJSON(teamKey(next.teamNo), next);
  return next;
}

async function getConfig(store) {
  return { ...DEFAULT_CONFIG, ...(await store.get(configKey, { type: 'json' }) || {}) };
}

async function getContent(store) {
  const saved = await store.get(contentKey, { type: 'json' });
  return saved ? { ...DEFAULT_CONTENT, ...saved } : structuredClone(DEFAULT_CONTENT);
}

async function addLog(store, teamNo, type, message, payload = {}) {
  const at = nowIso();
  const key = `${logPrefix(teamNo)}${at}-${crypto.randomUUID()}`;
  await store.setJSON(key, { teamNo, type, message, payload, at });
}

async function listLogs(store, teamNo, limit = 80) {
  const { blobs = [] } = await store.list({ prefix: logPrefix(teamNo) });
  const keys = blobs.map(x => x.key).sort().reverse().slice(0, limit);
  const rows = await Promise.all(keys.map(k => store.get(k, { type: 'json' })));
  return rows.filter(Boolean);
}

async function board(store) {
  const teams = [];
  for (let n = 1; n <= TEAM_COUNT; n++) teams.push(await readTeam(store, n));
  return teams.sort((a, b) => b.progress - a.progress || b.score - a.score || a.teamNo - b.teamNo);
}

function publicTeam(t) {
  return { teamNo: t.teamNo, progress: t.progress, score: t.score, status: t.status };
}

function sanitizePosition(p) {
  if (!p) return null;
  const lat = Number(p.lat), lng = Number(p.lng), accuracy = Number(p.accuracy);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) return null;
  return { lat, lng, accuracy: Number.isFinite(accuracy) && accuracy > 0 ? accuracy : null, at: clean(p.at, 60) || nowIso() };
}

function telemetryFromBody(body) {
  return {
    progress: clamp(Number(body.progress) || 0, 0, 100),
    score: clamp(Math.round(Number(body.score) || 0), 0, 999999),
    phase: clean(body.phase, 40) || 'hunt',
    currentIndex: clamp(Math.floor(Number(body.currentIndex) || 0), 0, 10),
    collectedCount: clamp(Math.floor(Number(body.collectedCount) || 0), 0, 10),
    hintsCount: clamp(Math.floor(Number(body.hintsCount) || 0), 0, 99),
    wrongAnswers: clamp(Math.floor(Number(body.wrongAnswers) || 0), 0, 999),
    currentCheckpointId: clean(body.currentCheckpointId, 80) || null,
    currentCheckpointName: clean(body.currentCheckpointName, 120) || null,
    currentArea: clean(body.currentArea, 100) || null,
    distanceToTarget: Number.isFinite(Number(body.distanceToTarget)) ? clamp(Math.round(Number(body.distanceToTarget)), 0, 100000) : null,
    lastPosition: sanitizePosition(body.lastPosition),
    gpsError: clean(body.gpsError, 180),
    lastAction: clean(body.lastAction, 180) || 'Playing'
  };
}

async function issueControl(store, team, action, payload = {}) {
  const revision = Number(team.control?.revision || 0) + 1;
  team.control = { revision, action, payload, issuedAt: nowIso() };
  await writeTeam(store, team);
  await addLog(store, team.teamNo, 'admin.control', `Admin: ${action}`, payload);
  return team;
}

function routeCheckpoint(content, teamNo, index) {
  const cps = content.checkpoints || [];
  if (!cps.length || index >= cps.length) return null;
  return cps[(index + teamNo - 1) % cps.length];
}

function deriveStats(teams) {
  const now = Date.now();
  const online = teams.filter(t => t.updatedAt && now - Date.parse(t.updatedAt) < 45_000).length;
  const active = teams.filter(t => t.status === 'active').length;
  const completed = teams.filter(t => t.status === 'completed').length;
  const notStarted = teams.filter(t => t.status === 'not_started').length;
  const needsAttention = teams.filter(t => t.gpsError || (t.updatedAt && t.status === 'active' && now - Date.parse(t.updatedAt) > 90_000)).length;
  return { online, active, completed, notStarted, needsAttention, avgProgress: Math.round(teams.reduce((s, t) => s + Number(t.progress || 0), 0) / teams.length) };
}

export default async function handler(request) {
  const store = eventStore();
  try {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/\.netlify\/functions\/hunt-event/, '').replace(/^\/hunt\/team-api/, '') || '/';
    let body = {};
    if (!['GET', 'HEAD'].includes(request.method)) {
      const raw = await request.text();
      if (raw) try { body = JSON.parse(raw); } catch { return json(400, { error: 'Invalid JSON.' }); }
    }

    if (path === '/health') return json(200, { ok: true, event: EVENT_ID, teams: TEAM_COUNT, adminControls: true });

    if (path === '/content' && request.method === 'GET') {
      const config = await getConfig(store);
      return json(200, { ok: true, config, content: await getContent(store) });
    }

    if (path === '/join' && request.method === 'POST') {
      const teamRef = teamFromCode(body.code);
      if (!teamRef) return json(400, { error: 'Invalid team code.' });
      const config = await getConfig(store);
      if (!config.active) return json(423, { error: 'The event is not open yet.' });
      const current = await readTeam(store, teamRef.teamNo);
      const wasNew = current.status === 'not_started';
      const next = await writeTeam(store, {
        ...current,
        teamNo: teamRef.teamNo,
        status: current.status === 'completed' ? 'completed' : 'active',
        joinedAt: current.joinedAt || nowIso(),
        lastAction: wasNew ? 'Joined event' : 'Rejoined event'
      });
      if (wasNew) await addLog(store, teamRef.teamNo, 'team.joined', 'Team joined the event.');
      return json(200, { ok: true, event: EVENT_ID, team: next, startOffset: teamRef.teamNo - 1, config, content: await getContent(store) });
    }

    if (path === '/progress' && request.method === 'POST') {
      const teamRef = teamFromCode(body.code);
      if (!teamRef) return json(400, { error: 'Invalid team code.' });
      const current = await readTeam(store, teamRef.teamNo);
      const telemetry = telemetryFromBody(body);
      const completed = telemetry.progress >= 100 || telemetry.phase === 'complete';
      const next = await writeTeam(store, {
        ...current,
        ...telemetry,
        status: completed ? 'completed' : (current.status === 'paused' ? 'paused' : 'active'),
        completedAt: completed ? (current.completedAt || nowIso()) : null
      });
      if (body.logAction && clean(body.logAction, 180) !== current.lastLoggedAction) {
        next.lastLoggedAction = clean(body.logAction, 180);
        await writeTeam(store, next);
        await addLog(store, teamRef.teamNo, 'team.action', next.lastLoggedAction, { currentIndex: next.currentIndex, score: next.score });
      }
      return json(200, { ok: true, team: next, control: next.control, config: await getConfig(store) });
    }

    if (path === '/presence' && request.method === 'POST') {
      const teamRef = teamFromCode(body.code);
      if (!teamRef) return json(400, { error: 'Invalid team code.' });
      const current = await readTeam(store, teamRef.teamNo);
      const next = await writeTeam(store, {
        ...current,
        lastPosition: sanitizePosition(body.lastPosition) || current.lastPosition,
        distanceToTarget: Number.isFinite(Number(body.distanceToTarget)) ? clamp(Math.round(Number(body.distanceToTarget)), 0, 100000) : current.distanceToTarget,
        gpsError: clean(body.gpsError, 180),
        lastAction: clean(body.lastAction, 180) || current.lastAction,
        currentCheckpointId: clean(body.currentCheckpointId, 80) || current.currentCheckpointId,
        currentCheckpointName: clean(body.currentCheckpointName, 120) || current.currentCheckpointName,
        currentArea: clean(body.currentArea, 100) || current.currentArea
      });
      return json(200, { ok: true, control: next.control, config: await getConfig(store) });
    }

    if (path === '/control' && request.method === 'GET') {
      const teamRef = teamFromCode(url.searchParams.get('code'));
      if (!teamRef) return json(400, { error: 'Invalid team code.' });
      const team = await readTeam(store, teamRef.teamNo);
      return json(200, { ok: true, control: team.control, status: team.status, note: team.note || '', config: await getConfig(store), contentVersion: (await getContent(store)).version });
    }

    if (path === '/board' && request.method === 'GET') {
      const config = await getConfig(store);
      if (!config.leaderboard) return json(200, { ok: true, event: EVENT_ID, hidden: true, teams: [] });
      return json(200, { ok: true, event: EVENT_ID, teams: (await board(store)).map(publicTeam) });
    }

    if (path.startsWith('/admin/')) {
      const admin = await requireAdmin(request);
      if (!admin) return json(401, { error: 'Admin session is required.' });
      const content = await getContent(store);

      if (path === '/admin/overview' && request.method === 'GET') {
        const teams = [];
        for (let n = 1; n <= TEAM_COUNT; n++) {
          const t = await readTeam(store, n);
          const cp = routeCheckpoint(content, n, t.currentIndex);
          teams.push({ ...t, expectedCheckpoint: cp ? { id: cp.id, name: cp.name, area: cp.area, lat: cp.lat, lng: cp.lng, radius: cp.radius } : null });
        }
        return json(200, { ok: true, admin, config: await getConfig(store), contentVersion: content.version, stats: deriveStats(teams), teams });
      }

      if (path === '/admin/config' && request.method === 'GET') return json(200, { ok: true, config: await getConfig(store) });
      if (path === '/admin/config' && request.method === 'PUT') {
        const current = await getConfig(store);
        const next = {
          ...current,
          name: clean(body.name, 120) || current.name,
          active: Boolean(body.active),
          paused: Boolean(body.paused),
          leaderboard: Boolean(body.leaderboard),
          allowHints: Boolean(body.allowHints),
          gpsRequired: Boolean(body.gpsRequired),
          announcement: clean(body.announcement, 500),
          emergencyMessage: clean(body.emergencyMessage, 500),
          updatedAt: nowIso()
        };
        await store.setJSON(configKey, next);
        return json(200, { ok: true, config: next });
      }

      if (path === '/admin/content' && request.method === 'GET') return json(200, { ok: true, content });
      if (path === '/admin/content' && request.method === 'PUT') {
        const next = body.content;
        if (!next || !Array.isArray(next.checkpoints) || next.checkpoints.length !== 10 || !Array.isArray(next.storyBeats) || next.storyBeats.length !== 10 || !next.final) {
          return json(400, { error: 'Content must contain 10 checkpoints, 10 story beats and a final location.' });
        }
        next.version = clean(next.version, 40) || `admin-${Date.now()}`;
        next.updatedAt = nowIso();
        await store.setJSON(contentKey, next);
        return json(200, { ok: true, content: next });
      }
      if (path === '/admin/content/reset' && request.method === 'POST') {
        await store.delete(contentKey);
        return json(200, { ok: true, content: structuredClone(DEFAULT_CONTENT) });
      }

      const detail = path.match(/^\/admin\/teams\/(\d{1,2})$/);
      if (detail && request.method === 'GET') {
        const n = Number(detail[1]);
        if (n < 1 || n > TEAM_COUNT) return json(404, { error: 'Team not found.' });
        const team = await readTeam(store, n);
        const cp = routeCheckpoint(content, n, team.currentIndex);
        return json(200, { ok: true, team: { ...team, expectedCheckpoint: cp }, logs: await listLogs(store, n) });
      }

      const controlMatch = path.match(/^\/admin\/teams\/(\d{1,2})\/control$/);
      if (controlMatch && request.method === 'POST') {
        const n = Number(controlMatch[1]);
        if (n < 1 || n > TEAM_COUNT) return json(404, { error: 'Team not found.' });
        const action = clean(body.action, 40);
        const allowed = new Set(['pause', 'resume', 'reset', 'advance', 'gps_unlock', 'set_score', 'set_index', 'complete', 'message', 'note']);
        if (!allowed.has(action)) return json(400, { error: 'Unsupported control action.' });
        let team = await readTeam(store, n);

        if (action === 'pause') team.status = 'paused';
        if (action === 'resume') team.status = team.progress >= 100 ? 'completed' : 'active';
        if (action === 'reset') team = { ...defaultTeam(n), control: team.control };
        if (action === 'advance') {
          const nextIndex = clamp(Number(team.currentIndex || 0) + 1, 0, 10);
          team.currentIndex = nextIndex;
          team.collectedCount = Math.max(team.collectedCount || 0, nextIndex);
          team.progress = nextIndex >= 10 ? 95 : Math.min(90, nextIndex * 9);
          team.phase = nextIndex >= 10 ? 'finalPuzzle' : 'hunt';
          team.status = 'active';
        }
        if (action === 'set_score') team.score = clamp(Math.round(Number(body.value) || 0), 0, 999999);
        if (action === 'set_index') {
          const idx = clamp(Math.floor(Number(body.value) || 0), 0, 10);
          team.currentIndex = idx;
          team.collectedCount = idx;
          team.progress = idx >= 10 ? 95 : Math.min(90, idx * 9);
          team.phase = idx >= 10 ? 'finalPuzzle' : 'hunt';
          team.status = 'active';
        }
        if (action === 'complete') {
          team.progress = 100; team.currentIndex = 10; team.collectedCount = 10; team.phase = 'complete'; team.status = 'completed'; team.completedAt = nowIso();
        }
        if (action === 'note') {
          team.note = clean(body.message, 500);
          team = await writeTeam(store, team);
          await addLog(store, n, 'admin.note', 'Coordinator note updated.');
          return json(200, { ok: true, team });
        }

        const payload = {
          value: body.value,
          targetIndex: ['advance','set_index','complete'].includes(action) ? team.currentIndex : undefined,
          targetScore: action === 'set_score' ? team.score : undefined,
          message: action === 'message' ? clean(body.message, 500) : '',
          expiresAt: action === 'gps_unlock' ? new Date(Date.now() + clamp(Number(body.minutes) || 10, 1, 60) * 60_000).toISOString() : undefined
        };
        team = await issueControl(store, team, action, payload);
        return json(200, { ok: true, team });
      }

      if (path === '/admin/reset-event' && request.method === 'POST') {
        for (let n = 1; n <= TEAM_COUNT; n++) {
          const old = await readTeam(store, n);
          const next = { ...defaultTeam(n), control: { revision: Number(old.control?.revision || 0) + 1, action: 'reset', payload: {}, issuedAt: nowIso() } };
          await store.setJSON(teamKey(n), next);
          await addLog(store, n, 'admin.control', 'Admin reset the entire event.');
        }
        return json(200, { ok: true });
      }

      return json(404, { error: 'Admin event route not found.' });
    }

    return json(404, { error: 'Not found.' });
  } catch (error) {
    console.error('hunt-event', error);
    return json(500, { error: 'Event service unavailable.' });
  }
}
