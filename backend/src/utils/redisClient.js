import { createClient } from "redis";

let redisClient = null;
let connectionPromise = null;

const initializeRedis = async () => {
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      const redisUrl = process.env.REDIS_URL;

      console.log("🔗 Connecting to Redis...");
      console.log(
        "Using URL:",
        process.env.REDIS_URL ? "from environment" : "fallback hardcoded"
      );

      redisClient = createClient({
        url: redisUrl,
      });

      redisClient.on("error", (err) => {
        console.error("Redis Client Error:", err.message);
      });

      redisClient.on("connect", () => {
        console.log("✅ Redis connected successfully");
      });

      await redisClient.connect();
      return redisClient;
    } catch (error) {
      console.error("❌ Failed to connect to Redis:", error.message);
      connectionPromise = null; // Reset so we can try again
      throw error;
    }
  })();

  return connectionPromise;
};

const getRedisClient = async () => {
  if (!redisClient || !redisClient.isOpen) {
    await initializeRedis();
  }
  return redisClient;
};

const safeRedisOperation = async (operation) => {
  try {
    const client = await getRedisClient();
    if (!client || !client.isOpen) {
      console.log("⚠️ Redis not available, skipping operation");
      return null;
    }
    return await operation(client);
  } catch (error) {
    console.error("Redis operation failed:", error.message);
    return null;
  }
};

export { initializeRedis, getRedisClient, safeRedisOperation };
export default redisClient;
