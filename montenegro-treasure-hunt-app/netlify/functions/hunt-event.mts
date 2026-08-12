import crypto from 'node:crypto';
import { getStore, getDeployStore } from '@netlify/blobs';
import { DEFAULT_CONFIG, DEFAULT_CONTENT } from './_hunt-event/defaults.mjs';

const EVENT_STORE = 'podgorica-hunt-event-2026';
const REGISTRY_KEY = 'platform/programs-v1';
const DEFAULT_PROGRAM_ID = 'PG26';
const MAX_TEAMS = 50;
const nowIso = () => new Date().toISOString();
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const clean = (v, max = 500) => String(v ?? '').trim().slice(0, max);
const pad = n => String(n).padStart(2, '0');

const DEFAULT_ADMIN_PASSWORD_HASH = '9552929bc70074eb42eeb96f7410edc32f02b4b16a197ff577f79142f23c4740';

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

function eventStore() {
  const context = String(process.env.CONTEXT || process.env.NETLIFY_CONTEXT || '').toLowerCase();
  if (context && context !== 'production') return getDeployStore(EVENT_STORE);
  return getStore(EVENT_STORE, { consistency: 'strong' });
}

function adminPasswordHash() {
  return (process.env.MTH_EVENT_ADMIN_PASSWORD_HASH || DEFAULT_ADMIN_PASSWORD_HASH).trim().toLowerCase();
}

async function requireAdmin(request) {
  const password = request.headers.get('x-mth-admin-password') || '';
  if (!password) return null;
  const incoming = crypto.createHash('sha256').update(password).digest('hex');
  const expected = adminPasswordHash();
  if (!/^[a-f0-9]{64}$/.test(expected)) return null;
  try {
    const ok = crypto.timingSafeEqual(Buffer.from(incoming, 'hex'), Buffer.from(expected, 'hex'));
    return ok ? { email: 'Password access', role: 'admin' } : null;
  } catch {
    return null;
  }
}

function normalizeProgramId(value) {
  const id = clean(value, 24).toUpperCase().replace(/\s+/g, '-');
  return /^[A-Z0-9][A-Z0-9_-]{1,23}$/.test(id) ? id : '';
}

function normalizeCode(value) {
  const code = clean(value, 40).toUpperCase().replace(/\s+/g, '-');
  return /^[A-Z0-9][A-Z0-9_-]{2,39}$/.test(code) ? code : '';
}

function generatedCodes(prefix, teamCount) {
  const safe = normalizeProgramId(prefix) || 'TEAM';
  const width = Math.max(2, String(teamCount).length);
  return Array.from({ length: teamCount }, (_, index) => ({
    code: `${safe}-${String(index + 1).padStart(width, '0')}`,
    teamNo: index + 1,
    label: `Team ${String(index + 1).padStart(width, '0')}`
  }));
}

function seedRegistry() {
  return {
    version: 1,
    defaultProgramId: DEFAULT_PROGRAM_ID,
    updatedAt: nowIso(),
    programs: [{
      id: DEFAULT_PROGRAM_ID,
      name: 'Podgorica 2026',
      location: 'Podgorica',
      teamCount: 10,
      codePrefix: 'PG26',
      codes: generatedCodes('PG26', 10),
      enabled: true,
      template: 'case-19-18',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: nowIso()
    }]
  };
}

function normalizeProgram(raw) {
  const id = normalizeProgramId(raw?.id);
  if (!id) return null;
  const teamCount = clamp(Math.floor(Number(raw?.teamCount) || 10), 1, MAX_TEAMS);
  const prefix = normalizeProgramId(raw?.codePrefix) || id;
  let codes = Array.isArray(raw?.codes) ? raw.codes.map((row, index) => ({
    code: normalizeCode(typeof row === 'string' ? row : row?.code),
    teamNo: clamp(Math.floor(Number(typeof row === 'object' ? row?.teamNo : index + 1) || index + 1), 1, teamCount),
    label: clean(typeof row === 'object' ? row?.label : '', 80) || `Team ${pad(index + 1)}`
  })).filter(row => row.code) : [];
  if (codes.length !== teamCount || new Set(codes.map(x => x.teamNo)).size !== teamCount) codes = generatedCodes(prefix, teamCount);
  return {
    id,
    name: clean(raw?.name, 120) || id,
    location: clean(raw?.location, 120),
    teamCount,
    codePrefix: prefix,
    codes,
    enabled: raw?.enabled !== false,
    template: clean(raw?.template, 60) || 'case-19-18',
    createdAt: raw?.createdAt || nowIso(),
    updatedAt: raw?.updatedAt || nowIso()
  };
}

