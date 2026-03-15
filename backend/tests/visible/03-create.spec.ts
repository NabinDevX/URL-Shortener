import mongoose from "mongoose";
import { setupDb, teardownDb, resetDb } from "../__helpers__/setupTestDb";
import { URL } from "@/models/url";

beforeAll(async () => {
  await setupDb();
  await URL.createIndexes();
});
afterAll(async () => await teardownDb());
beforeEach(async () => await resetDb());

describe("Create URL", () => {
  const mockUserId = new mongoose.Types.ObjectId();

  it("should create a URL document with minimal required data", async () => {
    const urlData = {
      userId: mockUserId,
      shortId: "abc123",
      redirectUrl: "https://example.com",
    };

    const url = await URL.create(urlData);

    expect(url).toBeDefined();
    expect(url._id).toBeDefined();
    expect(url.shortId).toBe("abc123");
    expect(url.redirectUrl).toBe("https://example.com");
    expect(url.userId.toString()).toBe(mockUserId.toString());
  });

  it("should set default values correctly", async () => {
    const url = await URL.create({
      userId: mockUserId,
      shortId: "default123",
      redirectUrl: "https://example.com",
    });

    expect(url.isDeleted).toBe(false);
    expect(url.visitHistory).toEqual([]);
    expect(url.qrCode).toBeUndefined();
  });

  it("should have timestamps after creation", async () => {
    const url = await URL.create({
      userId: mockUserId,
      shortId: "time123",
      redirectUrl: "https://example.com",
    });

    expect(url.createdAt).toBeDefined();
    expect(url.updatedAt).toBeDefined();
    expect(url.createdAt).toBeInstanceOf(Date);
    expect(url.updatedAt).toBeInstanceOf(Date);
  });

  it("should fail when shortId is missing", async () => {
    const urlData = {
      userId: mockUserId,
      redirectUrl: "https://example.com",
    };

    await expect(URL.create(urlData)).rejects.toThrow();
  });

  it("should fail when redirectUrl is missing", async () => {
    const urlData = {
      userId: mockUserId,
      shortId: "nourl123",
    };

    await expect(URL.create(urlData)).rejects.toThrow();
  });

  it("should fail when userId is missing", async () => {
    const urlData = {
      shortId: "nouser123",
      redirectUrl: "https://example.com",
    };

    await expect(URL.create(urlData)).rejects.toThrow();
  });

  it("should enforce unique shortId constraint", async () => {
    const urlData = {
      userId: mockUserId,
      shortId: "unique123",
      redirectUrl: "https://example.com",
    };

    await URL.create(urlData);

    const duplicateData = {
      userId: new mongoose.Types.ObjectId(),
      shortId: "unique123",
      redirectUrl: "https://different.com",
    };

    await expect(URL.create(duplicateData)).rejects.toThrow();
  });

  it("should allow same redirectUrl with different shortIds", async () => {
    const sameUrl = "https://example.com";

    const url1 = await URL.create({
      userId: mockUserId,
      shortId: "first123",
      redirectUrl: sameUrl,
    });

    const url2 = await URL.create({
      userId: mockUserId,
      shortId: "second123",
      redirectUrl: sameUrl,
    });

    expect(url1.shortId).not.toBe(url2.shortId);
    expect(url1.redirectUrl).toBe(url2.redirectUrl);
  });

  it("should create URL with optional qrCode", async () => {
    const url = await URL.create({
      userId: mockUserId,
      shortId: "qr123",
      redirectUrl: "https://example.com",
      qrCode: "data:image/png;base64,somedata",
    });

    expect(url.qrCode).toBe("data:image/png;base64,somedata");
  });

  it("should enforce unique qrCode when provided", async () => {
    const qrCodeData = "data:image/png;base64,uniqueqr";

    await URL.create({
      userId: mockUserId,
      shortId: "qr1",
      redirectUrl: "https://example1.com",
      qrCode: qrCodeData,
    });

    await expect(
      URL.create({
        userId: mockUserId,
        shortId: "qr2",
        redirectUrl: "https://example2.com",
        qrCode: qrCodeData,
      })
    ).rejects.toThrow();
  });

  it("should allow multiple URLs without qrCode (sparse unique)", async () => {
    const url1 = await URL.create({
      userId: mockUserId,
      shortId: "noqr1",
      redirectUrl: "https://example1.com",
    });

    const url2 = await URL.create({
      userId: mockUserId,
      shortId: "noqr2",
      redirectUrl: "https://example2.com",
    });

    expect(url1.qrCode).toBeUndefined();
    expect(url2.qrCode).toBeUndefined();
  });
});
