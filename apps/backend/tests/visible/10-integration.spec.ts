import { setupDb, teardownDb, resetDb } from "../__helpers__/setupTestDb";
import User from "@/models/user";
import { URL } from "@/models/url";
import * as urlController from "@/controllers/url.controller";

beforeAll(async () => {
  await setupDb();
});

afterAll(async () => await teardownDb());

beforeEach(async () => await resetDb());

describe("Cross-User URL Operations", () => {
  let user1: any;
  let user2: any;

  beforeEach(async () => {
    user1 = await User.create({
      email: "user1@example.com",
      password: "password123",
      name: "User 1",
    });

    user2 = await User.create({
      email: "user2@example.com",
      password: "password123",
      name: "User 2",
    });
  });

  it("should isolate URLs between different users", async () => {
    const url1 = await urlController.generateShortURL(
      { url: "https://example.com/u1" },
      user1
    );
    const url2 = await urlController.generateShortURL(
      { url: "https://example.com/u2" },
      user2
    );

    const user1Urls = await urlController.getAllUrls(
      user1,
      1,
      100,
      "createdAt",
      "desc"
    );
    const user2Urls = await urlController.getAllUrls(
      user2,
      1,
      100,
      "createdAt",
      "desc"
    );

    expect(user1Urls.urls.length).toBe(1);
    expect(user2Urls.urls.length).toBe(1);
    expect(user1Urls.urls[0]!.shortId).toBe(url1.shortId);
    expect(user2Urls.urls[0]!.shortId).toBe(url2.shortId);
  });

  it("should prevent user from modifying other user's URLs", async () => {
    const url = await urlController.generateShortURL(
      { url: "https://example.com/u1" },
      user1
    );

    await expect(
      urlController.updateShortURL(
        { shortId: url.shortId, qrCode: "data:image/png;base64,..." },
        user2
      )
    ).rejects.toBeDefined();
  });

  it("should prevent user from deleting other user's URLs", async () => {
    const url = await urlController.generateShortURL(
      { url: "https://example.com/u1" },
      user1
    );

    await expect(
      urlController.deleteURL(url.shortId, user2)
    ).rejects.toBeDefined();
  });
});

describe("URL Generation Edge Cases", () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = await User.create({
      email: "edge@example.com",
      password: "password123",
      name: "Edge Case User",
    });
  });

  it("should handle special characters in URL", async () => {
    const specialUrl = "https://example.com/search?q=a%20b&x=%40%23%24";
    const result = await urlController.generateShortURL(
      { url: specialUrl },
      testUser
    );
    expect(result.redirectUrl).toBe(specialUrl);
  });

  it("should handle very long URLs", async () => {
    const longUrl = `https://example.com/${"a".repeat(500)}`;
    const result = await urlController.generateShortURL(
      { url: longUrl },
      testUser
    );
    expect(result.redirectUrl).toBe(longUrl);
  });

  it("should handle HTTP and HTTPS URLs", async () => {
    const httpUrl = "http://example.com";
    const httpsUrl = "https://example.com";
    const httpResult = await urlController.generateShortURL(
      { url: httpUrl },
      testUser
    );
    const httpsResult = await urlController.generateShortURL(
      { url: httpsUrl },
      testUser
    );
    expect(httpResult.redirectUrl).toBe(httpUrl);
    expect(httpsResult.redirectUrl).toBe(httpsUrl);
  });

  it("should handle URLs with authentication", async () => {
    const urlWithAuth = "https://user:pass@example.com/path";
    const result = await urlController.generateShortURL(
      { url: urlWithAuth },
      testUser
    );
    expect(result.redirectUrl).toContain("example.com");
  });

  it("should handle URLs with port numbers", async () => {
    const urlWithPort = "https://example.com:8443/path";
    const result = await urlController.generateShortURL(
      { url: urlWithPort },
      testUser
    );
    expect(result.redirectUrl).toBe(urlWithPort);
  });
});

describe("Visit History Tracking", () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = await User.create({
      email: "visits@example.com",
      password: "password123",
      name: "Visits User",
    });
  });

  it("should calculate analytics correctly with multiple visits", async () => {
    const urlResult = await urlController.generateShortURL(
      { url: "https://example.com/visits" },
      testUser
    );
    const url = await URL.findOne({ shortId: urlResult.shortId });

    for (let i = 0; i < 10; i++) {
      url!.visitHistory.push({ timestamp: new Date(Date.now() + i * 1000) });
    }
    await url!.save();

    const analytics = await urlController.getAnalytics(urlResult.shortId);
    expect(analytics.totalClicks).toBe(10);
    expect(analytics.analytics.length).toBe(10);
  });
});
