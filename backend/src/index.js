import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "./.env" });

import connectDB from "./db/index.js";
import { app } from "./app.js";
import discordClient from "./utils/discordClient.js";

const PORT = process.env.PORT || 8000;

// Graceful shutdown handling
const gracefulShutdown = () => {
  console.log('Received shutdown signal, closing server gracefully...');
  
  // Close Discord client
  if (discordClient) {
    discordClient.shutdown();
  }
  
  // Close server
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Unhandled promise rejection
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Uncaught exception
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

connectDB()
  .then(async () => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`⚙️ Server is running at port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Initialize Discord bot (optional in production)
    if (process.env.DISCORD_TOKEN) {
      try {
        await discordClient.initialize();
      } catch (error) {
        console.error("❌ Discord bot failed to initialize:", error.message);
        if (process.env.NODE_ENV !== 'production') {
          console.log("⚠️ Continuing without Discord bot...");
        }
      }
    }
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });
