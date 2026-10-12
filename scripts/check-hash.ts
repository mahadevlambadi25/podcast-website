import crypto from 'crypto';
import { createClient } from '@libsql/client';

async function main() {
  const client = createClient({ url: 'file:payload.db' });
  const res = await client.execute({
    sql: 'SELECT email, salt, hash FROM users WHERE email = ?',
    args: ['admin@gmail.com'],
  });

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
