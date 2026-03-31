import mongoose from "mongoose";
import { setupDb, teardownDb, resetDb } from "../__helpers__/setupTestDb";
import { URL } from "@/models/url";

beforeAll(async () => {
  await setupDb();
  await URL.createIndexes();
});
afterAll(async () => await teardownDb());
beforeEach(async () => await resetDb());

describe("Update URL", () => {
  const mockUserId = new mongoose.Types.ObjectId();
  const initialRedirectUrl = "https://example.com/initial";
  const updatedRedirectUrl = "https://example.com/updated";

  it("should update redirectUrl successfully", async () => {
    const url = await URL.create({
      userId: mockUserId,
      shortId: "update123",
      redirectUrl: initialRedirectUrl,
    });

    url.redirectUrl = updatedRedirectUrl;
    await url.save();

    const updatedUrl = await URL.findById(url._id);
    expect(updatedUrl?.redirectUrl).toBe(updatedRedirectUrl);
  });

  it("should update qrCode successfully", async () => {
    const url = await URL.create({
      userId: mockUserId,
      shortId: "qrupdate",
      redirectUrl: initialRedirectUrl,
    });

    url.qrCode = "data:image/png;base64,newqrcode";
    await url.save();

    const updatedUrl = await URL.findById(url._id);
    expect(updatedUrl?.qrCode).toBe("data:image/png;base64,newqrcode");
  });

  it("should update isDeleted for soft delete", async () => {
    const url = await URL.create({
      userId: mockUserId,
      shortId: "softdelete",
      redirectUrl: initialRedirectUrl,
    });

    expect(url.isDeleted).toBe(false);

    url.isDeleted = true;
    await url.save();

    const deletedUrl = await URL.findById(url._id);
    expect(deletedUrl?.isDeleted).toBe(true);
  });

  it("should update updatedAt timestamp on save", async () => {
    const url = await URL.create({
      userId: mockUserId,
      shortId: "timestamp",
      redirectUrl: initialRedirectUrl,
    });

    const originalUpdatedAt = url.updatedAt;

    await new Promise((resolve) => setTimeout(resolve, 10));

    url.redirectUrl = updatedRedirectUrl;
    await url.save();

    const updatedUrl = await URL.findById(url._id);
    expect(updatedUrl?.updatedAt.getTime()).toBeGreaterThan(
      originalUpdatedAt.getTime()
    );
  });

  it("should not change createdAt on update", async () => {
    const url = await URL.create({
      userId: mockUserId,
      shortId: "createdat",
      redirectUrl: initialRedirectUrl,
    });

    const originalCreatedAt = url.createdAt;

    await new Promise((resolve) => setTimeout(resolve, 10));

    url.redirectUrl = updatedRedirectUrl;
    await url.save();

    const updatedUrl = await URL.findById(url._id);
    expect(updatedUrl?.createdAt.getTime()).toBe(originalCreatedAt.getTime());
  });

  it("should use findByIdAndUpdate correctly", async () => {
    const url = await URL.create({
      userId: mockUserId,
      shortId: "findupdate",
      redirectUrl: initialRedirectUrl,
    });

    const updatedUrl = await URL.findByIdAndUpdate(
      url._id,
      { redirectUrl: updatedRedirectUrl },
      { new: true }
    );

    expect(updatedUrl?.redirectUrl).toBe(updatedRedirectUrl);
  });

  it("should use findOneAndUpdate with query", async () => {
    await URL.create({
      userId: mockUserId,
      shortId: "findone",
      redirectUrl: initialRedirectUrl,
    });

    const updatedUrl = await URL.findOneAndUpdate(
      { shortId: "findone", userId: mockUserId },
      { redirectUrl: updatedRedirectUrl },
      { new: true }
    );

    expect(updatedUrl?.redirectUrl).toBe(updatedRedirectUrl);
  });
});

