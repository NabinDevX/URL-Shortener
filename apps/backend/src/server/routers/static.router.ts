import { NextFunction, Request, Response, Router } from "express";
import { verifyAuth } from "@/middlewares/auth";
import * as userController from "@/controllers/user.controller";

const router: Router = Router();

const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authCtx = await verifyAuth({ req, res });
    res.locals.authUser = {
      name: authCtx.user.name,
      email: authCtx.user.email,
      avatar: authCtx.user.avatar,
    };
    next();
  } catch {
    res.redirect("/signin");
  }
};

const redirectIfAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await verifyAuth({ req, res });
    res.redirect("/dashboard");
  } catch {
    next();
  }
};

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
  res.render("pages/welcome", { currentPage: "welcome" });
});

router.get("/signup", redirectIfAuthenticated, (_req: Request, res: Response): void => {
  res.render("pages/signup", { currentPage: "signup" });
});

router.get("/signin", redirectIfAuthenticated, (_req: Request, res: Response): void => {
  res.render("pages/signin", { currentPage: "signin" });
});

router.get("/dashboard", requireAuth, (_req: Request, res: Response): void => {
  res.render("pages/dashboard", { currentPage: "dashboard" });
});

router.get("/urls", requireAuth, (_req: Request, res: Response): void => {
  res.render("pages/urls", { currentPage: "urls" });
});

router.get("/analytics", requireAuth, (_req: Request, res: Response): void => {
  res.render("pages/analytics", { currentPage: "analytics" });
});

router.get("/campaigns", requireAuth, (_req: Request, res: Response): void => {
  res.render("pages/campaigns", { currentPage: "campaigns" });
});

router.get("/api", requireAuth, (_req: Request, res: Response): void => {
  res.render("pages/api", { currentPage: "api" });
});

router.get("/api/key-docs", requireAuth, (_req: Request, res: Response): void => {
  res.render("pages/api-key-docs", { currentPage: "api" });
});

router.get("/profile", requireAuth, (_req: Request, res: Response): void => {
  res.render("pages/profile", { currentPage: "profile" });
});

router.get("/settings", requireAuth, (_req: Request, res: Response): void => {
  res.render("pages/settings", { currentPage: "settings" });
});

router.get("/signout", async (req: Request, res: Response): Promise<void> => {
  try {
    const authCtx = await verifyAuth({ req, res });
    await userController.signout(authCtx.user, authCtx.token, authCtx);
  } catch {
    // Even if auth is invalid/expired, redirecting home is still safe.
  }

  res.redirect("/");
});

export default router;
