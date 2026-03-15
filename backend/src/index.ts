import cluster from "cluster";
import os from "os";
import connectDB from "@/db";
import { app } from "@/app";

const totalCPUs = os.cpus().length;
const PORT: number = parseInt(process.env.PORT!, 10);
const isDevelopment = process.env.NODE_ENV !== "production";

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

if (isDevelopment) {
  console.log(`🚀 Starting server in development mode (single process)`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV!}`);

  connectDB()
    .then(() => {
      console.log("✅ MongoDB connected");
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`⚙️ Server listening on port ${PORT}`);
        console.log(`📍 URL: http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("❌ MongoDB connection failed:", err);
      process.exit(1);
    });
} else {
  if (cluster.isPrimary) {
    console.log(`🚀 Primary process ${process.pid} is running`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV!}`);
    console.log(`💻 Forking ${totalCPUs} workers...`);

    connectDB()
      .then(() => {
        console.log("✅ MongoDB connected in primary process");
      })
      .catch((err) => {
        console.error("❌ MongoDB connection failed in primary:", err);
      });

    for (let i = 0; i < (totalCPUs > 2 ? 2 : totalCPUs); i++) {
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
    connectDB()
      .then(() => {
        app.listen(PORT, "0.0.0.0", () => {
          console.log(`⚙️ Worker ${process.pid} listening on port ${PORT}`);
        });
      })
      .catch((err) => {
        console.error(
          `❌ Worker ${process.pid} MongoDB connection failed:`,
          err
        );
        process.exit(1);
      });
  }
}
