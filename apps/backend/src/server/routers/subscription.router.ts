import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import * as subscriptionController from "@/controllers/subscription.controller";
import { handleError } from "@/utils/errorHandler";

const createSubscriptionInputSchema = z.object({
  planId: z.enum(["basic_20", "pro_50"]),
  customerId: z.string().optional(),
  totalCount: z.number().optional(),
});

const createSubscriptionOutputSchema = z.object({
  subscriptionId: z.string(),
  orderId: z.string(),
  amount: z.number(),
  currency: z.string(),
  planId: z.string(),
  firstName: z.string(),
  email: z.string(),
  contact: z.string(),
});

const planSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
});

const subscriptionSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  razorpaySubscriptionId: z.string().optional(),
  planId: z.enum(["basic_20", "pro_50"]),
  status: z.enum(["active", "paused", "cancelled", "expired", "halted"]),
  currentPeriodStart: z.date().optional(),
  currentPeriodEnd: z.date().optional(),
  nextBillingDate: z.date().optional(),
  cancelledAt: z.date().optional(),
  pausedAt: z.date().optional(),
  totalPaid: z.number(),
  totalPayments: z.number(),
  isDeleted: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const getSubscriptionOutputSchema = z.object({
  subscription: subscriptionSchema.nullable(),
  plan: planSchema.nullable(),
});

const getPlansOutputSchema = z.object({
  plans: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      amount: z.number(),
      period: z.string(),
      description: z.string(),
    })
  ),
});

const cancelSubscriptionOutputSchema = z.object({
  message: z.string(),
  cancelledAt: z.date(),
});

const pauseSubscriptionOutputSchema = z.object({
  message: z.string(),
  pausedAt: z.date(),
});

const resumeSubscriptionOutputSchema = z.object({
  message: z.string(),
  status: z.string(),
});

export const subscriptionRouter = router({
  createSubscription: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/subscription/create",
        tags: ["Subscription"],
        description: "Create a new subscription",
        protect: true,
      },
    })
    .input(createSubscriptionInputSchema)
    .output(createSubscriptionOutputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await subscriptionController.createSubscription(input, ctx.user);
      } catch (error) {
        throw handleError(error);
      }
    }),

  getSubscription: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/subscription",
        tags: ["Subscription"],
        description: "Get current subscription details",
        protect: true,
      },
    })
    .input(z.void())
    .output(getSubscriptionOutputSchema)
    .query(async ({ ctx }) => {
      try {
        return await subscriptionController.getSubscription(ctx.user);
      } catch (error) {
        throw handleError(error);
      }
    }),

  getPlans: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/subscription/plans",
        tags: ["Subscription"],
        description: "Get all available subscription plans",
        protect: true,
      },
    })
    .input(z.void())
    .output(getPlansOutputSchema)
    .query(async () => {
      try {
        return subscriptionController.getSubscriptionPlans();
      } catch (error) {
        throw handleError(error);
      }
    }),

  cancelSubscription: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/subscription/cancel",
        tags: ["Subscription"],
        description: "Cancel current subscription",
        protect: true,
      },
    })
    .input(z.void())
    .output(cancelSubscriptionOutputSchema)
    .mutation(async ({ ctx }) => {
      try {
        return await subscriptionController.cancelSubscription(ctx.user);
      } catch (error) {
        throw handleError(error);
      }
    }),

  pauseSubscription: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/subscription/pause",
        tags: ["Subscription"],
        description: "Pause current subscription",
        protect: true,
      },
    })
    .input(z.void())
    .output(pauseSubscriptionOutputSchema)
    .mutation(async ({ ctx }) => {
      try {
        return await subscriptionController.pauseSubscription(ctx.user);
      } catch (error) {
        throw handleError(error);
      }
    }),

  resumeSubscription: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/subscription/resume",
        tags: ["Subscription"],
        description: "Resume paused subscription",
        protect: true,
      },
    })
    .input(z.void())
    .output(resumeSubscriptionOutputSchema)
    .mutation(async ({ ctx }) => {
      try {
        return await subscriptionController.resumeSubscription(ctx.user);
      } catch (error) {
        throw handleError(error);
      }
    }),

  getSubscriptionHistory: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/subscription/history",
        tags: ["Subscription"],
        description: "Get subscription history",
        protect: true,
      },
    })
    .input(z.void())
    .output(z.array(subscriptionSchema.extend({ plan: planSchema.optional() })))
    .query(async ({ ctx }) => {
      try {
        return await subscriptionController.getSubscriptionHistory(ctx.user);
      } catch (error) {
        throw handleError(error);
      }
    }),
});

export type SubscriptionRouter = typeof subscriptionRouter;
