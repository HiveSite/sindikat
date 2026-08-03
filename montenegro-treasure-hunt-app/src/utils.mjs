import crypto from 'node:crypto';

export const nowIso = () => new Date().toISOString();
export const addHoursIso = (hours) => new Date(Date.now() + hours * 3600_000).toISOString();
export const addDaysIso = (days) => new Date(Date.now() + days * 86_400_000).toISOString();
export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');
export const randomId = () => crypto.randomUUID();
export const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
export const hashToken = (value, pepper) => sha256(`${pepper}:${value}`);
export const safeJson = (value, fallback = null) => {
  try { return JSON.parse(value); } catch { return fallback; }
};
export const jsonString = (value) => JSON.stringify(value ?? null);
export const normalizeAnswer = (value) => String(value ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function passwordHash(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash: derived };
}
export function verifyPassword(password, salt, expected) {
  const actual = crypto.scryptSync(password, salt, 64);
  const target = Buffer.from(expected, 'hex');
  return target.length === actual.length && crypto.timingSafeEqual(actual, target);
}
export function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const key = decodeURIComponent(part.slice(0, i).trim());
    const value = decodeURIComponent(part.slice(i + 1).trim());
    out[key] = value;
  }
  return out;
}
export function cookie(name, value, options = {}) {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];
  parts.push(`Path=${options.path || '/'}`);
  if (options.httpOnly !== false) parts.push('HttpOnly');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.secure) parts.push('Secure');
  if (options.maxAge != null) parts.push(`Max-Age=${options.maxAge}`);
  if (options.expires) parts.push(`Expires=${new Date(options.expires).toUTCString()}`);
  return parts.join('; ');
}
export function haversine(a, b) {
  const R = 6371000;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const q = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(q));
}
export function makeVoucherCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const block = () => Array.from({ length: 4 }, () => chars[crypto.randomInt(chars.length)]).join('');
  return `MTH-${block()}-${block()}`;
}
export function codeHint(code) {
  const parts = code.split('-');
  return parts.length >= 3 ? `${parts[0]}-••••-${parts.at(-1)}` : `••••${code.slice(-4)}`;
}
export function publicTour(tourRow) {
  const meta = safeJson(tourRow.meta_json, {});
  const content = safeJson(tourRow.content_json, {});
  return {
    ...meta,
    id: tourRow.id,
    slug: tourRow.slug,
    published: Boolean(tourRow.published),
    updatedAt: tourRow.updated_at,
    case: content
  };
}
