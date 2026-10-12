import { createClient } from '@libsql/client';
import * as path from 'path';

async function main() {
  const dbPath = path.resolve('payload.db');
  const client = createClient({
    url: `file:${dbPath}`,
  });

  console.log('=== SQLITE DATABASE AUDIT (payload.db) ===\n');

  // List all tables
  const tablesRes = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
  );

  const tables = tablesRes.rows.map((r) => r.name as string);
  console.log(`Found ${tables.length} tables in payload.db:\n`);

  for (const table of tables) {
    const countRes = await client.execute(`SELECT COUNT(*) as cnt FROM "${table}"`);
    const count = countRes.rows[0].cnt;

    // Get column details
    const colsRes = await client.execute(`PRAGMA table_info("${table}")`);
    const cols = colsRes.rows.map((c) => `${c.name} (${c.type})`).join(', ');

    console.log(`- ${table}: ${count} rows`);
    console.log(`  Columns: ${cols}\n`);
  }
}

main().catch(console.error);
