import { TRPCError } from "@trpc/server";
import { safeRedisOperation } from "@/utils/redisClient";
import type { IUserDocument } from "@/types";

const RATE_LIMIT_WINDOW = 60;
const MAX_REQUESTS_PER_WINDOW = 10;

const inMemoryRateLimit = new Map<string, { count: number; resetTime: number }>();

const cleanupInMemory = () => {
  const now = Date.now();
  for (const [key, value] of inMemoryRateLimit.entries()) {
    if (now > value.resetTime) {
      inMemoryRateLimit.delete(key);
    }
  }
};

const cleanupTimer = setInterval(cleanupInMemory, 60000);
cleanupTimer.unref();

export const apiKeyRateLimitMiddleware = async (
  user: IUserDocument
): Promise<void> => {
  const rateLimitKey = `ratelimit:apikey:${user._id.toString()}`;

  const redisResult = await safeRedisOperation(async (client) => {
    const multi = client.multi();

    multi.incr(rateLimitKey);
    multi.ttl(rateLimitKey);

    const results = await multi.exec();

    if (!results) {
      throw new Error("Redis transaction failed");
    }

    const count = results[0] as unknown as number;
    const ttl = results[1] as unknown as number;

    if (ttl === -1) {
      await client.expire(rateLimitKey, RATE_LIMIT_WINDOW);
    }

    return { count, ttl: ttl === -1 ? RATE_LIMIT_WINDOW : ttl };
  });

  if (redisResult) {
    if (redisResult.count > MAX_REQUESTS_PER_WINDOW) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. You can make ${MAX_REQUESTS_PER_WINDOW} requests per minute. Try again in ${redisResult.ttl} seconds.`,
      });
    }
    return;
  }

  const now = Date.now();
  const userId = user._id.toString();
  const existing = inMemoryRateLimit.get(userId);

  if (!existing || now > existing.resetTime) {
    inMemoryRateLimit.set(userId, {
      count: 1,
      resetTime: now + (RATE_LIMIT_WINDOW * 1000),
    });
    return;
  }

  existing.count++;

  if (existing.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((existing.resetTime - now) / 1000);
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. You can make ${MAX_REQUESTS_PER_WINDOW} requests per minute. Try again in ${retryAfter} seconds.`,
    });
  }
};

export const resetRateLimit = async (userId: string): Promise<void> => {
  await safeRedisOperation(async (client) => {
    await client.del(`ratelimit:apikey:${userId}`);
  });

  inMemoryRateLimit.delete(userId);
};

export const getRateLimitInfo = async (
  userId: string
): Promise<{ remaining: number; resetIn: number }> => {
  const rateLimitKey = `ratelimit:apikey:${userId}`;

  const redisResult = await safeRedisOperation(async (client) => {
    const [countStr, ttl] = await Promise.all([
      client.get(rateLimitKey),
      client.ttl(rateLimitKey),
    ]);

    const count = countStr ? parseInt(countStr, 10) : 0;
    return { count, ttl: ttl > 0 ? ttl : RATE_LIMIT_WINDOW };
  });

  if (redisResult) {
    return {
      remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - redisResult.count),
      resetIn: redisResult.ttl,
    };
  }

  const existing = inMemoryRateLimit.get(userId);
  if (!existing) {
    return { remaining: MAX_REQUESTS_PER_WINDOW, resetIn: RATE_LIMIT_WINDOW };
  }

  const now = Date.now();
  if (now > existing.resetTime) {
    return { remaining: MAX_REQUESTS_PER_WINDOW, resetIn: RATE_LIMIT_WINDOW };
  }

  return {
    remaining: Math.max(0, MAX_REQUESTS_PER_WINDOW - existing.count),
    resetIn: Math.ceil((existing.resetTime - now) / 1000),
  };
};

export { MAX_REQUESTS_PER_WINDOW, RATE_LIMIT_WINDOW };
