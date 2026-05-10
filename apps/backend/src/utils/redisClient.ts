import { createClient } from "redis";
import type { RedisOperation } from "@/types";

type RedisClientInstance = ReturnType<typeof createClient>;

let redisClient: RedisClientInstance | null = null;
let connectionPromise: Promise<RedisClientInstance> | null = null;
let lastErrorLog = 0;
const defaultRedisUrl = process.env.REDIS_URL!;
const redisConnectTimeoutMs = 5000;
const transientRedisErrorPatterns = [
  /ECONNRESET/i,
  /ECONNREFUSED/i,
  /ETIMEDOUT/i,
  /EPIPE/i,
  /The client is closed/i,
  /Socket closed unexpectedly/i,
];

const isTransientRedisError = (message: string): boolean =>
  transientRedisErrorPatterns.some((pattern) => pattern.test(message));

const isTestEnv = (): boolean =>
  typeof process.env.JEST_WORKER_ID !== "undefined";

const shouldBypassRedisInTests = (): boolean => isTestEnv();

const logInfo = (...args: unknown[]) => {
  if (!isTestEnv()) {
    console.log(...args);
  }
};

const logError = (...args: unknown[]) => {
  if (!isTestEnv()) {
    console.error(...args);
  }
};

const initializeRedis = async (): Promise<RedisClientInstance> => {
  if (redisClient?.isReady) {
    return redisClient;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async (): Promise<RedisClientInstance> => {
    try {
      const redisUrl = process.env.REDIS_URL?.trim() || defaultRedisUrl;

      logInfo("🔗 Connecting to Redis...");

      const client: RedisClientInstance = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: redisConnectTimeoutMs,
          reconnectStrategy: (retries: number) =>
            Math.min(250 * 2 ** retries, 5000),
        },
      });

      redisClient = client;

      client.on("error", (err: Error) => {
        if (isTransientRedisError(err.message)) {
          return;
        }

        const now = Date.now();
        if (now - lastErrorLog > 10000) {
          logError("Redis Client Error:", err.message);
          lastErrorLog = now;
        }
      });

      client.on("ready", () => {
        logInfo("✅ Redis connected successfully");
      });

      client.on("end", () => {
        if (redisClient === client) {
          redisClient = null;
        }
        if (connectionPromise) {
          connectionPromise = null;
        }
      });

      await Promise.race([
        client.connect(),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error("Redis connection timeout"));
          }, redisConnectTimeoutMs);
        }),
      ]);

      connectionPromise = null;
      return client;
    } catch (error) {
      const err = error as Error;

      const destroyableClient = redisClient as unknown as {
        destroy?: () => void;
        quit?: () => Promise<void>;
      } | null;
      try {
        await destroyableClient?.quit?.();
      } catch {
        destroyableClient?.destroy?.();
      }
      redisClient = null;

      connectionPromise = null;
      if (!isTransientRedisError(err.message)) {
        logError("❌ Failed to connect to Redis:", err.message);
      }
      throw error;
    }
  })();

  return connectionPromise;
};

const getRedisClient = async (): Promise<RedisClientInstance | null> => {
  if (shouldBypassRedisInTests()) {
    return null;
  }

  if (redisClient?.isReady) {
    return redisClient;
  }

  if (!redisClient) {
    try {
      await initializeRedis();
    } catch {
      return null;
    }
  }

  if (redisClient?.isReady) {
    return redisClient;
  }

  if (connectionPromise) {
    try {
      await connectionPromise;
    } catch {
      return null;
    }
  }

  if (redisClient?.isReady) {
    return redisClient;
  }

  if (redisClient) {
    return null;
  }

  try {
    await initializeRedis();
  } catch {
    return null;
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
    return await operation(client as never);
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
