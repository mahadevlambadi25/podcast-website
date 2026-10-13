import { db } from '../src/lib/db/client';

async function main() {
  console.log('=== POSTGRESQL DATABASE AUDIT ===\n');

  // List all tables in public schema
  const tablesRes = await db.execute(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);

  const tables = tablesRes.rows.map((r: any) => r.table_name as string);
  console.log(`Found ${tables.length} tables in PostgreSQL database:\n`);

  for (const table of tables) {
    const countRes = await db.execute(`SELECT COUNT(*) as cnt FROM "${table}"`);
    const count = countRes.rows[0]?.cnt;

    // Get column details
    const colsRes = await db.execute({
      sql: `
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ?
        ORDER BY ordinal_position;
      `,
      args: [table],
    });

    const cols = colsRes.rows
      .map((c: any) => `${c.column_name} (${c.data_type})`)
      .join(', ');

    console.log(`- ${table}: ${count} rows`);
    console.log(`  Columns: ${cols}\n`);
  }
}

main().catch(console.error);
