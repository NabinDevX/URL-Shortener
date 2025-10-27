import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import cluster from "cluster";
import os from "os";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import discordClient from "./utils/discordClient.js";

const totalCPUs = os.cpus().length;
const PORT = process.env.PORT || 8000;

// Graceful shutdown handling
const gracefulShutdown = async () => {
  console.log("🛑 Received shutdown signal, closing gracefully...");

  // Close Discord client (only in primary or single-process mode)
  if (discordClient && (cluster.isPrimary || !cluster.isPrimary)) {
    try {
      await discordClient.shutdown();
      console.log("✅ Discord client closed");
    } catch (error) {
      console.error("❌ Error closing Discord client:", error);
    }
  }

  // Give workers time to finish
  setTimeout(() => {
    process.exit(0);
  }, 5000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  if (process.env.NODE_ENV === "production") {
    gracefulShutdown();
  }
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  gracefulShutdown();
});

// ✅ PRIMARY PROCESS - Initialize Discord Bot ONLY HERE
if (cluster.isPrimary) {
  console.log(`🚀 Primary process ${process.pid} is running`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`💻 Forking ${totalCPUs} workers...`);

  // Initialize Discord bot in primary process only
  if (process.env.DISCORD_TOKEN) {
    connectDB()
      .then(async () => {
        try {
          await discordClient.initialize();
          console.log("✅ Discord bot initialized in primary process");
        } catch (error) {
          console.error("❌ Discord bot failed to initialize:", error.message);
          if (process.env.NODE_ENV !== "production") {
            console.log("⚠️ Continuing without Discord bot...");
          }
        }
      })
      .catch((err) => {
        console.error("❌ MongoDB connection failed in primary:", err);
      });
  }

  // Fork workers
  for (let i = 0; i < totalCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`⚠️ Worker ${worker.process.pid} died (${signal || code}). Restarting...`);
    cluster.fork();
  });

  cluster.on("online", (worker) => {
    console.log(`✅ Worker ${worker.process.pid} is online`);
  });

} else {
  // ✅ WORKER PROCESS - Handle HTTP requests ONLY
  connectDB()
    .then(() => {
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`⚙️ Worker ${process.pid} listening on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error(`❌ Worker ${process.pid} MongoDB connection failed:`, err);
      process.exit(1);
    });
}
