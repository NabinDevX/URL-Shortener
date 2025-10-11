import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

import connectDB from "./db/index.js";
import { app } from "./app.js";
import discordClient from "./utils/discordClient.js";

// Load SSL certificate and key (if needed)
// const sslOptions = {
//   key: fs.readFileSync("./cert/server.key"),
//   cert: fs.readFileSync("./cert/server.cert"),
// };

// Connect to DB and start servers
connectDB()
  .then(async () => {
    // Initialize Discord bot
    await discordClient.initialize();
    
    // Start HTTP server
    app.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });

    // Start HTTPS server (if needed)
    // https.createServer(sslOptions, app).listen(process.env.HTTPS_PORT || 8443, () => {
    //   console.log(`🚀 HTTPS Server running at https://localhost:${process.env.HTTPS_PORT}`);
    // });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  
  try {
    await discordClient.shutdown();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
  
  try {
    await discordClient.shutdown();
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});
