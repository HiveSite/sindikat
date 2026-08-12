import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';
import huntEventHandler from './hunt-event.mts';

const AUTH_STORE = 'montenegro-treasure-hunt';
const DEFAULT_TOKEN_PEPPER = 'mth-sindikat-treasure-hunt-2026-prod-stable-pepper-v1';
const ADMIN_PASSWORD_HASH = '9552929bc70074eb42eeb96f7410edc32f02b4b16a197ff577f79142f23c4740';

const sha256 = value => crypto.createHash('sha256').update(String(value)).digest('hex');

function json(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

function validPassword(request) {
  const password = request.headers.get('x-mth-admin-password') || '';
  const incoming = sha256(password);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(incoming, 'hex'),
      Buffer.from(ADMIN_PASSWORD_HASH, 'hex')
    );
  } catch {
    return false;
  }
}

function adminSuffix(pathname) {
  return pathname
    .replace(/^\/\.netlify\/functions\/hunt-admin-bridge\/?/, '')
    .replace(/^\/hunt\/team-api\/admin\/?/, '')
    .replace(/^\/+/, '');
}

export default async function handler(request) {
  if (!validPassword(request)) {
    return json(401, { error: 'Pogrešna admin lozinka.' });
  }

  const suffix = adminSuffix(new URL(request.url).pathname);
  const pepper = process.env.MTH_TOKEN_PEPPER || process.env.TOKEN_PEPPER || DEFAULT_TOKEN_PEPPER;
  const raw = crypto.randomBytes(32).toString('base64url');
  const hash = sha256(`${pepper}:${raw}`);
  const auth = getStore(AUTH_STORE, { consistency: 'strong' });
  const sessionKey = `admin-session/${hash}`;

  await auth.setJSON(sessionKey, {
    email: 'password-admin',
    role: 'admin',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60_000).toISOString()
  });

  try {
    const sourceUrl = new URL(request.url);
    sourceUrl.pathname = `/.netlify/functions/hunt-event/admin/${suffix}`;

    const headers = new Headers(request.headers);
    headers.delete('x-mth-admin-password');
    headers.set('cookie', `mth_admin=${encodeURIComponent(raw)}`);

    const hasBody = !['GET', 'HEAD'].includes(request.method);
    const body = hasBody ? await request.arrayBuffer() : undefined;
    const proxied = new Request(sourceUrl, {
      method: request.method,
      headers,
      body
    });

    return await huntEventHandler(proxied);
  } finally {
    await auth.delete(sessionKey).catch(() => {});
  }
}
