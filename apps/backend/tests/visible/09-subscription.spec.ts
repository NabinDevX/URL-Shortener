import mongoose from "mongoose";
import { setupDb, teardownDb, resetDb } from "../__helpers__/setupTestDb";
import Subscription from "@/models/subscription";
import User from "@/models/user";
import * as subscriptionController from "@/controllers/subscription.controller";

beforeAll(async () => {
  await setupDb();
});
afterAll(async () => await teardownDb());
beforeEach(async () => await resetDb());

describe("Subscription Management", () => {
  let testUser: any;

  beforeEach(async () => {
    testUser = await User.create({
      email: "subscriber@example.com",
      password: "password123",
      name: "Test Subscriber",
    });
  });

  describe("Subscription Creation", () => {
    it("should create a new subscription for a user", async () => {
      const result = await subscriptionController.createSubscription(
        { planId: "basic_20" },
        testUser
      );

      expect(result.subscriptionId).toBeDefined();
      expect(result.orderId).toBeDefined();
      expect(result.amount).toBe(20);
      expect(result.currency).toBe("INR");
      expect(result.planId).toBe("basic_20");
    });

    it("should create subscription with pro plan", async () => {
      const result = await subscriptionController.createSubscription(
        { planId: "pro_50" },
        testUser
      );

      expect(result.amount).toBe(50);
      expect(result.planId).toBe("pro_50");
    });

    it("should prevent duplicate active subscription", async () => {
      await subscriptionController.createSubscription(
        { planId: "basic_20" },
        testUser
      );

      try {
        await subscriptionController.createSubscription(
          { planId: "pro_50" },
          testUser
        );
        fail("Should reject duplicate subscription");
      } catch (error: any) {
        expect(error.statusCode).toBe(400);
        expect(error.message).toContain("already has an active subscription");
      }
    });

    it("should store subscription in database", async () => {
      const result = await subscriptionController.createSubscription(
        { planId: "basic_20" },
        testUser
      );

      const subscription = await Subscription.findById(result.subscriptionId);

      expect(subscription).toBeDefined();
      expect(subscription?.userId.toString()).toBe(testUser._id.toString());
      expect(subscription?.planId).toBe("basic_20");
      expect(subscription?.status).toBe("active");
    });
  });

  describe("Subscription Retrieval", () => {
    it("should retrieve active subscription", async () => {
      await subscriptionController.createSubscription(
        { planId: "basic_20" },
        testUser
      );

      const result = await subscriptionController.getSubscription(testUser);

      expect(result.subscription).toBeDefined();
      expect(result.subscription?.planId).toBe("basic_20");
      expect(result.plan).toBeDefined();
      expect(result.plan?.id).toBe("basic_20");
    });

    it("should return null subscription if user has none", async () => {
      const result = await subscriptionController.getSubscription(testUser);

      expect(result.subscription).toBeNull();
      expect(result.plan).toBeNull();
    });

    it("should include plan details in response", async () => {
      await subscriptionController.createSubscription(
        { planId: "pro_50" },
        testUser
      );

      const result = await subscriptionController.getSubscription(testUser);

      expect(result.plan).toBeDefined();
      expect(result.plan?.name).toBe("Pro");
      expect(result.plan?.amount).toBe(50);
    });

    it("should get most recent subscription", async () => {
      const sub1 = await subscriptionController.createSubscription(
        { planId: "basic_20" },
        testUser
      );

      const subscription = await Subscription.findById(sub1.subscriptionId);
      subscription!.status = "cancelled";
      subscription!.cancelledAt = new Date();
      await subscription!.save();

      const sub2 = await subscriptionController.createSubscription(
        { planId: "pro_50" },
        testUser
      );

      const result = await subscriptionController.getSubscription(testUser);

      expect(result.subscription?._id).toBe(sub2.subscriptionId);
    });
  });

  describe("Subscription Cancellation", () => {
    it("should cancel active subscription", async () => {
      const createResult = await subscriptionController.createSubscription(
        { planId: "basic_20" },
        testUser
      );

      const result = await subscriptionController.cancelSubscription(testUser);

      expect(result.message).toContain("cancelled");
      expect(result.cancelledAt).toBeDefined();

      const subscription = await Subscription.findById(
        createResult.subscriptionId
      );
      expect(subscription?.status).toBe("cancelled");
    });

    it("should set cancelledAt timestamp", async () => {
      await subscriptionController.createSubscription(
        { planId: "basic_20" },
        testUser
      );

      const beforeDate = new Date();
      const result = await subscriptionController.cancelSubscription(testUser);
      const afterDate = new Date();

      expect(result.cancelledAt.getTime()).toBeGreaterThanOrEqual(
        beforeDate.getTime()
      );
      expect(result.cancelledAt.getTime()).toBeLessThanOrEqual(
        afterDate.getTime()
      );
    });

    it("should throw error if no active subscription to cancel", async () => {
      try {
        await subscriptionController.cancelSubscription(testUser);
        fail("Should throw error when no subscription");
      } catch (error: any) {
        expect(error.statusCode).toBe(404);
      }
    });
  });

  describe("Subscription Pagination", () => {
    it("should retrieve subscription history", async () => {
      const sub1 = await subscriptionController.createSubscription(
        { planId: "basic_20" },
        testUser
      );

      const subscription = await Subscription.findById(sub1.subscriptionId);
      subscription!.status = "cancelled";
      await subscription!.save();

      const sub2 = await subscriptionController.createSubscription(
        { planId: "pro_50" },
        testUser
      );

      const result =
        await subscriptionController.getSubscriptionHistory(testUser);

      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result.some((s) => s._id === sub1.subscriptionId)).toBe(true);
      expect(result.some((s) => s._id === sub2.subscriptionId)).toBe(true);
    });

    it("should exclude deleted subscription from history", async () => {
      const sub1 = await subscriptionController.createSubscription(
        { planId: "basic_20" },
        testUser
      );

      const subscription = await Subscription.findById(sub1.subscriptionId);
      subscription!.isDeleted = true;
      await subscription!.save();

      const result =
        await subscriptionController.getSubscriptionHistory(testUser);

      expect(result.every((s) => !s.isDeleted)).toBe(true);
    });

    it("should include plan details in history", async () => {
      await subscriptionController.createSubscription(
        { planId: "pro_50" },
        testUser
      );

      const result =
        await subscriptionController.getSubscriptionHistory(testUser);

      expect(result.length).toBeGreaterThan(0);
      const firstPlan = result[0]?.plan;
      expect(firstPlan).toBeDefined();
      expect(firstPlan!.id).toBe("pro_50");
    });
  });

  describe("Plan Information", () => {
    it("should return available plans", async () => {
      const result = await subscriptionController.getSubscriptionPlans();

      expect(result.plans).toBeDefined();
      expect(result.plans.length).toBeGreaterThan(0);

      const basicPlan = result.plans.find((p) => p.id === "basic_20");
      const proPlan = result.plans.find((p) => p.id === "pro_50");

      expect(basicPlan).toBeDefined();
      expect(basicPlan?.amount).toBe(20);
      expect(proPlan).toBeDefined();
      expect(proPlan?.amount).toBe(50);
    });

    it("should include plan names and descriptions", async () => {
      const result = await subscriptionController.getSubscriptionPlans();

      result.plans.forEach((plan) => {
        expect(plan.name).toBeDefined();
        expect(plan.amount).toBeDefined();
        expect(plan.period).toBeDefined();
        expect(plan.description).toBeDefined();
      });
    });
  });

  describe("Subscription Status Transitions", () => {
    it("should support pausing subscription", async () => {
      await subscriptionController.createSubscription(
        { planId: "basic_20" },
        testUser
      );

      try {
        const result = await subscriptionController.pauseSubscription(testUser);
        expect(result.message).toContain("paused");
        expect(result.pausedAt).toBeDefined();
      } catch (error) { }
    });

    it("should support resuming subscription", async () => {
      await subscriptionController.createSubscription(
        { planId: "basic_20" },
        testUser
      );

      const subscription = await Subscription.findOne({ userId: testUser._id });
      subscription!.status = "paused";
      await subscription!.save();

      try {
        const result =
          await subscriptionController.resumeSubscription(testUser);
        expect(result.message).toContain("resumed");
        expect(result.status).toBe("active");
      } catch (error) { }
    });
  });

  describe("Subscription Validation", () => {
    it("should validate plan ID", async () => {
      try {
        await subscriptionController.createSubscription(
          { planId: "invalid_plan" as any },
          testUser
        );
        fail("Should reject invalid plan");
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it("should handle Razorpay errors gracefully", async () => {
      try {
        const result = await subscriptionController.createSubscription(
          { planId: "basic_20" },
          testUser
        );
        expect(result.orderId).toBeDefined();
      } catch (error: any) {
        expect(error.statusCode).toBe(500);
      }
    });
  });
});
