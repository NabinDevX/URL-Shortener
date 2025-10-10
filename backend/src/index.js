import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import fs from "fs";
import https from "https";

dotenv.config({ path: "./.env" });

import connectDB from "./db/index.js";
import { app } from "./app.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.on("messageCreate", (message) => {
  if (message.author.bot) return;
  if (message.content.startsWith("create")){
    return message.reply({
      content: "Generating short id for" + url,
    })
  }
  message.reply({
    content: "Hello From Bot",
  });
});

client.on("interactionCreate", interaction => {
  console.log(interaction);
  interaction.reply('pong!')
})

client.login(process.env.DISCORD_TOKEN);

// Load SSL certificate and key
// const sslOptions = {
//   key: fs.readFileSync("./cert/server.key"),     // Path to your private key
//   cert: fs.readFileSync("./cert/server.cert"),   // Path to your certificate
// };

// Connect to DB and start HTTP or HTTPS server
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });

    // https.createServer(sslOptions, app).listen(process.env.PORT, () => {
    //   console.log(`🚀 HTTPS Server running at https://localhost:${process.env.PORT}`);
    // });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });
