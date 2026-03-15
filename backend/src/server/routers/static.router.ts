import { Request, Response, Router } from "express";

const router: Router = Router();

router.get("/health", (_req: Request, res: Response): void => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    PID: process.pid,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV!,
  });
});

router.get("/", (_req: Request, res: Response): void => {
  res.render("pages/home");
});

router.get("/signup", (_req: Request, res: Response): void => {
  res.render("pages/signup");
});

router.get("/login", (_req: Request, res: Response): void => {
  res.render("pages/login");
});

router.get("/dashboard", (_req: Request, res: Response): void => {
  res.render("pages/dashboard");
});

router.get("/urls", (_req: Request, res: Response): void => {
  res.render("pages/urls");
});

router.get("/profile", (_req: Request, res: Response): void => {
  res.render("pages/profile");
});

router.get("/logout", (_req: Request, res: Response): void => {
  res.render("pages/logout");
});

export default router;
