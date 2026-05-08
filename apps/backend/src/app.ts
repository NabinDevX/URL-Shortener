import express, { Express, NextFunction, Request, Response } from "express";
import cors from "cors";
import client from "prom-client";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs/promises";
import expressLayouts from "express-ejs-layouts";
import * as trpcExpress from "@trpc/server/adapters/express";
import {
  generateOpenApiDocument,
  createOpenApiExpressMiddleware,
} from "trpc-to-openapi";
import { appRouter } from "@/server";
import { createContext } from "@/server/context";
import { getOriginalURL } from "@/controllers/url.controller";
import logger from "@/utils/logger";

const app: Express = express();
const __dirname = path.resolve();

client.collectDefaultMetrics({ register: client.register });

const configureCORS = () => {
  const corsOriginEnv = process.env.CORS_ORIGIN || "http://localhost:3000";

  const allowedOrigins = corsOriginEnv
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  const developmentOrigins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:5000",
    "https://localhost",
    "capacitor://localhost",
  ];

  const finalOrigins = [...new Set([...allowedOrigins, ...developmentOrigins])];

  return {
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      if (!requestOrigin) {
        return callback(null, true);
      }

      const isAllowed = finalOrigins.some((allowedOrigin) => {
        if (allowedOrigin === "*") {
          return true;
        }
        if (allowedOrigin.startsWith("/") && allowedOrigin.endsWith("/")) {
          const regex = new RegExp(allowedOrigin.slice(1, -1));
          return regex.test(requestOrigin);
        }
        return requestOrigin === allowedOrigin;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        logger.warn("CORS blocked request from origin", {
          origin: requestOrigin,
        });
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
};

app.use(cors(configureCORS()));

app.get("/metrics", async (req: Request, res: Response) => {
  res.setHeader("Content-Type", client.register.contentType);
  res.send(await client.register.metrics());
});

app.set("trust proxy", 1);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use((req: Request, _res: Response, next: NextFunction) => {
  try {
    const clientOrigin =
      (req.headers["x-client-origin"] as string) ||
      (req.headers.origin as string) ||
      "";
    const clientPlatform = (req.headers["x-client-platform"] as string) || "";
    // attach to res.locals for controllers to consume
    (_res as Response & { locals: any }).locals.clientOrigin = clientOrigin;
    (_res as Response & { locals: any }).locals.clientPlatform = clientPlatform;
  } catch (e) {
    // ignore
  }
  next();
});

app.use((req: Request, res: Response, next) => {
  const reqWithStartTime = req as Request & { startTime?: number };

  logger.info("Incoming request", {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  });

  res.on("finish", () => {
    logger.info("Request completed", {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: `${Date.now() - (reqWithStartTime.startTime ?? Date.now())}ms`,
    });
  });

  reqWithStartTime.startTime = Date.now();
  next();
});

app.use(expressLayouts);
app.set("layout", "layout");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use((_req: Request, res: Response, next: NextFunction) => {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  res.locals.nodeEnv = nodeEnv;
  res.locals.isProduction = nodeEnv === "production";
  next();
});

const openapiDocument = generateOpenApiDocument(appRouter, {
  baseUrl: `http://localhost:${process.env.PORT || 8000}/api/v1`,
  title: "URL Shortener API",
  version: "1.0.0",
});

await fs.writeFile(
  "./openapi-specification.json",
  JSON.stringify(openapiDocument, null, 2)
);

import staticRouter from "@/server/routers/static.router";
const handleRedirect = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shortId } = req.params;
    if (!shortId || typeof shortId !== "string") {
      res.status(400).json({ error: "Short ID is required" });
      return;
    }

    const redirectUrl = await getOriginalURL(shortId, req);
    res.redirect(redirectUrl);
  } catch (error) {
    if (error instanceof Error && error.message === "Short URL not found") {
      res.status(404).json({ error: "Short URL not found" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

app.use("/", staticRouter);
app.use("/document", (req, res) => {
  return res.json(openapiDocument);
});
app.get("/:shortId", handleRedirect);

app.use(
  "/api/v1",
  createOpenApiExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.use(
  "/api/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error("Unhandled error", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

export { app };
