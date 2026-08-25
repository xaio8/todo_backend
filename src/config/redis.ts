import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// url from env
const url = isProduction
  ? process.env.REDIS_URL
  : process.env.LOCAL_REDIS_URL ?? process.env.REDIS_URL;

if (!url) {
  throw new Error(
    `Missing Redis URL for ${process.env.NODE_ENV ?? "development"} environment.`,
  );
}

export const redis = new Redis(url, {
  // never queue commands while disconnected - fail fast so callers can fall back to the database
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

redis.on("connect", () => {
  console.log("Successfully connected to Redis!");
});

let lastErrorLogAt = 0;

redis.on("error", (error: Error) => {
  // avoid log spam from reconnection attempts - log at most once per 10s
  const now = Date.now();
  if (now - lastErrorLogAt < 10_000) return;
  lastErrorLogAt = now;
  console.error("❌ Redis error:", error.message);
});

export const checkRedisConnection = async () => {
  // retry briefly - docker/remote proxies can take a moment to accept the connection
  const maxAttempts = 10;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await redis.ping();
      return;
    } catch {
      if (attempt === maxAttempts) {
        // redis is a cache, not a hard dependency - keep serving from postgres
        console.warn(
          "⚠️ Redis unavailable, falling back to database only:",
          redis.status,
        );
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
};
