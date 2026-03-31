import mongoose from "mongoose";
import { setupDb, teardownDb, resetDb } from "../__helpers__/setupTestDb";
import User from "@/models/user";
import jwt from "jsonwebtoken";

beforeAll(async () => {
  await setupDb();
});
afterAll(async () => await teardownDb());
beforeEach(async () => await resetDb());

describe("User Authentication", () => {
  describe("User Creation and Signup", () => {
    it("should create a new user with email, password, and name", async () => {
      const testEmail = "test@example.com";
      const testPassword = "password123";
      const testName = "Test User";

      const user = await User.create({
        email: testEmail,
        password: testPassword,
        name: testName,
      });

      expect(user).toBeDefined();
      expect(user.email).toBe(testEmail);
      expect(user.name).toBe(testName);
      expect(user.password).not.toBe(testPassword);
    });

    it("should hash password on creation", async () => {
      const plainPassword = "mySecurePassword";
      const user = await User.create({
        email: "hashtest@example.com",
        password: plainPassword,
        name: "Hash Test",
      });

      expect(user.password).not.toBe(plainPassword);
      expect(user.password).toBeDefined();
    });

    it("should enforce unique email", async () => {
      const email = "unique@example.com";

      await User.create({
        email,
        password: "password123",
        name: "First User",
      });

      try {
        await User.create({
          email,
          password: "password456",
          name: "Second User",
        });
        fail("Should have thrown duplicate email error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should set refreshToken to empty string on creation", async () => {
      const user = await User.create({
        email: "refresh@example.com",
        password: "password123",
        name: "Refresh Test",
      });

      expect(user.refreshToken).toBe("");
    });
  });

  describe("Password Management", () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await User.create({
        email: "password@example.com",
        password: "oldPassword123",
        name: "Password Test",
      });
    });

    it("should verify correct password", async () => {
      const isPasswordValid =
        await testUser.isPasswordCorrect("oldPassword123");
      expect(isPasswordValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const isPasswordValid = await testUser.isPasswordCorrect("wrongPassword");
      expect(isPasswordValid).toBe(false);
    });

    it("should update password and keep previous passwords invalid", async () => {
      const oldPassword = testUser.password;
      testUser.password = "newPassword123";
      await testUser.save();

      const isOldPasswordValid =
        await testUser.isPasswordCorrect("oldPassword123");
      const isNewPasswordValid =
        await testUser.isPasswordCorrect("newPassword123");

      expect(isOldPasswordValid).toBe(false);
      expect(isNewPasswordValid).toBe(true);
    });
  });

  describe("Token Management", () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await User.create({
        email: "token@example.com",
        password: "password123",
        name: "Token Test",
      });
    });

    it("should generate access token", async () => {
      const accessToken = await testUser.generateAccessToken();

      expect(accessToken).toBeDefined();
      expect(typeof accessToken).toBe("string");

      const decoded = jwt.verify(
        accessToken,
        process.env.USER_SECRET_ACCESS_TOKEN as string
      ) as any;
      expect(decoded._id).toBe(testUser._id.toString());
      expect(decoded.email).toBe(testUser.email);
    });

    it("should generate refresh token", async () => {
      const refreshToken = await testUser.generateRefreshToken();

      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe("string");

      const decoded = jwt.verify(
        refreshToken,
        process.env.USER_SECRET_REFRESH_TOKEN as string
      ) as any;
      expect(decoded._id).toBe(testUser._id.toString());
    });

    it("should store refresh token on user", async () => {
      const refreshToken = await testUser.generateRefreshToken();
      testUser.refreshToken = refreshToken;
      await testUser.save();

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.refreshToken).toBe(refreshToken);
    });
  });

  describe("API Key Management", () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await User.create({
        email: "apikey@example.com",
        password: "password123",
        name: "API Key Test",
      });
    });

    it("should generate API key", async () => {
      const apiKey = testUser.generateApiKey();

      expect(apiKey).toBeDefined();
      expect(typeof apiKey).toBe("string");
      expect(apiKey.length).toBeGreaterThan(0);
    });

    it("should generate API key with custom expiry", async () => {
      const apiKey = testUser.generateApiKey(30);

      expect(apiKey).toBeDefined();
      expect(testUser.apiKeyExpiresAt).toBeDefined();

      const expiryTime = testUser.apiKeyExpiresAt.getTime();
      const now = Date.now();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;

      expect(expiryTime - now).toBeLessThan(thirtyDays + 1000);
      expect(expiryTime - now).toBeGreaterThan(thirtyDays - 1000);
    });

    it("should store API key on user after generation", async () => {
      const apiKey = testUser.generateApiKey();
      await testUser.save();

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser?.apiKey).toBe(apiKey);
    });
  });

  describe("Google OAuth Integration", () => {
    it("should create user with Google ID", async () => {
      const user = await User.create({
        googleId: "google_123456",
        email: "google@example.com",
        name: "Google User",
        emailVerified: true,
      });

      expect(user.googleId).toBe("google_123456");
      expect(user.emailVerified).toBe(true);
    });

    it("should support user with both password and Google ID", async () => {
      const user = await User.create({
        email: "hybrid@example.com",
        password: "password123",
        name: "Hybrid User",
        googleId: "google_789",
      });

      expect(user.googleId).toBe("google_789");
      expect(user.password).toBeDefined();
    });
  });

  describe("User Data Access", () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await User.create({
        email: "access@example.com",
        password: "password123",
        name: "Access Test",
      });
    });

    it("should exclude sensitive fields with select", async () => {
      const user = await User.findById(testUser._id).select(
        "-password -refreshToken"
      );

      expect(user?.password).toBeUndefined();
      expect(user?.refreshToken).toBeUndefined();
      expect(user?.email).toBe(testUser.email);
    });

    it("should find user by email", async () => {
      const user = await User.findOne({ email: "access@example.com" });

      expect(user).toBeDefined();
      expect(user?.email).toBe("access@example.com");
      expect(user?._id.toString()).toBe(testUser._id.toString());
    });

    it("should find user by API key", async () => {
      const apiKey = testUser.generateApiKey();
      testUser.apiKey = apiKey;
      await testUser.save();

      const user = await User.findOne({ apiKey });

      expect(user).toBeDefined();
      expect(user?._id.toString()).toBe(testUser._id.toString());
    });
  });

  describe("User Account Status", () => {
    it("should soft delete user by setting isDeleted", async () => {
      const user = await User.create({
        email: "delete@example.com",
        password: "password123",
        name: "Delete Test",
      });

      user.isDeleted = true;
      await user.save();

      const deletedUser = await User.findById(user._id);
      expect(deletedUser?.isDeleted).toBe(true);
    });

    it("should find active users (non-deleted)", async () => {
      await User.create({
        email: "active1@example.com",
        password: "password123",
        name: "Active User 1",
        isDeleted: false,
      });

      await User.create({
        email: "active2@example.com",
        password: "password123",
        name: "Active User 2",
        isDeleted: true,
      });

      const activeUsers = await User.find({ isDeleted: false });

      expect(activeUsers.length).toBe(1);
      expect(activeUsers[0]!.email).toBe("active1@example.com");
    });
  });

  describe("User Account Updates", () => {
    let testUser: any;

    beforeEach(async () => {
      testUser = await User.create({
        email: "update@example.com",
        password: "password123",
        name: "Update Test",
      });
    });

    it("should update user name", async () => {
      testUser.name = "Updated Name";
      await testUser.save();

      const updated = await User.findById(testUser._id);
      expect(updated?.name).toBe("Updated Name");
    });

    it("should update user email", async () => {
      testUser.email = "newemail@example.com";
      await testUser.save();

      const updated = await User.findById(testUser._id);
      expect(updated?.email).toBe("newemail@example.com");
    });

    it("should update emailVerified status", async () => {
      testUser.emailVerified = true;
      await testUser.save();

      const updated = await User.findById(testUser._id);
      expect(updated?.emailVerified).toBe(true);
    });
  });
});
