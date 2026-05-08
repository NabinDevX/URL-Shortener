import cluster from "cluster";
import os from "os";
import connectDB from "@/db";
import { initializeRedis } from "@/utils/redisClient";
import { app } from "@/app";
import logger from "@/utils/logger";

const totalCPUs = os.cpus().length;
const PORT: number = parseInt(process.env.PORT!, 10);
const isDevelopment = process.env.NODE_ENV !== "production";
const HOST = isDevelopment ? "localhost" : "0.0.0.0";

const getServerUrls = () => {
  if (isDevelopment) {
    return [`http://${HOST}:${PORT}`];
  }

  return [`http://localhost:${PORT}`, `http://0.0.0.0:${PORT}`];
};

const validateEnvironmentVariables = () => {
  const requiredVars = [
    "MONGODB_URI",
    "REDIS_URL",
    "USER_SECRET_ACCESS_TOKEN",
    "USER_SECRET_REFRESH_TOKEN",
  ];

  const googleVars = [
    "NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID",
    "NEXT_PUBLIC_GOOGLE_ANDROID_CLIENT_ID",
    "GOOGLE_WEB_CLIENT_SECRET",
  ];

  const missing: string[] = [];

  // Check required vars
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check Google OAuth vars (warn if missing, but don't block startup)
  const googleMissing: string[] = [];
  for (const varName of googleVars) {
    if (!process.env[varName]) {
      googleMissing.push(varName);
    }
  }

  if (googleMissing.length > 0) {
    logger.warn("Google OAuth is not fully configured", {
      missing: googleMissing,
      message:
        "Google Sign-In/Sign-Up will be unavailable. Set these environment variables to enable: " +
        googleMissing.join(", "),
    });
  }

  if (missing.length > 0) {
    logger.error("Missing required environment variables", { missing });
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
};

const gracefulShutdown = async () => {
  logger.warn("Received shutdown signal, closing gracefully...");

  setTimeout(() => {
    process.exit(0);
  }, 5000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Promise Rejection", { error: err });
  if (process.env.NODE_ENV === "production") {
    gracefulShutdown();
  }
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", { error: err });
  gracefulShutdown();
});

if (isDevelopment) {
  logger.info("Starting server in development mode (single process)");
  logger.info(`Environment: ${process.env.NODE_ENV!}`);

  const startServer = async () => {
    try {
      validateEnvironmentVariables();

      await connectDB();
      logger.info("MongoDB connected");

      try {
        await initializeRedis();
      } catch (redisErr) {
        logger.warn("Redis connection failed, continuing without cache", {
          error: (redisErr as Error).message,
        });
      }

      app.listen(PORT, HOST, () => {
        logger.info(`Server listening on port ${PORT}`, {
          host: HOST,
          urls: getServerUrls(),
        });
      });
    } catch (err) {
      logger.error("Failed to start server", { error: err });
      process.exit(1);
    }
  };

  startServer();
} else {
  if (cluster.isPrimary) {
    logger.info(`Primary process ${process.pid} is running`);
    logger.info(`Environment: ${process.env.NODE_ENV!}`);
    logger.info(`Forking ${totalCPUs > 2 ? 2 : totalCPUs} workers...`);

    const initializePrimary = async () => {
      try {
        validateEnvironmentVariables();

        await connectDB();
        logger.info("MongoDB connected in primary process");

        try {
          await initializeRedis();
        } catch (redisErr) {
          logger.warn("Redis connection failed in primary, continuing", {
            error: (redisErr as Error).message,
          });
        }
      } catch (err) {
        logger.error("MongoDB connection failed in primary", { error: err });
      }
    };

    initializePrimary().then(() => {
      for (let i = 0; i < (totalCPUs > 2 ? 2 : totalCPUs); i++) {
        cluster.fork();
      }
    });

    cluster.on("exit", (worker, code, signal) => {
      logger.warn("Worker died, restarting...", {
        workerId: worker.process.pid,
        signal: signal || code,
      });
      cluster.fork();
    });

    cluster.on("online", (worker) => {
      logger.info("Worker is online", { workerId: worker.process.pid });
    });
  } else {
    const startWorker = async () => {
      try {
        await connectDB();

        try {
          await initializeRedis();
        } catch (redisErr) {
          logger.warn(
            `Redis connection failed in worker ${process.pid}, continuing`,
            { error: (redisErr as Error).message }
          );
        }

        app.listen(PORT, HOST, () => {
          logger.info(`Worker ${process.pid} listening on port ${PORT}`, {
            host: HOST,
            urls: getServerUrls(),
          });
        });
      } catch (err) {
        logger.error(`Worker ${process.pid} failed to start`, { error: err });
        process.exit(1);
      }
    };

    startWorker();
  }
}
