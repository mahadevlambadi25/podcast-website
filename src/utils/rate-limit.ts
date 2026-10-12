/**
 * Pluggable Rate Limiter for "Unchartered — Legends & Legacies"
 * Supports Redis / Upstash REST in production and an in-memory sliding-window limiter in development.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Periodic garbage collection for in-memory store to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (now > record.resetTime) {
        memoryStore.delete(key);
      }
    }
  }, 60000); // Clean every minute
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Checks rate limit for a given identifier (IP or user token).
 * @param identifier Unique string (e.g. `nomination_${ip}`)
 * @param limit Max allowed requests within window
 * @param windowMs Window duration in milliseconds (default: 60,000ms = 1 minute)
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Upstash Redis REST HTTP API (Serverless & Edge Friendly)
  if (upstashUrl && upstashToken) {
    try {
      const windowSeconds = Math.ceil(windowMs / 1000);
      const key = `rl:${identifier}`;

      // Execute atomic INCR and conditional EXPIRE via pipeline
      const pipelineRes = await fetch(`${upstashUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, windowSeconds],
        ]),
        signal: AbortSignal.timeout(2000), // Fail-open quickly if redis unreachable
      });

      if (pipelineRes.ok) {
        const data = await pipelineRes.json();
        const currentCount = Number(data[0]?.result || 1);
        const remaining = Math.max(0, limit - currentCount);
        return {
          success: currentCount <= limit,
          remaining,
          resetTime: Date.now() + windowMs,
        };
      }
    } catch (err) {
      console.warn('Rate limiter Redis error, falling back to local memory store:', err);
    }
  }

  // 2. Local In-Memory Sliding Window Store (Development / Fallback)
  const now = Date.now();
  const record = memoryStore.get(identifier);

  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = { count: 1, resetTime: now + windowMs };
    memoryStore.set(identifier, newRecord);
    return { success: true, remaining: limit - 1, resetTime: newRecord.resetTime };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count += 1;
  return {
    success: true,
    remaining: limit - record.count,
    resetTime: record.resetTime,
  };
}
