import express from "express";

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    PID: process.pid,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

router.get("/", (req, res) => {
  res.render("pages/home");
});

router.get("/signup", (req, res) => {
  res.render("pages/signup");
});

router.get("/login", (req, res) => {
  res.render("pages/login");
});

router.get("/dashboard", (req, res) => {
  res.render("pages/dashboard");
});

router.route("/urls").get((req, res) => {
  res.render("pages/urls");
});

router.route("/profile").get((req, res) => {
  res.render("pages/profile");
});

router.route("/logout").get((req, res) => {
  res.render("pages/logout");
});

export default router;
