import { initializeDatabase, seedContent } from '../src/db.mjs';
initializeDatabase();
console.log(seedContent({ force: true }));
