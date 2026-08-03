import fs from 'node:fs';
import path from 'node:path';

function loadEnvFile(file = path.resolve('.env')) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i < 1) continue;
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
loadEnvFile();

const isProd = process.env.NODE_ENV === 'production';
const bool = (value, fallback = false) => value == null ? fallback : /^(1|true|yes|on)$/i.test(value);
const int = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;

export const config = Object.freeze({
  isProd,
  port: int(process.env.PORT, 3000),
  host: process.env.HOST || '0.0.0.0',
  databaseFile: path.resolve(process.env.DATABASE_FILE || './data/mth.sqlite'),
  appOrigin: process.env.APP_ORIGIN || 'http://localhost:3000',
  tokenPepper: process.env.TOKEN_PEPPER || (isProd ? '' : 'dev-only-change-me'),
  adminEmail: process.env.ADMIN_EMAIL || (isProd ? '' : 'admin@mth.local'),
  adminPassword: process.env.ADMIN_PASSWORD || (isProd ? '' : 'MTH-Admin-2026!'),
  integrationApiKey: process.env.INTEGRATION_API_KEY || '',
  enableDevTestVoucher: bool(process.env.ENABLE_DEV_TEST_VOUCHER, !isProd),
  adminSessionHours: int(process.env.SESSION_HOURS, 12),
  playerAccessDays: int(process.env.PLAYER_ACCESS_DAYS, 30),
  maxBodyBytes: 1_000_000
});

export function validateProductionConfig() {
  const missing = [];
  if (!config.tokenPepper || config.tokenPepper.length < 24) missing.push('TOKEN_PEPPER (minimum 24 characters)');
  if (!config.adminEmail) missing.push('ADMIN_EMAIL');
  if (!config.adminPassword || config.adminPassword.length < 12) missing.push('ADMIN_PASSWORD (minimum 12 characters)');
  if (config.isProd && missing.length) throw new Error(`Missing production configuration: ${missing.join(', ')}`);
}
