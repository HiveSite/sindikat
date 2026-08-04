import crypto from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { createApi, normalizeApiPath } from './_hunt/core.mjs';

const STORE_NAME = 'montenegro-treasure-hunt';

function envValue(key: string): string {
  try {
    const netlifyValue = globalThis.Netlify?.env?.get?.(key);
    if (netlifyValue) return String(netlifyValue);
  } catch {}
  return String(process.env[key] || '');
}

function runtimeEnvironment() {
  const testVoucherEnabled = envValue('MTH_ENABLE_TEST_VOUCHER').toLowerCase() === 'true';
  return {
    ...process.env,
    MTH_ENABLE_TEST_VOUCHER: testVoucherEnabled ? 'true' : 'false',
    MTH_ADMIN_EMAIL: envValue('MTH_ADMIN_EMAIL'),
    MTH_TOKEN_PEPPER:
      envValue('MTH_TOKEN_SECRET') ||
      envValue('MTH_TOKEN_PEPPER') ||
      (testVoucherEnabled ? 'mth-test-runtime-key-2026-stable-player-access' : ''),
    MTH_ADMIN_PASSWORD:
      envValue('MTH_ADMIN_KEY') ||
      envValue('MTH_ADMIN_PASSWORD') ||
      (testVoucherEnabled ? crypto.randomBytes(32).toString('hex') : ''),
    MTH_INTEGRATION_API_KEY:
      envValue('MTH_INTEGRATION_API_KEY') || envValue('INTEGRATION_API_KEY'),
    URL: envValue('URL') || 'https://sindikatevents.me',
    CONTEXT: envValue('CONTEXT') || 'production'
  };
}

function createStoreAdapter() {
  const blob = getStore(STORE_NAME, { consistency: 'strong' });
  return {
    async get(key: string) {
      return await blob.get(key, { type: 'json' });
    },
    async set(key: string, value: unknown) {
      await blob.setJSON(key, value);
    },
    async delete(key: string) {
      await blob.delete(key);
    },
    async list(prefix: string) {
      const { blobs = [] } = await blob.list({ prefix });
      return blobs.map((item) => item.key);
    }
  };
}

function jsonResponse(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

export default async function handler(request: Request) {
  const runtimeEnv = runtimeEnvironment();

  try {
    let body: Record<string, unknown> = {};
    if (!['GET', 'HEAD'].includes(request.method)) {
      const raw = await request.text();
      if (raw) {
        try {
          body = JSON.parse(raw);
        } catch {
          return jsonResponse(400, { error: 'Neispravan JSON.' });
        }
      }
    }

    const path = normalizeApiPath(new URL(request.url).pathname);
    const store = createStoreAdapter();
    const api = createApi({ store, env: runtimeEnv });
    const result = await api({
      method: request.method,
      path,
      headers: Object.fromEntries(request.headers.entries()),
      body
    });

    if (path === '/api/health' && result.statusCode === 200) {
      const probeKey = 'system/health-probe';
      const probeValue = { ok: true, checkedAt: new Date().toISOString() };
      await store.set(probeKey, probeValue);
      const stored = await store.get(probeKey);
      const health = JSON.parse(result.body || '{}');
      return jsonResponse(200, {
        ...health,
        runtime: 'netlify-functions-v2',
        storageReady: Boolean(stored?.ok),
        adminConfigured: Boolean(runtimeEnv.MTH_ADMIN_EMAIL && runtimeEnv.MTH_ADMIN_PASSWORD)
      });
    }

    return new Response(result.body, {
      status: result.statusCode,
      headers: result.headers || {
        'content-type': 'application/json; charset=utf-8'
      }
    });
  } catch (error) {
    console.error('hunt-api-v2 fatal error', error);
    return jsonResponse(500, {
      error: 'Treasure Hunt server trenutno nije dostupan.',
      details:
        runtimeEnv.CONTEXT === 'production'
          ? undefined
          : String((error as Error)?.message || error)
    });
  }
}
