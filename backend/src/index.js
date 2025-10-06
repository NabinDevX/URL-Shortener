import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

import connectDB from "./db/index.js";
import { app } from "./app.js";


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
