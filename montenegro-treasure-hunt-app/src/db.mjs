import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.mjs';
import {
  addDaysIso,
  addHoursIso,
  codeHint,
  hashToken,
  jsonString,
  makeVoucherCode,
  nowIso,
  passwordHash,
  publicTour,
  randomId,
  randomToken,
  safeJson,
  verifyPassword
} from './utils.mjs';

fs.mkdirSync(path.dirname(config.databaseFile), { recursive: true });
export const db = new DatabaseSync(config.databaseFile);
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');

export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token_hash);

    CREATE TABLE IF NOT EXISTS tours (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      published INTEGER NOT NULL DEFAULT 0,
      meta_json TEXT NOT NULL,
      content_json TEXT NOT NULL,
      content_version TEXT NOT NULL DEFAULT '1.0.0',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vouchers (
      id TEXT PRIMARY KEY,
      code_hash TEXT NOT NULL UNIQUE,
      code_hint TEXT NOT NULL,
      label TEXT NOT NULL,
      value_cents INTEGER NOT NULL DEFAULT 0,
      max_players INTEGER NOT NULL DEFAULT 6,
      allowed_tours_json TEXT NOT NULL,
      assigned_tour_id TEXT,
      external_ref TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      is_test INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT,
      redeemed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);

    CREATE TABLE IF NOT EXISTS player_access (
      id TEXT PRIMARY KEY,
      voucher_id TEXT REFERENCES vouchers(id) ON DELETE SET NULL,
      token_hash TEXT NOT NULL UNIQUE,
      allowed_tours_json TEXT NOT NULL,
      selected_tour_id TEXT,
      max_players INTEGER NOT NULL DEFAULT 6,
      is_test INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_player_access_token ON player_access(token_hash);

    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      public_id TEXT NOT NULL UNIQUE,
      access_id TEXT NOT NULL REFERENCES player_access(id) ON DELETE CASCADE,
      tour_id TEXT NOT NULL REFERENCES tours(id),
      crew_name TEXT NOT NULL,
      captain_name TEXT NOT NULL,
      player_count INTEGER NOT NULL,
      mode TEXT NOT NULL DEFAULT 'live',
      status TEXT NOT NULL DEFAULT 'active',
      checkpoint_index INTEGER NOT NULL DEFAULT 0,
      score INTEGER NOT NULL DEFAULT 0,
      hints_json TEXT NOT NULL DEFAULT '[]',
      wrong_answers INTEGER NOT NULL DEFAULT 0,
      evidence_json TEXT NOT NULL DEFAULT '[]',
      sidequests_json TEXT NOT NULL DEFAULT '[]',
      last_position_json TEXT,
      started_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON game_sessions(status);
    CREATE INDEX IF NOT EXISTS idx_sessions_access ON game_sessions(access_id);

    CREATE TABLE IF NOT EXISTS game_events (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_events_session ON game_events(session_id, created_at);

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      admin_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

export function audit(adminId, action, entityType, entityId, payload = {}) {
  db.prepare(`INSERT INTO audit_log (id,admin_id,action,entity_type,entity_id,payload_json,created_at)
    VALUES (?,?,?,?,?,?,?)`).run(randomId(), adminId || null, action, entityType, entityId || null, jsonString(payload), nowIso());
}

export function seedContent({ force = false } = {}) {
  const count = db.prepare('SELECT COUNT(*) AS n FROM tours').get().n;
  if (count && !force) return { inserted: 0, updated: 0 };
  const seedPath = path.resolve('content/tours.json');
  const payload = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  let inserted = 0, updated = 0;
  const upsert = db.prepare(`
    INSERT INTO tours (id,slug,published,meta_json,content_json,content_version,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(slug) DO UPDATE SET
      published=excluded.published,
      meta_json=excluded.meta_json,
      content_json=excluded.content_json,
      content_version=excluded.content_version,
      updated_at=excluded.updated_at
  `);
  const existing = db.prepare('SELECT id FROM tours WHERE slug=?');
  for (const meta of payload.tours) {
    const content = payload.cases[meta.caseId];
    const found = existing.get(meta.id);
    const id = found?.id || randomId();
    const stamp = nowIso();
    upsert.run(id, meta.id, meta.published ? 1 : 0, jsonString(meta), jsonString(content), meta.contentVersion || payload.version, stamp, stamp);
    found ? updated++ : inserted++;
  }
  return { inserted, updated };
}

export function ensureAdmin(email = config.adminEmail, password = config.adminPassword) {
  if (!email || !password) return null;
  const existing = db.prepare('SELECT id,email FROM admin_users WHERE email=? COLLATE NOCASE').get(email);
  if (existing) return existing;
  const { salt, hash } = passwordHash(password);
  const id = randomId();
  const stamp = nowIso();
  db.prepare(`INSERT INTO admin_users (id,email,password_hash,password_salt,role,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?)`).run(id, email.toLowerCase(), hash, salt, 'admin', stamp, stamp);
  return { id, email: email.toLowerCase() };
}

export function authenticateAdmin(email, password) {
  const row = db.prepare('SELECT * FROM admin_users WHERE email=? COLLATE NOCASE').get(String(email || '').trim());
  if (!row || !verifyPassword(String(password || ''), row.password_salt, row.password_hash)) return null;
  return { id: row.id, email: row.email, role: row.role };
}

export function createAdminSession(adminId) {
  const raw = randomToken();
  const stamp = nowIso();
  db.prepare(`INSERT INTO admin_sessions (id,admin_id,token_hash,expires_at,created_at,last_seen_at)
    VALUES (?,?,?,?,?,?)`).run(randomId(), adminId, hashToken(raw, config.tokenPepper), addHoursIso(config.adminSessionHours), stamp, stamp);
  return raw;
}

export function getAdminByToken(raw) {
  if (!raw) return null;
  const tokenHash = hashToken(raw, config.tokenPepper);
  const row = db.prepare(`SELECT u.id,u.email,u.role,s.id AS session_id,s.expires_at
    FROM admin_sessions s JOIN admin_users u ON u.id=s.admin_id
    WHERE s.token_hash=? AND s.expires_at>?`).get(tokenHash, nowIso());
  if (!row) return null;
  db.prepare('UPDATE admin_sessions SET last_seen_at=? WHERE id=?').run(nowIso(), row.session_id);
  return row;
}

export function deleteAdminSession(raw) {
  if (!raw) return;
  db.prepare('DELETE FROM admin_sessions WHERE token_hash=?').run(hashToken(raw, config.tokenPepper));
}

export function listTours({ includeDrafts = false } = {}) {
  const rows = db.prepare(`SELECT * FROM tours ${includeDrafts ? '' : 'WHERE published=1'} ORDER BY json_extract(meta_json,'$.city')`).all();
  return rows.map(publicTour);
}
export function getTour(idOrSlug, { includeDrafts = false } = {}) {
  const row = db.prepare(`SELECT * FROM tours WHERE (id=? OR slug=?) ${includeDrafts ? '' : 'AND published=1'}`).get(idOrSlug, idOrSlug);
  return row ? publicTour(row) : null;
}
export function updateTour(id, payload) {
  const current = getTour(id, { includeDrafts: true });
  if (!current) return null;
  const meta = payload.meta || Object.fromEntries(Object.entries(current).filter(([k]) => !['case','id','slug','published','updatedAt'].includes(k)));
  const content = payload.case || current.case;
  const published = payload.published ?? current.published;
  const stamp = nowIso();
  db.prepare(`UPDATE tours SET published=?,meta_json=?,content_json=?,content_version=?,updated_at=? WHERE id=?`)
    .run(published ? 1 : 0, jsonString(meta), jsonString(content), payload.contentVersion || meta.contentVersion || '1.0.0', stamp, id);
  return getTour(id, { includeDrafts: true });
}

export function createVoucher(input, adminId = null) {
  let code;
  for (let i = 0; i < 10; i++) {
    code = input.code || makeVoucherCode();
    const exists = db.prepare('SELECT id FROM vouchers WHERE code_hash=?').get(hashToken(code.toUpperCase(), config.tokenPepper));
    if (!exists) break;
    code = null;
  }
  if (!code) throw new Error('Nije moguće generisati jedinstven vaučer.');
  const id = randomId();
  const stamp = nowIso();
  const allowed = Array.isArray(input.allowedTourIds) ? input.allowedTourIds : [];
  db.prepare(`INSERT INTO vouchers
    (id,code_hash,code_hint,label,value_cents,max_players,allowed_tours_json,assigned_tour_id,external_ref,status,is_test,expires_at,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      id,
      hashToken(code.toUpperCase(), config.tokenPepper),
      codeHint(code),
      input.label || 'Montenegro Treasure Hunt vaučer',
      Math.round(Number(input.value || 0) * 100),
      Math.max(1, Math.min(20, Number(input.maxPlayers || 6))),
      jsonString(allowed),
      input.assignedTourId || null,
      input.externalRef || null,
      'active',
      input.isTest ? 1 : 0,
      input.expiresAt || null,
      stamp,
      stamp
    );
  audit(adminId, 'voucher.create', 'voucher', id, { hint: codeHint(code), allowed });
  return { id, code, codeHint: codeHint(code) };
}

export function ensureDevVoucher() {
  if (!config.enableDevTestVoucher) return null;
  const code = 'MTH-TEST-ALL';
  const codeHash = hashToken(code, config.tokenPepper);
  const exists = db.prepare('SELECT id FROM vouchers WHERE code_hash=?').get(codeHash);
  if (exists) return { code, id: exists.id };
  const tourIds = db.prepare('SELECT id FROM tours WHERE published=1').all().map(r => r.id);
  const result = createVoucher({ code, label: 'Razvojni test - svih 6 tura', value: 999, maxPlayers: 12, allowedTourIds: tourIds, isTest: true });
  return { code, id: result.id };
}

export function listVouchers() {
  return db.prepare(`SELECT id,code_hint,label,value_cents,max_players,allowed_tours_json,assigned_tour_id,external_ref,status,is_test,expires_at,redeemed_at,created_at,updated_at
    FROM vouchers ORDER BY created_at DESC`).all().map(row => ({
      ...row,
      value: row.value_cents / 100,
      isTest: Boolean(row.is_test),
      allowedTourIds: safeJson(row.allowed_tours_json, [])
    }));
}
export function setVoucherStatus(id, status, adminId) {
  const allowed = new Set(['active','disabled','used','expired']);
  if (!allowed.has(status)) throw new Error('Nepoznat status.');
  db.prepare('UPDATE vouchers SET status=?,updated_at=? WHERE id=?').run(status, nowIso(), id);
  audit(adminId, 'voucher.status', 'voucher', id, { status });
}

export function redeemVoucher(code) {
  const normalized = String(code || '').trim().toUpperCase();
  const row = db.prepare('SELECT * FROM vouchers WHERE code_hash=?').get(hashToken(normalized, config.tokenPepper));
  if (!row) return { error: 'Kod nije prepoznat.' };
  if (row.status !== 'active') return { error: row.status === 'used' ? 'Ovaj vaučer je već aktiviran.' : 'Vaučer nije aktivan.' };
  if (row.expires_at && row.expires_at < nowIso()) {
    db.prepare('UPDATE vouchers SET status=?,updated_at=? WHERE id=?').run('expired', nowIso(), row.id);
    return { error: 'Vaučer je istekao.' };
  }
  const allowed = row.assigned_tour_id ? [row.assigned_tour_id] : safeJson(row.allowed_tours_json, []);
  const raw = randomToken();
  const accessId = randomId();
  const stamp = nowIso();
  const expiresAt = row.expires_at || addDaysIso(config.playerAccessDays);
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare(`INSERT INTO player_access
      (id,voucher_id,token_hash,allowed_tours_json,selected_tour_id,max_players,is_test,expires_at,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`).run(accessId, row.id, hashToken(raw, config.tokenPepper), jsonString(allowed), row.assigned_tour_id || null, row.max_players, row.is_test, expiresAt, stamp, stamp);
    if (!row.is_test) {
      db.prepare('UPDATE vouchers SET status=?,redeemed_at=?,updated_at=? WHERE id=?').run('used', stamp, stamp, row.id);
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return { token: raw, accessId, allowedTourIds: allowed, selectedTourId: row.assigned_tour_id, maxPlayers: row.max_players, isTest: Boolean(row.is_test), expiresAt };
}

export function createPreviewAccess(tourId, adminId) {
  const tour = getTour(tourId, { includeDrafts: true });
  if (!tour) throw new Error('Tura nije pronađena.');
  const raw = randomToken();
  const id = randomId();
  const stamp = nowIso();
  db.prepare(`INSERT INTO player_access
    (id,voucher_id,token_hash,allowed_tours_json,selected_tour_id,max_players,is_test,expires_at,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(id, null, hashToken(raw, config.tokenPepper), jsonString([tour.id]), tour.id, 12, 1, addHoursIso(8), stamp, stamp);
  audit(adminId, 'tour.preview', 'tour', tour.id, {});
  return { token: raw, tourId: tour.id };
}

export function getAccess(raw) {
  if (!raw) return null;
  const row = db.prepare('SELECT * FROM player_access WHERE token_hash=? AND expires_at>?').get(hashToken(raw, config.tokenPepper), nowIso());
  if (!row) return null;
  return {
    id: row.id,
    voucherId: row.voucher_id,
    allowedTourIds: safeJson(row.allowed_tours_json, []),
    selectedTourId: row.selected_tour_id,
    maxPlayers: row.max_players,
    isTest: Boolean(row.is_test),
    expiresAt: row.expires_at
  };
}
export function selectTour(accessId, tourId) {
  const row = db.prepare('SELECT * FROM player_access WHERE id=?').get(accessId);
  if (!row) return null;
  const allowed = safeJson(row.allowed_tours_json, []);
  if (!allowed.includes(tourId)) return null;
  if (row.selected_tour_id && row.selected_tour_id !== tourId) return { error: 'Vaučer je već vezan za drugu turu.' };
  db.prepare('UPDATE player_access SET selected_tour_id=?,updated_at=? WHERE id=?').run(tourId, nowIso(), accessId);
  return getTour(tourId, { includeDrafts: Boolean(row.is_test) });
}

export function findActiveSession(accessId) {
  const row = db.prepare(`SELECT * FROM game_sessions WHERE access_id=? AND status='active' ORDER BY started_at DESC LIMIT 1`).get(accessId);
  return row ? hydrateSession(row) : null;
}
export function createGameSession(access, input) {
  const selected = access.selectedTourId || input.tourId;
  if (!selected || !access.allowedTourIds.includes(selected)) throw new Error('Tura nije dozvoljena ovim vaučerom.');
  if (access.selectedTourId && access.selectedTourId !== selected) throw new Error('Vaučer je već vezan za drugu turu.');
  if (!access.selectedTourId) {
    db.prepare('UPDATE player_access SET selected_tour_id=?,updated_at=? WHERE id=?').run(selected, nowIso(), access.id);
    access.selectedTourId = selected;
  }
  const existing = findActiveSession(access.id);
  if (existing) return existing;
  const tour = getTour(selected, { includeDrafts: access.isTest });
  if (!tour) throw new Error('Tura nije dostupna.');
  const playerCount = Math.max(1, Math.min(access.maxPlayers, Number(input.playerCount || 1)));
  const mode = input.mode === 'test' && access.isTest ? 'test' : 'live';
  const row = {
    id: randomId(), public_id: randomToken(10), access_id: access.id, tour_id: selected,
    crew_name: String(input.crewName || 'Posada').trim().slice(0, 60) || 'Posada',
    captain_name: String(input.captainName || 'Kapetan').trim().slice(0, 60) || 'Kapetan',
    player_count: playerCount, mode, status: 'active', checkpoint_index: 0, score: 0,
    hints_json: '[]', wrong_answers: 0, evidence_json: '[]', sidequests_json: '[]', last_position_json: null,
    started_at: nowIso(), updated_at: nowIso(), completed_at: null
  };
  db.prepare(`INSERT INTO game_sessions
    (id,public_id,access_id,tour_id,crew_name,captain_name,player_count,mode,status,checkpoint_index,score,hints_json,wrong_answers,evidence_json,sidequests_json,last_position_json,started_at,updated_at,completed_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(...Object.values(row));
  addGameEvent(row.id, 'session.started', { mode, crewName: row.crew_name });
  return hydrateSession(row);
}

function hydrateSession(row) {
  return {
    id: row.id,
    publicId: row.public_id,
    accessId: row.access_id,
    tourId: row.tour_id,
    crewName: row.crew_name,
    captainName: row.captain_name,
    playerCount: row.player_count,
    mode: row.mode,
    status: row.status,
    checkpointIndex: row.checkpoint_index,
    score: row.score,
    hints: safeJson(row.hints_json, []),
    wrongAnswers: row.wrong_answers,
    evidence: safeJson(row.evidence_json, []),
    sidequests: safeJson(row.sidequests_json, []),
    lastPosition: safeJson(row.last_position_json, null),
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at
  };
}
export function getSession(publicId, accessId = null) {
  const row = accessId
    ? db.prepare('SELECT * FROM game_sessions WHERE public_id=? AND access_id=?').get(publicId, accessId)
    : db.prepare('SELECT * FROM game_sessions WHERE public_id=?').get(publicId);
  return row ? hydrateSession(row) : null;
}
export function listSessions() {
  return db.prepare(`SELECT s.*, json_extract(t.meta_json,'$.city') AS city, json_extract(t.meta_json,'$.title') AS tour_title
    FROM game_sessions s JOIN tours t ON t.id=s.tour_id ORDER BY s.updated_at DESC`).all().map(row => ({ ...hydrateSession(row), city: row.city, tourTitle: row.tour_title }));
}
export function addGameEvent(sessionId, type, payload) {
  db.prepare('INSERT INTO game_events (id,session_id,event_type,payload_json,created_at) VALUES (?,?,?,?,?)')
    .run(randomId(), sessionId, type, jsonString(payload), nowIso());
}
export function listGameEvents(sessionId) {
  return db.prepare('SELECT event_type,payload_json,created_at FROM game_events WHERE session_id=? ORDER BY created_at DESC LIMIT 100').all(sessionId)
    .map(r => ({ type: r.event_type, payload: safeJson(r.payload_json, {}), createdAt: r.created_at }));
}
export function updatePosition(session, position) {
  db.prepare('UPDATE game_sessions SET last_position_json=?,updated_at=? WHERE id=?').run(jsonString(position), nowIso(), session.id);
}
export function markHint(session, checkpointIndex) {
  const hints = new Set(session.hints);
  hints.add(checkpointIndex);
  db.prepare('UPDATE game_sessions SET hints_json=?,updated_at=? WHERE id=?').run(jsonString([...hints]), nowIso(), session.id);
  addGameEvent(session.id, 'checkpoint.hint', { checkpointIndex });
  return [...hints];
}
export function recordAnswer(session, result) {
  db.prepare(`UPDATE game_sessions SET checkpoint_index=?,score=?,wrong_answers=?,evidence_json=?,last_position_json=?,status=?,completed_at=?,updated_at=? WHERE id=?`)
    .run(result.checkpointIndex, result.score, result.wrongAnswers, jsonString(result.evidence), jsonString(result.position || session.lastPosition), result.status, result.completedAt, nowIso(), session.id);
  addGameEvent(session.id, result.correct ? 'checkpoint.completed' : 'checkpoint.wrong', result.eventPayload);
}
export function recordSidequest(session, sidequestId, points) {
  const done = new Set(session.sidequests);
  if (done.has(sidequestId)) return session;
  done.add(sidequestId);
  db.prepare('UPDATE game_sessions SET sidequests_json=?,score=score+?,updated_at=? WHERE id=?').run(jsonString([...done]), points, nowIso(), session.id);
  addGameEvent(session.id, 'sidequest.completed', { sidequestId, points });
  return getSession(session.publicId, session.accessId);
}
export function resetSession(id, adminId) {
  const row = db.prepare('SELECT * FROM game_sessions WHERE id=?').get(id);
  if (!row) return null;
  db.prepare(`UPDATE game_sessions SET status='active',checkpoint_index=0,score=0,hints_json='[]',wrong_answers=0,evidence_json='[]',sidequests_json='[]',last_position_json=NULL,started_at=?,updated_at=?,completed_at=NULL WHERE id=?`)
    .run(nowIso(), nowIso(), id);
  db.prepare('DELETE FROM game_events WHERE session_id=?').run(id);
  audit(adminId, 'session.reset', 'session', id, {});
  return getSession(row.public_id);
}

export function dashboardStats() {
  const one = (sql) => Number(db.prepare(sql).get().n || 0);
  return {
    tours: one('SELECT COUNT(*) AS n FROM tours'),
    publishedTours: one('SELECT COUNT(*) AS n FROM tours WHERE published=1'),
    activeVouchers: one("SELECT COUNT(*) AS n FROM vouchers WHERE status='active'"),
    usedVouchers: one("SELECT COUNT(*) AS n FROM vouchers WHERE status='used'"),
    activeSessions: one("SELECT COUNT(*) AS n FROM game_sessions WHERE status='active'"),
    completedSessions: one("SELECT COUNT(*) AS n FROM game_sessions WHERE status='completed'")
  };
}

export function initializeDatabase() {
  migrate();
  const seeded = seedContent();
  const admin = ensureAdmin();
  const devVoucher = ensureDevVoucher();
  return { seeded, admin, devVoucher };
}
