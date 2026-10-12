// Database redirect utilities

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
 * Database-backed redirect handler for Payload CMS afterChange hooks.
 * Automatically collapses chains and removes loops when slugs change.
 */
export async function handleSlugRedirect(
  payload: any,
  oldPath: string,
  newPath: string
): Promise<void> {
  if (!oldPath || !newPath || oldPath === newPath) return;

  try {
    // 1. Break loops: Remove any reverse redirect pointing newPath -> oldPath
    const existingReverse = await payload.find({
      collection: 'redirects',
      where: {
        and: [
          { from: { equals: newPath } },
          { to: { equals: oldPath } },
        ],
      },
      limit: 10,
    });

    for (const rev of existingReverse.docs) {
      await payload.delete({
        collection: 'redirects',
        id: rev.id,
      });
    }

    // 2. Collapse incoming chains:
    // Any redirect where `to === oldPath` should now point directly to `newPath`
    const incomingChains = await payload.find({
      collection: 'redirects',
      where: { to: { equals: oldPath } },
      limit: 50,
    });

    for (const chain of incomingChains.docs) {
      if (chain.from !== newPath) {
        await payload.update({
          collection: 'redirects',
          id: chain.id,
          data: { to: newPath },
        });
      } else {
        await payload.delete({
          collection: 'redirects',
          id: chain.id,
        });
      }
    }

    // 3. Upsert direct redirect from oldPath -> newPath
    const existing = await payload.find({
      collection: 'redirects',
      where: { from: { equals: oldPath } },
      limit: 1,
    });

    if (existing.totalDocs > 0) {
      await payload.update({
        collection: 'redirects',
        id: existing.docs[0].id,
        data: {
          to: newPath,
          type: '301',
        },
      });
    } else {
      await payload.create({
        collection: 'redirects',
        data: {
          from: oldPath,
          to: newPath,
          type: '301',
        },
      });
    }
  } catch (err) {
    console.error('Failed to collapse/upsert redirect in Payload CMS:', err);
  }
}
