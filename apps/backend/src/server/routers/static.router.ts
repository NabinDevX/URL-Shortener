import { NextFunction, Request, Response, Router } from "express";
import { URL } from "@/models/url";
import { verifyAuth } from "@/middlewares/auth";
import * as userController from "@/controllers/user.controller";
import type { IVisitHistory } from "@/types";

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
    res.locals.authUserId = authCtx.user._id.toString();
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

type AnalyticsPageData = {
  totalClicks: number;
  activeLinks: number;
  totalUrls: number;
  last30DaysClicks: {
    labels: string[];
    values: number[];
  };
  radar: {
    labels: string[];
    values: number[];
  };
  topUrls: Array<{
    shortId: string;
    redirectUrl: string;
    clicks: number;
  }>;
};

const formatDayLabel = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
};

const getDeviceLabel = (device?: IVisitHistory["device"]): string => {
  if (!device || device === "unknown") {
    return "unknown";
  }

  return device;
};

const buildAnalyticsPageData = (
  urls: Array<{
    shortId: string;
    redirectUrl: string;
    isDeleted?: boolean;
    visitHistory: IVisitHistory[];
  }>
): AnalyticsPageData => {
  const allVisits = urls.flatMap((url) =>
    url.visitHistory.map((visit) => ({ ...visit, shortId: url.shortId }))
  );

  const totalClicks = allVisits.length;
  const activeLinks = urls.filter((url) => !url.isDeleted).length;
  const totalUrls = urls.length;

  const start = new Date();
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  const dayKeys: string[] = [];
  const clickCounts = new Map<string, number>();

  for (let index = 0; index < 30; index += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    dayKeys.push(day.toISOString().slice(0, 10));
    const key = dayKeys[index];
    if (key) {
      clickCounts.set(key, 0);
    }
  }

  for (const visit of allVisits) {
    const key = new Date(visit.timestamp).toISOString().slice(0, 10);
    if (clickCounts.has(key)) {
      clickCounts.set(key, (clickCounts.get(key) || 0) + 1);
    }
  }

  const topUrls = urls
    .map((url) => ({
      shortId: url.shortId,
      redirectUrl: url.redirectUrl,
      clicks: url.visitHistory.length,
    }))
    .sort((left, right) => right.clicks - left.clicks)
    .slice(0, 5);

  const uniqueIps = new Set(
    allVisits.map((visit) => visit.ipAddress).filter(Boolean)
  ).size;
  const countries = new Set(
    allVisits.map((visit) => visit.country).filter(Boolean)
  ).size;
  const deviceSet = new Set(
    allVisits
      .map((visit) => getDeviceLabel(visit.device))
      .filter((device) => device !== "unknown")
  );
  const returnVisitorCount = allVisits.filter(
    (visit) => visit.isReturnVisitor
  ).length;
  const avgHour = allVisits.length
    ? allVisits.reduce((sum, visit) => sum + new Date(visit.timestamp).getHours(), 0) /
    allVisits.length
    : 0;

  return {
    totalClicks,
    activeLinks,
    totalUrls,
    last30DaysClicks: {
      labels: dayKeys.map((key) => formatDayLabel(new Date(`${key}T00:00:00`))),
      values: dayKeys.map((key) => clickCounts.get(key) || 0),
    },
    radar: {
      labels: [
        "Total clicks",
        "Unique IPs",
        "Country diversity",
        "Device diversity",
        "Avg. time",
        "Return visitors %",
      ],
      values: [
        Math.min(100, Math.round((totalClicks / 1000) * 100)),
        Math.min(100, uniqueIps * 12),
        Math.min(100, countries * 20),
        Math.min(100, deviceSet.size * 33),
        Math.min(100, Math.round((avgHour / 23) * 100)),
        totalClicks > 0 ? Math.round((returnVisitorCount / totalClicks) * 100) : 0,
      ],
    },
    topUrls,
  };
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

router.get("/analytics", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  const userId = res.locals.authUserId as string | undefined;
  const urls = userId
    ? await URL.find({ userId }).select("shortId redirectUrl isDeleted visitHistory").lean()
    : [];

  const analyticsPageData = buildAnalyticsPageData(urls as Array<{
    shortId: string;
    redirectUrl: string;
    isDeleted?: boolean;
    visitHistory: IVisitHistory[];
  }>);

  res.render("pages/analytics", {
    currentPage: "analytics",
    analyticsPageData,
  });
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
