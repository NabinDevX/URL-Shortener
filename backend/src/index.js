import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import cluster from "cluster";
import os from "os";
import connectDB from "./db/index.js";
import { app } from "./app.js";

const totalCPUs = os.cpus().length;
const PORT = process.env.PORT || 8000;

const gracefulShutdown = async () => {
  console.log("🛑 Received shutdown signal, closing gracefully...");

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

if (cluster.isPrimary) {
  console.log(`🚀 Primary process ${process.pid} is running`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`💻 Forking ${totalCPUs} workers...`);

  connectDB()
    .then(() => {
      console.log("✅ MongoDB connected in primary process");
    })
    .catch((err) => {
      console.error("❌ MongoDB connection failed in primary:", err);
    });

  for (let i = 0; i < totalCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(
      `⚠️ Worker ${worker.process.pid} died (${signal || code}). Restarting...`
    );
    cluster.fork();
  });

  cluster.on("online", (worker) => {
    console.log(`✅ Worker ${worker.process.pid} is online`);
  });
} else {
  // ✅ WORKER PROCESS - Handle HTTP requests
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
