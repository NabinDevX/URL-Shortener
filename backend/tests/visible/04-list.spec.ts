import mongoose from "mongoose";
import { setupDb, teardownDb, resetDb } from "../__helpers__/setupTestDb";
import { URL } from "@/models/url";

beforeAll(async () => {
  await setupDb();
  await URL.createIndexes();
});
afterAll(async () => await teardownDb());
beforeEach(async () => await resetDb());

describe("List and Find URLs", () => {
  const mockUserId = new mongoose.Types.ObjectId();
  const anotherUserId = new mongoose.Types.ObjectId();

  describe("Find URLs", () => {
    it("should return empty array when no URLs exist", async () => {
      const urls = await URL.find({});

      expect(urls).toEqual([]);
      expect(urls.length).toBe(0);
    });

    it("should return all URLs for a user", async () => {
      await URL.create({
        userId: mockUserId,
        shortId: "url1",
        redirectUrl: "https://example1.com",
      });
      await URL.create({
        userId: mockUserId,
        shortId: "url2",
        redirectUrl: "https://example2.com",
      });
      await URL.create({
        userId: mockUserId,
        shortId: "url3",
        redirectUrl: "https://example3.com",
      });

      const urls = await URL.find({ userId: mockUserId });

      expect(urls.length).toBe(3);
    });

    it("should filter URLs by userId", async () => {
      await URL.create({
        userId: mockUserId,
        shortId: "user1url",
        redirectUrl: "https://example1.com",
      });
      await URL.create({
        userId: anotherUserId,
        shortId: "user2url",
        redirectUrl: "https://example2.com",
      });

      const user1Urls = await URL.find({ userId: mockUserId });
      const user2Urls = await URL.find({ userId: anotherUserId });

      expect(user1Urls.length).toBe(1);
      expect(user1Urls[0].shortId).toBe("user1url");
      expect(user2Urls.length).toBe(1);
      expect(user2Urls[0].shortId).toBe("user2url");
    });

    it("should find URL by shortId", async () => {
      await URL.create({
        userId: mockUserId,
        shortId: "findme123",
        redirectUrl: "https://findme.com",
      });

      const url = await URL.findOne({ shortId: "findme123" });

      expect(url).toBeDefined();
      expect(url?.shortId).toBe("findme123");
      expect(url?.redirectUrl).toBe("https://findme.com");
    });

    it("should return null for non-existent shortId", async () => {
      const url = await URL.findOne({ shortId: "nonexistent" });

      expect(url).toBeNull();
    });

    it("should find URL by _id", async () => {
      const created = await URL.create({
        userId: mockUserId,
        shortId: "byid123",
        redirectUrl: "https://byid.com",
      });

      const url = await URL.findById(created._id);

      expect(url).toBeDefined();
      expect(url?._id.toString()).toBe(created._id.toString());
    });

    it("should filter by isDeleted status", async () => {
      await URL.create({
        userId: mockUserId,
        shortId: "active1",
        redirectUrl: "https://active1.com",
        isDeleted: false,
      });
      await URL.create({
        userId: mockUserId,
        shortId: "deleted1",
        redirectUrl: "https://deleted1.com",
        isDeleted: true,
      });
      await URL.create({
        userId: mockUserId,
        shortId: "active2",
        redirectUrl: "https://active2.com",
        isDeleted: false,
      });

      const activeUrls = await URL.find({
        userId: mockUserId,
        isDeleted: false,
      });
      const deletedUrls = await URL.find({
        userId: mockUserId,
        isDeleted: true,
      });

      expect(activeUrls.length).toBe(2);
      expect(deletedUrls.length).toBe(1);
      expect(deletedUrls[0].shortId).toBe("deleted1");
    });
  });

  describe("Sorting URLs", () => {
    it("should sort URLs by createdAt descending", async () => {
      await URL.create({
        userId: mockUserId,
        shortId: "first",
        redirectUrl: "https://first.com",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await URL.create({
        userId: mockUserId,
        shortId: "second",
        redirectUrl: "https://second.com",
      });

      const urls = await URL.find({ userId: mockUserId }).sort({
        createdAt: -1,
      });

      expect(urls[0].shortId).toBe("second");
      expect(urls[1].shortId).toBe("first");
    });

    it("should sort URLs by createdAt ascending", async () => {
      await URL.create({
        userId: mockUserId,
        shortId: "first",
        redirectUrl: "https://first.com",
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await URL.create({
        userId: mockUserId,
        shortId: "second",
        redirectUrl: "https://second.com",
      });

      const urls = await URL.find({ userId: mockUserId }).sort({
        createdAt: 1,
      });

      expect(urls[0].shortId).toBe("first");
      expect(urls[1].shortId).toBe("second");
    });
  });

  describe("Counting URLs", () => {
    it("should count total URLs for a user", async () => {
      await URL.create({
        userId: mockUserId,
        shortId: "count1",
        redirectUrl: "https://count1.com",
      });
      await URL.create({
        userId: mockUserId,
        shortId: "count2",
        redirectUrl: "https://count2.com",
      });

      const count = await URL.countDocuments({ userId: mockUserId });

      expect(count).toBe(2);
    });

    it("should count active URLs only", async () => {
      await URL.create({
        userId: mockUserId,
        shortId: "active",
        redirectUrl: "https://active.com",
        isDeleted: false,
      });
      await URL.create({
        userId: mockUserId,
        shortId: "deleted",
        redirectUrl: "https://deleted.com",
        isDeleted: true,
      });

      const activeCount = await URL.countDocuments({
        userId: mockUserId,
        isDeleted: false,
      });

      expect(activeCount).toBe(1);
    });
  });

  describe("Pagination with Limit and Skip", () => {
    beforeEach(async () => {
      for (let i = 1; i <= 10; i++) {
        await URL.create({
          userId: mockUserId,
          shortId: `page${i.toString().padStart(2, "0")}`,
          redirectUrl: `https://page${i}.com`,
        });
      }
    });

    it("should limit results", async () => {
      const urls = await URL.find({ userId: mockUserId }).limit(5);

      expect(urls.length).toBe(5);
    });

    it("should skip results", async () => {
      const allUrls = await URL.find({ userId: mockUserId }).sort({
        shortId: 1,
      });
      const skippedUrls = await URL.find({ userId: mockUserId })
        .sort({ shortId: 1 })
        .skip(3);

      expect(skippedUrls.length).toBe(7);
      expect(skippedUrls[0].shortId).toBe(allUrls[3].shortId);
    });

    it("should paginate with skip and limit", async () => {
      const page1 = await URL.find({ userId: mockUserId })
        .sort({ shortId: 1 })
        .skip(0)
        .limit(3);

      const page2 = await URL.find({ userId: mockUserId })
        .sort({ shortId: 1 })
        .skip(3)
        .limit(3);

      expect(page1.length).toBe(3);
      expect(page2.length).toBe(3);
      expect(page1[0].shortId).not.toBe(page2[0].shortId);
    });
  });
});
