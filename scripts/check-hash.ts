import crypto from 'crypto';
import { db } from '../src/lib/db/client';

async function main() {
  const res = await db.execute({
    sql: 'SELECT email, salt, hash FROM users WHERE email = ?',
    args: ['admin@gmail.com'],
  });

  if (res.rows.length === 0) {
    console.log('No user found.');
    return;
  }

  const user = res.rows[0];
  const salt = user.salt as string;
  const hash = user.hash as string;
  const testPw = 'mahadev@123';

  const expected = hash.replace('pbkdf2-sha256-v1:', '');
  const derived = crypto.pbkdf2Sync(testPw, salt, 600000, 32, 'sha256').toString('hex');
  console.log('Password verification test:');
  console.log('Derived matches hash:', derived === expected);
}

main().catch(console.error);
