import { setupDb, teardownDb, resetDb } from "../__helpers__/setupTestDb";
import User from "@/models/user";
import { URL } from "@/models/url";
import * as urlController from "@/controllers/url.controller";

beforeAll(async () => {
  await setupDb();
});

afterAll(async () => await teardownDb());

beforeEach(async () => await resetDb());

describe("Error Handling and Input Validation", () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = await User.create({
      email: "errors@example.com",
      password: "password123",
      name: "Error Test User",
    });
  });

  describe("URL Validation", () => {
    it("should reject invalid URL format", async () => {
      await expect(
        urlController.generateShortURL({ url: "not a valid url" }, testUser)
      ).rejects.toBeDefined();
    });

    it("should reject missing protocol in URL", async () => {
      await expect(
        urlController.generateShortURL({ url: "example.com" }, testUser)
      ).rejects.toBeDefined();
    });

    it("should accept URLs with query parameters", async () => {
      const urlWithQuery =
        "https://example.com/path?param1=value1&param2=value2";
      const result = await urlController.generateShortURL(
        { url: urlWithQuery },
        testUser
      );
      expect(result.redirectUrl).toContain("param1=value1");
      expect(result.redirectUrl).toContain("param2=value2");
    });

    it("should accept URLs with fragments", async () => {
      const urlWithFragment = "https://example.com/path#section";
      const result = await urlController.generateShortURL(
        { url: urlWithFragment },
        testUser
      );
      expect(result.redirectUrl).toContain("#section");
    });
  });

  describe("Custom Short ID Validation", () => {
    it("should accept alphanumeric short IDs", async () => {
      const result = await urlController.generateShortURL(
        { url: "https://example.com", customShortId: "abc123" },
        testUser
      );
      expect(result.shortId).toBe("abc123");
    });

    it("should reject short IDs below minimum length", async () => {
      await expect(
        urlController.generateShortURL(
          { url: "https://example.com", customShortId: "ab" },
          testUser
        )
      ).rejects.toBeDefined();
    });

    it("should reject short IDs above maximum length", async () => {
      await expect(
        urlController.generateShortURL(
          { url: "https://example.com", customShortId: "a".repeat(21) },
          testUser
        )
      ).rejects.toBeDefined();
    });

    it("should handle duplicate customShortId gracefully", async () => {
      const customId = "duplicate";
      await urlController.generateShortURL(
        { url: "https://example.com/1", customShortId: customId },
        testUser
      );

      const result = await urlController.generateShortURL(
        { url: "https://example.com/2", customShortId: customId },
        testUser
      );

      expect(result.isExisting).toBe(true);
    });
  });

  describe("URL Not Found Scenarios", () => {
    it("should error on analytics for non-existent URL", async () => {
      await expect(
        urlController.getAnalytics("nonexistent")
      ).rejects.toBeDefined();
    });
  });

  describe("Null Handling", () => {
    it("should reject null redirectUrl", async () => {
      await expect(
        URL.create({
          userId: testUser._id,
          shortId: "test",
          redirectUrl: null as any,
        })
      ).rejects.toBeDefined();
    });
  });
});
