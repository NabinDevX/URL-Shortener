import { createClient, RedisClientType } from "redis";
import type { RedisOperation } from "@/types";

let redisClient: RedisClientType | null = null;
let connectionPromise: Promise<RedisClientType> | null = null;
let connectionFailed = false;
let lastErrorLog = 0;
const isTestEnv = process.env.NODE_ENV === "test";
const defaultRedisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redisConnectTimeoutMs = 1000;

const logInfo = (...args: unknown[]) => {
  if (!isTestEnv) {
    console.log(...args);
  }
};

const logError = (...args: unknown[]) => {
  if (!isTestEnv) {
    console.error(...args);
  }
};

const initializeRedis = async (): Promise<RedisClientType> => {
  if (connectionPromise) {
    return connectionPromise;
  }

  if (connectionFailed) {
    throw new Error("Redis connection previously failed");
  }

  connectionPromise = (async (): Promise<RedisClientType> => {
    try {
      const redisUrl = process.env.REDIS_URL?.trim() || defaultRedisUrl;

      logInfo("🔗 Connecting to Redis...");

      redisClient = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 1000,
          reconnectStrategy: () => false,
        },
      });

      redisClient.on("error", (err: Error) => {
        const now = Date.now();
        if (now - lastErrorLog > 10000) {
          logError("Redis Client Error:", err.message);
          lastErrorLog = now;
        }
      });

      redisClient.on("connect", () => {
        logInfo("✅ Redis connected successfully");
      });

      await Promise.race([
        redisClient.connect(),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error("Redis connection timeout"));
          }, redisConnectTimeoutMs);
        }),
      ]);

      return redisClient;
    } catch (error) {
      const err = error as Error;

      const destroyableClient = redisClient as unknown as {
        destroy?: () => void;
      } | null;
      destroyableClient?.destroy?.();
      redisClient = null;

      logError("❌ Failed to connect to Redis:", err.message);
      connectionPromise = null;
      connectionFailed = true;
      throw error;
    }
  })();

  return connectionPromise;
};

const getRedisClient = async (): Promise<RedisClientType | null> => {
  if (connectionFailed) {
    return null;
  }

  if (!redisClient || !redisClient.isOpen) {
    try {
      await initializeRedis();
    } catch {
      return null;
    }
  }
  return redisClient;
};

const safeRedisOperation = async <T>(
  operation: RedisOperation<T>
): Promise<T | null> => {
  try {
    const client = await getRedisClient();
    if (!client || !client.isOpen) {
      return null;
    }
    return await operation(client);
  } catch (error) {
    const err = error as Error;
    const now = Date.now();
    if (now - lastErrorLog > 10000) {
      logError("Redis operation failed:", err.message);
      lastErrorLog = now;
    }
    return null;
  }
};

const closeRedisClient = async (): Promise<void> => {
  connectionPromise = null;
  connectionFailed = false;

  if (redisClient?.isOpen) {
    await redisClient.quit();
  }

  redisClient = null;
};

export {
  initializeRedis,
  getRedisClient,
  safeRedisOperation,
  closeRedisClient,
};
export default redisClient;
