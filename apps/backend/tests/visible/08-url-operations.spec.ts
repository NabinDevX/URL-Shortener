import mongoose from "mongoose";
import { setupDb, teardownDb, resetDb } from "../__helpers__/setupTestDb";
import { URL } from "@/models/url";
import User from "@/models/user";
import * as urlController from "@/controllers/url.controller";

beforeAll(async () => {
  await setupDb();
});

afterAll(async () => await teardownDb());

beforeEach(async () => await resetDb());

describe("URL Generation and Management", () => {
  let testUser: any;
  const mockUserId = new mongoose.Types.ObjectId();
  const exampleUrl = "https://example.com";

  beforeEach(async () => {
    testUser = await User.create({
      _id: mockUserId,
      email: "user@example.com",
      password: "password123",
      name: "Test User",
    });
  });

  describe("Generate Short URLs", () => {
    it("should generate a short URL with auto-generated shortId", async () => {
      const result = await urlController.generateShortURL(
        { url: exampleUrl },
        testUser
      );

      expect(result.shortId).toBeDefined();
      expect(result.redirectUrl).toBe(exampleUrl);
      expect(result.fullShortUrl).toContain(result.shortId);
      expect(result.isCustom).toBe(false);
    });

    it("should generate a short URL with custom shortId", async () => {
      const customId = "myshortid";
      const result = await urlController.generateShortURL(
        {
          url: exampleUrl,
          customShortId: customId,
        },
        testUser
      );

      expect(result.shortId).toBe(customId);
      expect(result.isCustom).toBe(true);
    });

    it("should use specified idLength for auto-generated shortId", async () => {
      const result = await urlController.generateShortURL(
        {
          url: exampleUrl,
          idLength: 12,
        },
        testUser
      );

      expect(result.shortId.length).toBe(12);
    });

    it("should return isExisting=true for duplicate shortId", async () => {
      const shortId = "duplicate";

      await urlController.generateShortURL(
        {
          url: exampleUrl,
          customShortId: shortId,
        },
        testUser
      );

      const result = await urlController.generateShortURL(
        {
          url: exampleUrl,
          customShortId: shortId,
        },
        testUser
      );

      expect(result.isExisting).toBe(true);
    });

    it("should reject invalid URLs", async () => {
      await expect(
        urlController.generateShortURL({ url: "not a valid url" }, testUser)
      ).rejects.toBeDefined();
    });
  });

  describe("URL Analytics", () => {
    it("should calculate totalClicks from visitHistory", async () => {
      const urlResult = await urlController.generateShortURL(
        { url: exampleUrl },
        testUser
      );
      const url = await URL.findOne({ shortId: urlResult.shortId });
      expect(url).toBeTruthy();

      for (let i = 0; i < 5; i++) {
        url!.visitHistory.push({ timestamp: new Date() });
      }
      await url!.save();

      const analytics = await urlController.getAnalytics(urlResult.shortId);
      expect(analytics.totalClicks).toBe(5);
      expect(analytics.analytics.length).toBe(5);
    });
  });

  describe("Update and Delete URLs", () => {
    it("should update QR code for a short URL", async () => {
      const urlResult = await urlController.generateShortURL(
        { url: exampleUrl },
        testUser
      );

      const qrCode = "data:image/png;base64,iVBORw0KGgoAAAANS...";
      const updated = await urlController.updateShortURL(
        {
          shortId: urlResult.shortId,
          qrCode,
        },
        testUser
      );

      expect(updated.qrCode).toBe(qrCode);
      expect(updated.shortId).toBe(urlResult.shortId);
    });

    it("should soft delete and restore a URL", async () => {
      const urlResult = await urlController.generateShortURL(
        { url: exampleUrl },
        testUser
      );

      const deleted = await urlController.deleteURL(
        urlResult.shortId,
        testUser
      );
      expect(deleted.isDeleted).toBe(true);

      const restored = await urlController.deleteURL(
        urlResult.shortId,
        testUser
      );
      expect(restored.isDeleted).toBe(false);
    });
  });

  describe("URL Listing and Pagination", () => {
    beforeEach(async () => {
      for (let i = 0; i < 25; i++) {
        await urlController.generateShortURL(
          { url: `${exampleUrl}/p/${i}` },
          testUser
        );
      }
    });

    it("should list URLs with default pagination", async () => {
      const result = await urlController.getAllUrls(
        testUser,
        1,
        10,
        "createdAt",
        "desc"
      );

      expect(result.urls.length).toBe(10);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.totalDocs).toBe(25);
    });

    it("should paginate through URLs", async () => {
      const page1 = await urlController.getAllUrls(
        testUser,
        1,
        10,
        "createdAt",
        "desc"
      );
      const page2 = await urlController.getAllUrls(
        testUser,
        2,
        10,
        "createdAt",
        "desc"
      );

      expect(page1.urls[0]!.shortId).not.toBe(page2.urls[0]!.shortId);
      expect(page2.pagination.currentPage).toBe(2);
    });
  });
});
