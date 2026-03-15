import express, { Request, Response } from "express";
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

const app = express();
const __dirname = path.resolve();

client.collectDefaultMetrics({ register: client.register });

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.get("/metrics", async (req: Request, res: Response) => {
  res.setHeader("Content-Type", client.register.contentType);
  res.send(await client.register.metrics());
});

app.set("trust proxy", 1);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(expressLayouts);
app.set("layout", "layout");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const openapiDocument = generateOpenApiDocument(appRouter, {
  baseUrl: `http://localhost:${process.env.PORT}/api/v1`,
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

    const redirectUrl = await getOriginalURL(shortId);
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

export { app };