async function getRegistry(store, { persist = true } = {}) {
  const saved = await store.get(REGISTRY_KEY, { type: 'json' });
  if (saved?.programs?.length) {
    const programs = saved.programs.map(p => normalizeProgram(p)).filter(Boolean);
    const defaultProgramId = programs.some(p => p.id === saved.defaultProgramId) ? saved.defaultProgramId : programs[0]?.id || DEFAULT_PROGRAM_ID;
    return { ...saved, version: 1, defaultProgramId, programs };
  }
  const seed = seedRegistry();
  if (persist) await store.setJSON(REGISTRY_KEY, seed);
  return seed;
}

async function saveRegistry(store, registry) {
  registry.updatedAt = nowIso();
  await store.setJSON(REGISTRY_KEY, registry);
  return registry;
}

function findProgram(registry, id) {
  const normalized = normalizeProgramId(id);
  return registry.programs.find(p => p.id === normalized) || null;
}

function resolveCode(registry, value) {
  const code = normalizeCode(value);
  if (!code) return null;
  for (const program of registry.programs) {
    const row = program.codes.find(item => item.code === code);
    if (row) return { program, code, teamNo: row.teamNo, label: row.label };
  }
  return null;
}

function assertUniqueProgramCodes(registry, candidateProgram, ignoreProgramId = '') {
  const seen = new Map();
  for (const program of registry.programs) {
    if (program.id === ignoreProgramId) continue;
    for (const row of program.codes) seen.set(row.code, program.id);
  }
  for (const row of candidateProgram.codes) {
    if (seen.has(row.code)) return `Code ${row.code} is already used by ${seen.get(row.code)}.`;
  }
  return '';
}

function programPrefix(program) { return `event/${program.id}`; }
function teamKey(program, n) { return `${programPrefix(program)}/team/${pad(n)}`; }
function logPrefix(program, n) { return `${programPrefix(program)}/log/team-${pad(n)}/`; }
function configKey(program) { return `${programPrefix(program)}/config`; }
function contentKey(program) { return `${programPrefix(program)}/content`; }

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

async function readTeam(store, program, n) {
  return { ...defaultTeam(n), ...(await store.get(teamKey(program, n), { type: 'json' }) || {}) };
}

async function writeTeam(store, program, team) {
  const next = { ...team, updatedAt: nowIso() };
  await store.setJSON(teamKey(program, next.teamNo), next);
  return next;
}

async function getConfig(store, program) {
  const saved = await store.get(configKey(program), { type: 'json' });
  return { ...DEFAULT_CONFIG, name: program.name, ...(saved || {}) };
}

async function getContent(store, program) {
  const saved = await store.get(contentKey(program), { type: 'json' });
  return saved ? { ...structuredClone(DEFAULT_CONTENT), ...saved } : structuredClone(DEFAULT_CONTENT);
}

async function addLog(store, program, teamNo, type, message, payload = {}) {
  const at = nowIso();
  const key = `${logPrefix(program, teamNo)}${at}-${crypto.randomUUID()}`;
  await store.setJSON(key, { programId: program.id, teamNo, type, message, payload, at });
}

async function listLogs(store, program, teamNo, limit = 80) {
  const { blobs = [] } = await store.list({ prefix: logPrefix(program, teamNo) });
  const keys = blobs.map(x => x.key).sort().reverse().slice(0, limit);
  const rows = await Promise.all(keys.map(k => store.get(k, { type: 'json' })));
  return rows.filter(Boolean);
}

