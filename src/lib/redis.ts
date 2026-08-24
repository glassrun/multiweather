import Redis from "ioredis";
import { env } from "@/lib/env";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

// Constructed lazily so importing this module (e.g. during `next build`'s
// page-data collection) doesn't require REDIS_URL to be set - see env.ts.
function getClient(): Redis {
  if (!globalForRedis.redis) {
    globalForRedis.redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });
  }
  return globalForRedis.redis;
}

export async function pingRedis(): Promise<void> {
  await getClient().ping();
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const raw = await getClient().get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function setCached(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await getClient().set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // Cache is a best-effort optimization; a Redis outage should not break weather lookups.
  }
}
