import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.set("view engine", "ejs");
app.set("views", "./src/views");

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("../public"));
app.use(cookieParser());

import userRouter from "./routes/user.routes.js";
import urlRouter from "./routes/url.routes.js";

app.get("/", (req, res) => {
  res.render("home");
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/url", urlRouter);

export { app };
