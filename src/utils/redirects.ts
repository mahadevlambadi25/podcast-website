// Database redirect utilities
import { db } from '@/lib/db/client';

/**
 * Pure function to collapse a list of redirects and eliminate intermediate hops and cycles.
 * Example: A -> B and B -> C becomes A -> C and B -> C.
 * Example: A -> B and B -> A detects cycle and collapses safely without infinite loop.
 */
export function collapseRedirectMap(
  redirects: Array<{ from: string; to: string }>
): Array<{ from: string; to: string }> {
  const lookup = new Map<string, string>();

  for (const r of redirects) {
    if (r.from && r.to && r.from !== r.to) {
      lookup.set(r.from, r.to);
    }
  }

  const collapsed: Array<{ from: string; to: string }> = [];

  for (const [startFrom, initialTo] of lookup.entries()) {
    let current = initialTo;
    const seen = new Set<string>([startFrom]);

    while (lookup.has(current)) {
      if (seen.has(current)) {
        // Loop detected: break to prevent cycle
        break;
      }
      seen.add(current);
      current = lookup.get(current)!;
    }

    if (startFrom !== current) {
      collapsed.push({ from: startFrom, to: current });
    }
  }

  return collapsed;
}

/**
 * Database-backed redirect handler for slug change events.
 * Automatically collapses chains and removes loops when slugs change.
 */
export async function handleSlugRedirect(
  oldPath: string,
  newPath: string
): Promise<void> {
  if (!oldPath || !newPath || oldPath === newPath) return;

  try {
    const now = new Date().toISOString();

    // 1. Break loops: Remove any reverse redirect pointing newPath -> oldPath
    await db.execute({
      sql: 'DELETE FROM redirects WHERE "from" = ? AND "to" = ?',
      args: [newPath, oldPath],
    });

    // 2. Collapse incoming chains:
    // Any redirect where `to === oldPath` should now point directly to `newPath`
    await db.execute({
      sql: 'UPDATE redirects SET "to" = ?, updated_at = ? WHERE "to" = ? AND "from" != ?',
      args: [newPath, now, oldPath, newPath],
    });

    // Delete any self-referencing redirect that may have been created
    await db.execute({
      sql: 'DELETE FROM redirects WHERE "from" = "to"',
    });

    // 3. Upsert direct redirect from oldPath -> newPath
    const existing = await db.execute({
      sql: 'SELECT id FROM redirects WHERE "from" = ? LIMIT 1',
      args: [oldPath],
    });

    if (existing.rows.length > 0) {
      await db.execute({
        sql: 'UPDATE redirects SET "to" = ?, "type" = ?, updated_at = ? WHERE id = ?',
        args: [newPath, '301', now, existing.rows[0].id],
      });
    } else {
      await db.execute({
        sql: 'INSERT INTO redirects ("from", "to", "type", created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        args: [oldPath, newPath, '301', now, now],
      });
    }
  } catch (err) {
    console.error('Failed to collapse/upsert redirect:', err);
  }
}
