import { redis } from "../config/redis.js";

type Loader<T> = () => Promise<T>;

class CacheService {
  static async getJson<T>(key: string): Promise<T | undefined> {
    try {
      const raw = await redis.get(key);
      if (raw === null) return undefined;
      return JSON.parse(raw) as T;
    } catch {
      // cache miss on error so callers fall back to the database
      return undefined;
    }
  }

  static async setJson(key: string, value: unknown, ttlSeconds: number) {
    try {
      await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      // cache write failures are non-fatal
    }
  }

  static async del(...keys: string[]) {
    if (keys.length === 0) return;
    try {
      await redis.del(...keys);
    } catch {
      // stale entries expire via ttl anyway
    }
  }

  static async cached<T>(
    key: string,
    ttlSeconds: number,
    loader: Loader<T>,
  ): Promise<T> {
    const hit = await this.getJson<T>(key);
    if (hit !== undefined) return hit;

    const value = await loader();
    await this.setJson(key, value ?? null, ttlSeconds);
    return value;
  }

  static async setHas(key: string, member: string): Promise<boolean | null> {
    try {
      const exists = await redis.exists(key);
      if (!exists) return null;
      return (await redis.sismember(key, member)) === 1;
    } catch {
      return null;
    }
  }

  static async hydrateSet(
    key: string,
    members: string[],
    ttlSeconds: number,
  ): Promise<void> {
    if (members.length === 0) return;
    try {
      const pipeline = redis.pipeline();
      pipeline.del(key);
      pipeline.sadd(key, ...members);
      pipeline.expire(key, ttlSeconds);
      await pipeline.exec();
    } catch {
      // non-fatal
    }
  }

}

export default CacheService;
