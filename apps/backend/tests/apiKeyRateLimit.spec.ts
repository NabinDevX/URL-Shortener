import request from "supertest";
import { app } from "@/app";
import User from "@/models/user";
import jwt from "jsonwebtoken";
import { setupDb, teardownDb, resetDb } from "./__helpers__/setupTestDb";
import { resetRateLimit } from "@/middlewares/rateLimit";

beforeAll(async () => {
  process.env.USER_SECRET_ACCESS_TOKEN = "test-secret";
  process.env.USER_SECRET_REFRESH_TOKEN = "test-refresh-secret";
  process.env.ACCESS_TOKEN_EXPIRY = "1d";
  process.env.REFRESH_TOKEN_EXPIRY = "10d";
  await setupDb();
});

afterAll(async () => {
  await teardownDb();
});

beforeEach(async () => {
  await resetDb();
});
async function createTestUser(email: string, name: string) {
  const user = new User({
    email,
    name,
    password: "password123",
  });
  user.generateApiKey();
  await user.save();
  const accessToken = jwt.sign(
    { _id: user._id, email: user.email, name: user.name },
    process.env.USER_SECRET_ACCESS_TOKEN!,
    { expiresIn: "1d" }
  );

  return { user, accessToken };
}

describe("API Key & Rate Limiting", () => {
  it("should generate apiKey when creating user", async () => {
    const { user } = await createTestUser("test@example.com", "Test User");

    expect(user.apiKey).toBeDefined();
    expect(user.apiKey).toMatch(/^uk_[a-f0-9]{64}$/);
    const dbUser = await User.findOne({ email: "test@example.com" });
    expect(dbUser).toBeTruthy();
    expect(dbUser?.apiKey).toBe(user.apiKey);
  });

  it("should allow request with valid API Key", async () => {
    const { user } = await createTestUser("api@example.com", "API User");
    await resetRateLimit(user._id.toString());

    const res = await request(app)
      .get("/api/v1/user/current-user")
      .set("x-api-key", user.apiKey!);

    expect(res.status).toBe(200);
    const userData = res.body.result?.data?.user || res.body.user;
    expect(userData.email).toBe("api@example.com");
  });

  it("should deny request with invalid API Key", async () => {
    const res = await request(app)
      .get("/api/v1/user/current-user")
      .set("x-api-key", "invalid-key");

    expect(res.status).toBe(401);
  });

  it("should regenerate API Key", async () => {
    const { user, accessToken } = await createTestUser(
      "regen@example.com",
      "Regen User"
    );
    const oldKey = user.apiKey;
    const res = await request(app)
      .post("/api/v1/user/regenerate-api-key")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Content-Type", "application/json")
      .send({});

    expect(res.status).toBe(200);
    const newKey = res.body.result?.data?.apiKey || res.body.apiKey;
    expect(newKey).not.toBe(oldKey);
    expect(newKey).toMatch(/^uk_[a-f0-9]{64}$/);
    await resetRateLimit(user._id.toString());
    const failRes = await request(app)
      .get("/api/v1/user/current-user")
      .set("x-api-key", oldKey!);
    expect(failRes.status).toBe(401);
    const successRes = await request(app)
      .get("/api/v1/user/current-user")
      .set("x-api-key", newKey);
    expect(successRes.status).toBe(200);
  });

  it("should rate limit requests after 10 calls", async () => {
    const { user } = await createTestUser("rate@example.com", "Rate User");
    const key = user.apiKey!;
    await resetRateLimit(user._id.toString());
    for (let i = 0; i < 10; i++) {
      const res = await request(app)
        .get("/api/v1/user/current-user")
        .set("x-api-key", key);
      expect(res.status).toBe(200);
    }
    const res = await request(app)
      .get("/api/v1/user/current-user")
      .set("x-api-key", key);

    expect(res.status).toBe(429);
  });

  it("should have API key starting with uk_ prefix", async () => {
    const { user } = await createTestUser("prefix@example.com", "Prefix User");

    expect(user.apiKey).toMatch(/^uk_[a-f0-9]{64}$/);
  });

  it("should get API key via GET endpoint", async () => {
    const { user, accessToken } = await createTestUser(
      "getkey@example.com",
      "GetKey User"
    );

    const res = await request(app)
      .get("/api/v1/user/api-key")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    const apiKey = res.body.result?.data?.apiKey || res.body.apiKey;
    expect(apiKey).toBe(user.apiKey);
  });

  it("should not allow access without authentication", async () => {
    const res = await request(app).get("/api/v1/user/current-user");

    expect(res.status).toBe(401);
  });

  it("should allow access with Bearer token", async () => {
    const { accessToken } = await createTestUser(
      "bearer@example.com",
      "Bearer User"
    );

    const res = await request(app)
      .get("/api/v1/user/current-user")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    const userData = res.body.result?.data?.user || res.body.user;
    expect(userData.email).toBe("bearer@example.com");
  });

  it("should use API key to create short URL", async () => {
    const { user } = await createTestUser(
      "urlcreate@example.com",
      "URL Creator"
    );
    await resetRateLimit(user._id.toString());

    const res = await request(app)
      .post("/api/v1/url")
      .set("x-api-key", user.apiKey!)
      .set("Content-Type", "application/json")
      .send({ url: "https://example.com" });

    expect(res.status).toBe(200);
    const data = res.body.result?.data || res.body;
    expect(data).toHaveProperty("shortId");
    expect(data).toHaveProperty("fullShortUrl");
  });

  it("should maintain separate rate limits for different users", async () => {
    const { user: user1 } = await createTestUser("user1@example.com", "User 1");
    const { user: user2 } = await createTestUser("user2@example.com", "User 2");
    await resetRateLimit(user1._id.toString());
    await resetRateLimit(user2._id.toString());
    for (let i = 0; i < 10; i++) {
      await request(app)
        .get("/api/v1/user/current-user")
        .set("x-api-key", user1.apiKey!);
    }
    const user1RateLimited = await request(app)
      .get("/api/v1/user/current-user")
      .set("x-api-key", user1.apiKey!);
    expect(user1RateLimited.status).toBe(429);
    const user2Success = await request(app)
      .get("/api/v1/user/current-user")
      .set("x-api-key", user2.apiKey!);
    expect(user2Success.status).toBe(200);
  });

  it("should return rate limit error message", async () => {
    const { user } = await createTestUser(
      "ratelimitmsg@example.com",
      "Rate Limit Msg User"
    );
    await resetRateLimit(user._id.toString());
    for (let i = 0; i < 10; i++) {
      await request(app)
        .get("/api/v1/user/current-user")
        .set("x-api-key", user.apiKey!);
    }
    const res = await request(app)
      .get("/api/v1/user/current-user")
      .set("x-api-key", user.apiKey!);

    expect(res.status).toBe(429);
    const errorMsg =
      res.body.error?.message || res.body.message || JSON.stringify(res.body);
    expect(errorMsg).toContain("Rate limit exceeded");
  });

  it("should not rate limit Bearer token requests", async () => {
    const { accessToken } = await createTestUser(
      "norlbearer@example.com",
      "No RL Bearer"
    );
    for (let i = 0; i < 15; i++) {
      const res = await request(app)
        .get("/api/v1/user/current-user")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
    }
  });

  it("should reject deleted user API key", async () => {
    const { user } = await createTestUser(
      "deleted@example.com",
      "Deleted User"
    );
    await resetRateLimit(user._id.toString());
    await User.findByIdAndUpdate(user._id, { isDeleted: true });

    const res = await request(app)
      .get("/api/v1/user/current-user")
      .set("x-api-key", user.apiKey!);

    expect(res.status).toBe(401);
  });

  it("should not find user with empty API key header", async () => {
    const res = await request(app)
      .get("/api/v1/user/current-user")
      .set("x-api-key", "");

    expect(res.status).toBe(401);
  });
});
