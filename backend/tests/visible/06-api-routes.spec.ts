import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import type { Express } from "express";
import User from "@/models/user";
import { URL } from "@/models/url";
import { setupDb, teardownDb, resetDb } from "../__helpers__/setupTestDb";

let app: Express;

type ApiResponse = {
  result?: {
    data?: Record<string, unknown>;
  };
  [key: string]: unknown;
};

const extractData = (body: ApiResponse): Record<string, unknown> => {
  return (body.result?.data as Record<string, unknown>) || body;
};

const createTestUserWithToken = async (email: string, name: string) => {
  const user = await User.create({
    email,
    name,
    password: "password123",
  });

  const accessToken = jwt.sign(
    { _id: user._id, email: user.email, name: user.name },
    process.env.USER_SECRET_ACCESS_TOKEN as string,
    { expiresIn: "1d" }
  );

  return { user, accessToken };
};

beforeAll(async () => {
  process.env.USER_SECRET_ACCESS_TOKEN = "test-secret";
  process.env.USER_SECRET_REFRESH_TOKEN = "test-refresh-secret";
  process.env.ACCESS_TOKEN_EXPIRY = "1d";
  process.env.REFRESH_TOKEN_EXPIRY = "10d";
  process.env.RAZORPAY_KEY_ID = "test_key";
  process.env.RAZORPAY_KEY_SECRET = "test_secret";

  const appModule = await import("@/app");
  app = appModule.app;

  await setupDb();
  await URL.createIndexes();
});

afterAll(async () => {
  await teardownDb();
});

beforeEach(async () => {
  await resetDb();
});

describe("API Routes Integration", () => {
  it("should return service health payload", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "OK");
    expect(res.body).toHaveProperty("timestamp");
    expect(res.body).toHaveProperty("uptime");
  });

  it("should redirect when short URL exists and record a visit", async () => {
    const userId = new mongoose.Types.ObjectId();

    await URL.create({
      userId,
      shortId: "go123",
      redirectUrl: "https://example.com/page",
    });

    const res = await request(app).get("/go123");
    const updated = await URL.findOne({ shortId: "go123" });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("https://example.com/page");
    expect(updated?.visitHistory.length).toBe(1);
  });

  it("should return 404 for non-existent short URL", async () => {
    const res = await request(app).get("/missing-short-id");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Short URL not found" });
  });

  it("should create short URL and return existing one for duplicate redirect URL", async () => {
    const { accessToken } = await createTestUserWithToken(
      "creator@example.com",
      "Creator"
    );

    const createRes = await request(app)
      .post("/api/v1/url")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Content-Type", "application/json")
      .send({ url: "https://example.com/very-long-page" });

    expect(createRes.status).toBe(200);
    const first = extractData(createRes.body);
    expect(first).toHaveProperty("shortId");
    expect(first).toHaveProperty("fullShortUrl");

    const duplicateRes = await request(app)
      .post("/api/v1/url")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Content-Type", "application/json")
      .send({ url: "https://example.com/very-long-page" });

    expect(duplicateRes.status).toBe(200);
    const second = extractData(duplicateRes.body);

    expect(second.shortId).toBe(first.shortId);
    expect(second.isExisting).toBe(true);
  });

  it("should validate custom shortId format", async () => {
    const { accessToken } = await createTestUserWithToken(
      "validator@example.com",
      "Validator"
    );

    const res = await request(app)
      .post("/api/v1/url")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Content-Type", "application/json")
      .send({
        url: "https://example.com",
        customShortId: "ab",
      });

    expect(res.status).toBe(400);
  });

  it("should return analytics after redirects", async () => {
    const { accessToken } = await createTestUserWithToken(
      "analytics@example.com",
      "Analytics User"
    );

    const createRes = await request(app)
      .post("/api/v1/url")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Content-Type", "application/json")
      .send({
        url: "https://example.com/analytics",
        customShortId: "analytics1",
      });

    expect(createRes.status).toBe(200);

    await request(app).get("/analytics1");
    await request(app).get("/analytics1");

    const analyticsRes = await request(app)
      .get("/api/v1/url/analytics/analytics1")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(analyticsRes.status).toBe(200);
    const data = extractData(analyticsRes.body);

    expect(data.totalClicks).toBe(2);
    expect(Array.isArray(data.analytics)).toBe(true);
  });

  it("should update URL QR code, list user URLs, and toggle soft delete", async () => {
    const { accessToken } = await createTestUserWithToken(
      "mutator@example.com",
      "Mutator"
    );

    const createRes = await request(app)
      .post("/api/v1/url")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Content-Type", "application/json")
      .send({
        url: "https://example.com/mutate",
        customShortId: "mutate1",
      });

    expect(createRes.status).toBe(200);

    const updateRes = await request(app)
      .patch("/api/v1/url/update/mutate1")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Content-Type", "application/json")
      .send({
        shortId: "mutate1",
        qrCode: "data:image/png;base64,mutateQr",
      });

    expect(updateRes.status).toBe(200);
    const updateData = extractData(updateRes.body);
    expect(updateData.qrCode).toBe("data:image/png;base64,mutateQr");

    const listRes = await request(app)
      .get("/api/v1/url/user/all?page=1&limit=5&sortBy=createdAt&sortOrder=desc")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listRes.status).toBe(200);
    const listData = extractData(listRes.body);
    expect(Array.isArray(listData.urls)).toBe(true);
    expect(listData.totalUrls).toBe(1);

    const deleteRes = await request(app)
      .delete("/api/v1/url/mutate1")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(deleteRes.status).toBe(200);
    const deleteData = extractData(deleteRes.body);
    expect(deleteData.isDeleted).toBe(true);

    const restoreRes = await request(app)
      .delete("/api/v1/url/mutate1")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(restoreRes.status).toBe(200);
    const restoreData = extractData(restoreRes.body);
    expect(restoreData.isDeleted).toBe(false);
  });
});