describe("Add to Visit History", () => {
  const mockUserId = new mongoose.Types.ObjectId();
  const redirectUrl = "https://example.com/visit";

  it("should add visit to visitHistory", async () => {
    const url = await URL.create({
      userId: mockUserId,
      shortId: "visit123",
      redirectUrl,
    });

    expect(url.visitHistory.length).toBe(0);

    url.visitHistory.push({ timestamp: new Date() });
    await url.save();

    const updatedUrl = await URL.findById(url._id);
    expect(updatedUrl?.visitHistory.length).toBe(1);
  });

  it("should record multiple visits", async () => {
    const url = await URL.create({
      userId: mockUserId,
      shortId: "multivisit",
      redirectUrl,
    });

    url.visitHistory.push({ timestamp: new Date() });
    await url.save();

    url.visitHistory.push({ timestamp: new Date() });
    await url.save();

    url.visitHistory.push({ timestamp: new Date() });
    await url.save();

    const updatedUrl = await URL.findById(url._id);
    expect(updatedUrl?.visitHistory.length).toBe(3);
  });

  it("should have timestamp for each visit", async () => {
    const url = await URL.create({
      userId: mockUserId,
      shortId: "timestamps",
      redirectUrl,
    });

    const visitTime = new Date();
    url.visitHistory.push({ timestamp: visitTime });
    await url.save();

    const updatedUrl = await URL.findById(url._id);
    expect(updatedUrl?.visitHistory[0]!.timestamp).toBeDefined();
    expect(updatedUrl?.visitHistory[0]!.timestamp).toBeInstanceOf(Date);
  });

  it("should use $push to add visit atomically", async () => {
    const url = await URL.create({
      userId: mockUserId,
      shortId: "atomic",
      redirectUrl,
    });

    await URL.findByIdAndUpdate(url._id, {
      $push: { visitHistory: { timestamp: new Date() } },
    });

    const updatedUrl = await URL.findById(url._id);
    expect(updatedUrl?.visitHistory.length).toBe(1);
  });
});

describe("Delete URL", () => {
  const mockUserId = new mongoose.Types.ObjectId();
  const redirectUrl = "https://example.com/delete";

  it("should soft delete by setting isDeleted to true", async () => {
    const url = await URL.create({
      userId: mockUserId,
      shortId: "delete123",
      redirectUrl,
    });

    url.isDeleted = true;
    await url.save();

    const deletedUrl = await URL.findById(url._id);
    expect(deletedUrl?.isDeleted).toBe(true);
    expect(deletedUrl).not.toBeNull();
  });

  it("should restore soft deleted URL", async () => {
    const url = await URL.create({
      userId: mockUserId,
      shortId: "restore",
      redirectUrl,
      isDeleted: true,
    });

    expect(url.isDeleted).toBe(true);

    url.isDeleted = false;
    await url.save();

    const restoredUrl = await URL.findById(url._id);
    expect(restoredUrl?.isDeleted).toBe(false);
  });

  it("should hard delete with deleteOne", async () => {
    const url = await URL.create({
      userId: mockUserId,
      shortId: "harddelete",
      redirectUrl,
    });

    await URL.deleteOne({ _id: url._id });

    const deletedUrl = await URL.findById(url._id);
    expect(deletedUrl).toBeNull();
  });

  it("should hard delete with findByIdAndDelete", async () => {
    const url = await URL.create({
      userId: mockUserId,
      shortId: "finddelete",
      redirectUrl,
    });

    await URL.findByIdAndDelete(url._id);

    const deletedUrl = await URL.findById(url._id);
    expect(deletedUrl).toBeNull();
  });

  it("should delete multiple URLs with deleteMany", async () => {
    await URL.create({
      userId: mockUserId,
      shortId: "multi1",
      redirectUrl: `${redirectUrl}/multi1`,
    });
    await URL.create({
      userId: mockUserId,
      shortId: "multi2",
      redirectUrl: `${redirectUrl}/multi2`,
    });

    const result = await URL.deleteMany({ userId: mockUserId });

    expect(result.deletedCount).toBe(2);

    const remaining = await URL.find({ userId: mockUserId });
    expect(remaining.length).toBe(0);
  });

  it("should only delete URLs matching query", async () => {
    await URL.create({
      userId: mockUserId,
      shortId: "keep1",
      redirectUrl: `${redirectUrl}/keep1`,
      isDeleted: false,
    });
    await URL.create({
      userId: mockUserId,
      shortId: "remove1",
      redirectUrl: `${redirectUrl}/remove1`,
      isDeleted: true,
    });
    await URL.create({
      userId: mockUserId,
      shortId: "remove2",
      redirectUrl: `${redirectUrl}/remove2`,
      isDeleted: true,
    });

    await URL.deleteMany({ userId: mockUserId, isDeleted: true });

    const remaining = await URL.find({ userId: mockUserId });
    expect(remaining.length).toBe(1);
    expect(remaining[0]!.shortId).toBe("keep1");
  });
});