async function board(store, program) {
  const teams = [];
  for (let n = 1; n <= program.teamCount; n++) teams.push(await readTeam(store, program, n));
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

function telemetryFromBody(body, stopCount) {
  return {
    progress: clamp(Number(body.progress) || 0, 0, 100),
    score: clamp(Math.round(Number(body.score) || 0), 0, 999999),
    phase: clean(body.phase, 40) || 'hunt',
    currentIndex: clamp(Math.floor(Number(body.currentIndex) || 0), 0, stopCount),
    collectedCount: clamp(Math.floor(Number(body.collectedCount) || 0), 0, stopCount),
    hintsCount: clamp(Math.floor(Number(body.hintsCount) || 0), 0, 999),
    wrongAnswers: clamp(Math.floor(Number(body.wrongAnswers) || 0), 0, 9999),
    currentCheckpointId: clean(body.currentCheckpointId, 80) || null,
    currentCheckpointName: clean(body.currentCheckpointName, 120) || null,
    currentArea: clean(body.currentArea, 100) || null,
    distanceToTarget: Number.isFinite(Number(body.distanceToTarget)) ? clamp(Math.round(Number(body.distanceToTarget)), 0, 1000000) : null,
    lastPosition: sanitizePosition(body.lastPosition),
    gpsError: clean(body.gpsError, 180),
    lastAction: clean(body.lastAction, 180) || 'Playing'
  };
}

async function issueControl(store, program, team, action, payload = {}) {
  const revision = Number(team.control?.revision || 0) + 1;
  team.control = { revision, action, payload, issuedAt: nowIso() };
  await writeTeam(store, program, team);
  await addLog(store, program, team.teamNo, 'admin.control', `Admin: ${action}`, payload);
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
  const avgProgress = teams.length ? Math.round(teams.reduce((sum, t) => sum + Number(t.progress || 0), 0) / teams.length) : 0;
  return { online, active, completed, notStarted, needsAttention, avgProgress, total: teams.length };
}

function selectedProgramFromRequest(url, registry) {
  return findProgram(registry, url.searchParams.get('program')) || findProgram(registry, registry.defaultProgramId) || registry.programs[0];
}

function programPublic(program) {
  return {
    id: program.id,
    name: program.name,
    location: program.location,
    teamCount: program.teamCount,
    enabled: program.enabled,
    template: program.template
  };
}

async function initializeProgram(store, program, sourceProgram = null) {
  let content = structuredClone(DEFAULT_CONTENT);
  let config = { ...DEFAULT_CONFIG, name: program.name, active: false, paused: false, announcement: '', emergencyMessage: '' };
  if (sourceProgram) {
    content = structuredClone(await getContent(store, sourceProgram));
    const sourceConfig = await getConfig(store, sourceProgram);
    config = { ...sourceConfig, name: program.name, active: false, paused: false, announcement: '', emergencyMessage: '', updatedAt: nowIso() };
  }
  content.version = `program-${program.id.toLowerCase()}-${Date.now()}`;
  content.updatedAt = nowIso();
  await store.setJSON(contentKey(program), content);
  await store.setJSON(configKey(program), config);
}

function validateCustomCodes(codes, teamCount) {
  if (!Array.isArray(codes) || codes.length !== teamCount) return { error: `Provide exactly ${teamCount} codes.` };
  const normalized = codes.map((value, index) => ({
    code: normalizeCode(typeof value === 'string' ? value : value?.code),
    teamNo: index + 1,
    label: clean(typeof value === 'object' ? value?.label : '', 80) || `Team ${pad(index + 1)}`
  }));
  if (normalized.some(row => !row.code)) return { error: 'One or more access codes are invalid.' };
  if (new Set(normalized.map(row => row.code)).size !== normalized.length) return { error: 'Access codes must be unique.' };
  return { codes: normalized };
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

    const registry = await getRegistry(store);

    if (path === '/health') return json(200, { ok: true, platform: 'MTH', programs: registry.programs.length, defaultProgramId: registry.defaultProgramId, adminControls: true });

    if (path === '/content' && request.method === 'GET') {
      const ref = url.searchParams.get('code') ? resolveCode(registry, url.searchParams.get('code')) : null;
      const program = ref?.program || selectedProgramFromRequest(url, registry);
      return json(200, { ok: true, program: programPublic(program), config: await getConfig(store, program), content: await getContent(store, program) });
    }

    if (path === '/join' && request.method === 'POST') {
      const teamRef = resolveCode(registry, body.code);
      if (!teamRef) return json(400, { error: 'Invalid access code.' });
      const { program } = teamRef;
      if (!program.enabled) return json(423, { error: 'This program is currently disabled.' });
      const config = await getConfig(store, program);
      if (!config.active) return json(423, { error: 'This program is not open yet.' });
      const content = await getContent(store, program);
      const current = await readTeam(store, program, teamRef.teamNo);
      const wasNew = current.status === 'not_started';
      const next = await writeTeam(store, program, {
        ...current,
        teamNo: teamRef.teamNo,
        status: current.status === 'completed' ? 'completed' : 'active',
        joinedAt: current.joinedAt || nowIso(),
        lastAction: wasNew ? 'Joined program' : 'Rejoined program'
      });
      if (wasNew) await addLog(store, program, teamRef.teamNo, 'team.joined', 'Team joined the program.', { code: teamRef.code });
      return json(200, {
        ok: true,
        event: program.id,
        program: programPublic(program),
        team: { ...next, accessCode: teamRef.code },
        startOffset: (teamRef.teamNo - 1) % Math.max(1, content.checkpoints?.length || 1),
        config,
        content
      });
    }

    if (path === '/progress' && request.method === 'POST') {
      const teamRef = resolveCode(registry, body.code);
      if (!teamRef) return json(400, { error: 'Invalid access code.' });
      const { program } = teamRef;
      const content = await getContent(store, program);
      const current = await readTeam(store, program, teamRef.teamNo);
      const telemetry = telemetryFromBody(body, content.checkpoints?.length || 10);
      const completed = telemetry.progress >= 100 || telemetry.phase === 'complete';
      const next = await writeTeam(store, program, {
        ...current,
        ...telemetry,
        status: completed ? 'completed' : (current.status === 'paused' ? 'paused' : 'active'),
        completedAt: completed ? (current.completedAt || nowIso()) : null
      });
      if (body.logAction && clean(body.logAction, 180) !== current.lastLoggedAction) {
        next.lastLoggedAction = clean(body.logAction, 180);
        await writeTeam(store, program, next);
        await addLog(store, program, teamRef.teamNo, 'team.action', next.lastLoggedAction, { currentIndex: next.currentIndex, score: next.score });
      }
      return json(200, { ok: true, program: programPublic(program), team: next, control: next.control, config: await getConfig(store, program) });
    }

    if (path === '/presence' && request.method === 'POST') {
      const teamRef = resolveCode(registry, body.code);
      if (!teamRef) return json(400, { error: 'Invalid access code.' });
      const { program } = teamRef;
      const current = await readTeam(store, program, teamRef.teamNo);
      const next = await writeTeam(store, program, {
        ...current,
        lastPosition: sanitizePosition(body.lastPosition) || current.lastPosition,
        distanceToTarget: Number.isFinite(Number(body.distanceToTarget)) ? clamp(Math.round(Number(body.distanceToTarget)), 0, 1000000) : current.distanceToTarget,
        gpsError: clean(body.gpsError, 180),
        lastAction: clean(body.lastAction, 180) || current.lastAction,
        currentCheckpointId: clean(body.currentCheckpointId, 80) || current.currentCheckpointId,
        currentCheckpointName: clean(body.currentCheckpointName, 120) || current.currentCheckpointName,
        currentArea: clean(body.currentArea, 100) || current.currentArea
      });
      return json(200, { ok: true, program: programPublic(program), control: next.control, config: await getConfig(store, program) });
    }

    if (path === '/control' && request.method === 'GET') {
      const teamRef = resolveCode(registry, url.searchParams.get('code'));
      if (!teamRef) return json(400, { error: 'Invalid access code.' });
      const { program } = teamRef;
      const team = await readTeam(store, program, teamRef.teamNo);
      return json(200, { ok: true, program: programPublic(program), control: team.control, status: team.status, note: team.note || '', config: await getConfig(store, program), contentVersion: (await getContent(store, program)).version });
    }

    if (path === '/board' && request.method === 'GET') {
      const ref = url.searchParams.get('code') ? resolveCode(registry, url.searchParams.get('code')) : null;
      const program = ref?.program || selectedProgramFromRequest(url, registry);
      const config = await getConfig(store, program);
      if (!config.leaderboard) return json(200, { ok: true, program: programPublic(program), event: program.id, hidden: true, teams: [] });
      return json(200, { ok: true, program: programPublic(program), event: program.id, teams: (await board(store, program)).map(publicTeam) });
    }

    if (path.startsWith('/admin/')) {
      const admin = await requireAdmin(request);
      if (!admin) return json(401, { error: 'Pogrešna admin lozinka.' });

      if (path === '/admin/programs' && request.method === 'GET') {
        const rows = [];
        for (const program of registry.programs) {
          const config = await getConfig(store, program);
          rows.push({ ...program, eventOpen: Boolean(config.active), paused: Boolean(config.paused), isDefault: program.id === registry.defaultProgramId });
        }
        return json(200, { ok: true, defaultProgramId: registry.defaultProgramId, programs: rows });
      }

      if (path === '/admin/programs' && request.method === 'POST') {
        const id = normalizeProgramId(body.id || body.codePrefix || body.name);
        if (!id) return json(400, { error: 'Program ID must use letters, numbers, - or _.' });
        if (findProgram(registry, id)) return json(409, { error: 'A program with this ID already exists.' });
        const teamCount = clamp(Math.floor(Number(body.teamCount) || 10), 1, MAX_TEAMS);
        const codePrefix = normalizeProgramId(body.codePrefix || id) || id;
        const program = normalizeProgram({
          id,
          name: body.name || id,
          location: body.location || '',
          teamCount,
          codePrefix,
          codes: generatedCodes(codePrefix, teamCount),
          enabled: body.enabled !== false,
          template: body.template || 'case-19-18',
          createdAt: nowIso(),
          updatedAt: nowIso()
        });
        const conflict = assertUniqueProgramCodes(registry, program);
        if (conflict) return json(409, { error: conflict });
        const source = findProgram(registry, body.cloneFrom || registry.defaultProgramId);
        registry.programs.push(program);
        await saveRegistry(store, registry);
        await initializeProgram(store, program, source && source.id !== program.id ? source : null);
        return json(201, { ok: true, program });
      }

      const programRoute = path.match(/^\/admin\/programs\/([A-Z0-9_-]+)$/i);
      if (programRoute && request.method === 'PUT') {
        const id = normalizeProgramId(programRoute[1]);
        const index = registry.programs.findIndex(p => p.id === id);
        if (index < 0) return json(404, { error: 'Program not found.' });
        const current = registry.programs[index];
        const teamCount = body.teamCount == null ? current.teamCount : clamp(Math.floor(Number(body.teamCount) || current.teamCount), 1, MAX_TEAMS);
        const prefix = normalizeProgramId(body.codePrefix || current.codePrefix) || current.codePrefix;
        let codes = current.codes.filter(row => row.teamNo <= teamCount);
        if (teamCount !== current.teamCount || prefix !== current.codePrefix) codes = generatedCodes(prefix, teamCount);
        const next = normalizeProgram({
          ...current,
          name: body.name == null ? current.name : body.name,
          location: body.location == null ? current.location : body.location,
          enabled: body.enabled == null ? current.enabled : Boolean(body.enabled),
          teamCount,
          codePrefix: prefix,
          codes,
          updatedAt: nowIso()
        });
        const conflict = assertUniqueProgramCodes(registry, next, id);
        if (conflict) return json(409, { error: conflict });
        registry.programs[index] = next;
        await saveRegistry(store, registry);
        return json(200, { ok: true, program: next });
      }

      const codesRoute = path.match(/^\/admin\/programs\/([A-Z0-9_-]+)\/codes$/i);
      if (codesRoute && request.method === 'PUT') {
        const id = normalizeProgramId(codesRoute[1]);
        const index = registry.programs.findIndex(p => p.id === id);
        if (index < 0) return json(404, { error: 'Program not found.' });
        const current = registry.programs[index];
        const validated = validateCustomCodes(body.codes, current.teamCount);
        if (validated.error) return json(400, { error: validated.error });
        const next = { ...current, codes: validated.codes, updatedAt: nowIso() };
        const conflict = assertUniqueProgramCodes(registry, next, id);
        if (conflict) return json(409, { error: conflict });
        registry.programs[index] = next;
        await saveRegistry(store, registry);
        return json(200, { ok: true, program: next });
      }

      const regenRoute = path.match(/^\/admin\/programs\/([A-Z0-9_-]+)\/regenerate-codes$/i);
      if (regenRoute && request.method === 'POST') {
        const id = normalizeProgramId(regenRoute[1]);
        const index = registry.programs.findIndex(p => p.id === id);
        if (index < 0) return json(404, { error: 'Program not found.' });
        const current = registry.programs[index];
        const prefix = normalizeProgramId(body.codePrefix || current.codePrefix) || current.codePrefix;
        const next = { ...current, codePrefix: prefix, codes: generatedCodes(prefix, current.teamCount), updatedAt: nowIso() };
        const conflict = assertUniqueProgramCodes(registry, next, id);
        if (conflict) return json(409, { error: conflict });
        registry.programs[index] = next;
        await saveRegistry(store, registry);
        return json(200, { ok: true, program: next });
      }

      const defaultRoute = path.match(/^\/admin\/programs\/([A-Z0-9_-]+)\/default$/i);
      if (defaultRoute && request.method === 'POST') {
        const id = normalizeProgramId(defaultRoute[1]);
        if (!findProgram(registry, id)) return json(404, { error: 'Program not found.' });
        registry.defaultProgramId = id;
        await saveRegistry(store, registry);
        return json(200, { ok: true, defaultProgramId: id });
      }

      const program = selectedProgramFromRequest(url, registry);
      const content = await getContent(store, program);

      if (path === '/admin/overview' && request.method === 'GET') {
        const teams = [];
        for (let n = 1; n <= program.teamCount; n++) {
          const t = await readTeam(store, program, n);
          const cp = routeCheckpoint(content, n, t.currentIndex);
          const code = program.codes.find(row => row.teamNo === n)?.code || '';
          teams.push({ ...t, accessCode: code, expectedCheckpoint: cp ? { id: cp.id, name: cp.name, area: cp.area, lat: cp.lat, lng: cp.lng, radius: cp.radius } : null });
        }
        return json(200, { ok: true, admin, program, config: await getConfig(store, program), contentVersion: content.version, stats: deriveStats(teams), teams });
      }

      if (path === '/admin/config' && request.method === 'GET') return json(200, { ok: true, program, config: await getConfig(store, program) });
      if (path === '/admin/config' && request.method === 'PUT') {
        const current = await getConfig(store, program);
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
        await store.setJSON(configKey(program), next);
        return json(200, { ok: true, program, config: next });
      }

      if (path === '/admin/content' && request.method === 'GET') return json(200, { ok: true, program, content });
      if (path === '/admin/content' && request.method === 'PUT') {
        const next = body.content;
        if (!next || !Array.isArray(next.checkpoints) || next.checkpoints.length !== 10 || !Array.isArray(next.storyBeats) || next.storyBeats.length !== 10 || !next.final) {
          return json(400, { error: 'Content must contain 10 checkpoints, 10 story beats and a final location.' });
        }
        next.version = clean(next.version, 60) || `admin-${Date.now()}`;
        next.updatedAt = nowIso();
        await store.setJSON(contentKey(program), next);
        return json(200, { ok: true, program, content: next });
      }
      if (path === '/admin/content/reset' && request.method === 'POST') {
        await store.delete(contentKey(program));
        return json(200, { ok: true, program, content: structuredClone(DEFAULT_CONTENT) });
      }

      const detail = path.match(/^\/admin\/teams\/(\d{1,2})$/);
      if (detail && request.method === 'GET') {
        const n = Number(detail[1]);
        if (n < 1 || n > program.teamCount) return json(404, { error: 'Team not found.' });
        const team = await readTeam(store, program, n);
        const cp = routeCheckpoint(content, n, team.currentIndex);
        const accessCode = program.codes.find(row => row.teamNo === n)?.code || '';
        return json(200, { ok: true, program, team: { ...team, accessCode, expectedCheckpoint: cp }, logs: await listLogs(store, program, n) });
      }

      const controlMatch = path.match(/^\/admin\/teams\/(\d{1,2})\/control$/);
      if (controlMatch && request.method === 'POST') {
        const n = Number(controlMatch[1]);
        if (n < 1 || n > program.teamCount) return json(404, { error: 'Team not found.' });
        const action = clean(body.action, 40);
        const allowed = new Set(['pause', 'resume', 'reset', 'advance', 'gps_unlock', 'set_score', 'set_index', 'complete', 'message', 'note']);
        if (!allowed.has(action)) return json(400, { error: 'Unsupported control action.' });
        let team = await readTeam(store, program, n);
        const stopCount = content.checkpoints?.length || 10;

        if (action === 'pause') team.status = 'paused';
        if (action === 'resume') team.status = team.progress >= 100 ? 'completed' : 'active';
        if (action === 'reset') team = { ...defaultTeam(n), control: team.control };
        if (action === 'advance') {
          const nextIndex = clamp(Number(team.currentIndex || 0) + 1, 0, stopCount);
          team.currentIndex = nextIndex;
          team.collectedCount = Math.max(team.collectedCount || 0, nextIndex);
          team.progress = nextIndex >= stopCount ? 95 : Math.min(90, Math.round(nextIndex / stopCount * 90));
          team.phase = nextIndex >= stopCount ? 'finalPuzzle' : 'hunt';
          team.status = 'active';
        }
        if (action === 'set_score') team.score = clamp(Math.round(Number(body.value) || 0), 0, 999999);
        if (action === 'set_index') {
          const idx = clamp(Math.floor(Number(body.value) || 0), 0, stopCount);
          team.currentIndex = idx;
          team.collectedCount = idx;
          team.progress = idx >= stopCount ? 95 : Math.min(90, Math.round(idx / stopCount * 90));
          team.phase = idx >= stopCount ? 'finalPuzzle' : 'hunt';
          team.status = 'active';
        }
        if (action === 'complete') {
          team.progress = 100; team.currentIndex = stopCount; team.collectedCount = stopCount; team.phase = 'complete'; team.status = 'completed'; team.completedAt = nowIso();
        }
        if (action === 'note') {
          team.note = clean(body.message, 500);
          team = await writeTeam(store, program, team);
          await addLog(store, program, n, 'admin.note', 'Coordinator note updated.');
          return json(200, { ok: true, program, team });
        }

        const payload = {
          value: body.value,
          targetIndex: ['advance', 'set_index', 'complete'].includes(action) ? team.currentIndex : undefined,
          targetScore: action === 'set_score' ? team.score : undefined,
          message: action === 'message' ? clean(body.message, 500) : '',
          expiresAt: action === 'gps_unlock' ? new Date(Date.now() + clamp(Number(body.minutes) || 10, 1, 60) * 60_000).toISOString() : undefined
        };
        team = await issueControl(store, program, team, action, payload);
        return json(200, { ok: true, program, team });
      }

      if (path === '/admin/reset-event' && request.method === 'POST') {
        for (let n = 1; n <= program.teamCount; n++) {
          const old = await readTeam(store, program, n);
          const next = { ...defaultTeam(n), control: { revision: Number(old.control?.revision || 0) + 1, action: 'reset', payload: {}, issuedAt: nowIso() } };
          await store.setJSON(teamKey(program, n), next);
          await addLog(store, program, n, 'admin.control', 'Admin reset the entire program.');
        }
        return json(200, { ok: true, program });
      }

      return json(404, { error: 'Admin program route not found.' });
    }

    return json(404, { error: 'Not found.' });
  } catch (error) {
    console.error('hunt-event', error);
    return json(500, { error: 'Event service unavailable.' });
  }
}
