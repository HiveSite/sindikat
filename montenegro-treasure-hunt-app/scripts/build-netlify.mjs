import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');
const repoRoot = path.resolve(appRoot, '..');
const dist = path.join(repoRoot, 'dist');

const excluded = new Set([
  '.git', '.github', '.netlify', 'node_modules', 'dist',
  'montenegro-treasure-hunt-app', 'types', 'scripts', 'terrain-app',
  'package.json', 'package-lock.json', 'netlify.toml', '_redirects',
  'middleware.ts', 'README.md', '.gitignore', 'TREASURE-HUNT-UBACI.txt'
]);

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const entry of fs.readdirSync(repoRoot, { withFileTypes: true })) {
  if (excluded.has(entry.name)) continue;
  const source = path.join(repoRoot, entry.name);
  const destination = path.join(dist, entry.name);
  fs.cpSync(source, destination, { recursive: true });
}

const huntSource = path.join(appRoot, 'public', 'hunt');
const huntDestination = path.join(dist, 'hunt');
if (!fs.existsSync(path.join(huntSource, 'index.html'))) {
  throw new Error('Treasure Hunt frontend nije pronađen.');
}
fs.cpSync(huntSource, huntDestination, { recursive: true });

const terrainPublic = path.join(repoRoot, 'terrain-app', 'public');
if (fs.existsSync(terrainPublic)) {
  fs.cpSync(terrainPublic, path.join(dist, 'terrain-app'), { recursive: true });
}

const required = [
  'index.html',
  'hunt/index.html',
  'hunt/app.js',
  'hunt/styles.css',
  'hunt/admin.html',
  'hunt/admin.js',
  'hunt/manifest.webmanifest'
];
for (const relative of required) {
  if (!fs.existsSync(path.join(dist, relative))) {
    throw new Error(`Nedostaje build fajl: ${relative}`);
  }
}

console.log(`Netlify static build završen: ${dist}`);
