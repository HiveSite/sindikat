import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');
const repoRoot = path.resolve(appRoot, '..');
const source = path.join(appRoot, 'public', 'hunt');
const destination = path.join(repoRoot, 'public', 'hunt');

if (!fs.existsSync(source)) {
  throw new Error(`Treasure Hunt public folder nije pronađen: ${source}`);
}

fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.rmSync(destination, { recursive: true, force: true });
fs.cpSync(source, destination, { recursive: true });
console.log(`Treasure Hunt frontend kopiran u ${destination}`);
