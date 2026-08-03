import { migrate, ensureAdmin } from '../src/db.mjs';
const [email,password]=process.argv.slice(2);
if(!email||!password){console.error('Usage: npm run create-admin -- email@example.com StrongPassword');process.exit(1)}
migrate();
console.log(ensureAdmin(email,password));
