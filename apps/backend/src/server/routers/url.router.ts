import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import * as urlController from "@/controllers/url.controller";
import { handleError } from "@/utils/errorHandler";

const visitHistorySchema = z.object({
  timestamp: z.date(),
});

const paginationInputSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const paginationOutputSchema = z.object({
  currentPage: z.number(),
  totalPages: z.number(),
  totalDocs: z.number(),
  limit: z.number().optional(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
  nextPage: z.number().nullable().optional(),
  prevPage: z.number().nullable().optional(),
});

const generateShortURLInputSchema = z.object({
  url: z.string().url("Invalid URL format"),
  customShortId: z
    .string()
    .min(3, "Custom short ID must be at least 3 characters")
    .max(20, "Custom short ID must not exceed 20 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Custom short ID can only contain letters, numbers, hyphens, and underscores"
    )
    .optional(),
  idLength: z.number().int().min(4).max(15).optional(),
});

const generateShortURLOutputSchema = z.object({
  shortId: z.string(),
  redirectUrl: z.string(),
  fullShortUrl: z.string(),
  isExisting: z.boolean().optional(),
  isCustom: z.boolean().optional(),
});

const shortIdInputSchema = z.object({
  shortId: z.string().min(1, "Short ID is required"),
});

const analyticsOutputSchema = z.object({
  totalClicks: z.number(),
  analytics: z.array(visitHistorySchema),
});

const updateShortURLInputSchema = z.object({
  shortId: z.string().min(1, "Short ID is required"),
  qrCode: z.string().min(1, "QR Code cannot be empty"),
});

const updateShortURLOutputSchema = z.object({
  shortId: z.string(),
  redirectUrl: z.string(),
  qrCode: z.string(),
  qrGenerated: z.boolean(),
  fullShortUrl: z.string(),
  updatedAt: z.date(),
});

const urlWithAnalyticsSchema = z.object({
  shortId: z.string(),
  redirectUrl: z.string(),
  qrCode: z.string().optional(),
  qrGenerated: z.boolean().default(false),
  totalClicks: z.number(),
  lastVisit: z.date().nullable().optional(),
  firstVisit: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  visitHistory: z.array(visitHistorySchema),
});

const getAllUrlsOutputSchema = z.object({
  urls: z.array(urlWithAnalyticsSchema),
  totalUrls: z.number(),
  totalClicks: z.number(),
  pagination: paginationOutputSchema,
});

const deleteURLOutputSchema = z.object({
  shortId: z.string(),
  isDeleted: z.boolean(),
});

export const urlRouter = router({
  generateShortURL: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/url",
        tags: ["URL"],
        description: "Generate a new short URL",
        protect: true,
      },
    })
    .input(generateShortURLInputSchema)
    .output(generateShortURLOutputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await urlController.generateShortURL(input, ctx.user);
      } catch (error) {
        throw handleError(error);
      }
    }),

  getAnalytics: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/url/analytics/{shortId}",
        tags: ["URL"],
        description: "Get analytics for a short URL",
        protect: true,
      },
    })
    .input(shortIdInputSchema)
    .output(analyticsOutputSchema)
    .query(async ({ input }) => {
      try {
        return await urlController.getAnalytics(input.shortId);
      } catch (error) {
        throw handleError(error);
      }
    }),

  updateShortURL: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/url/update/{shortId}",
        tags: ["URL"],
        description: "Update QR code for a short URL",
        protect: true,
      },
    })
    .input(updateShortURLInputSchema)
    .output(updateShortURLOutputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await urlController.updateShortURL(input, ctx.user);
      } catch (error) {
        throw handleError(error);
      }
    }),

  getAllUrls: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/url/user/all",
        tags: ["URL"],
        description: "Get all URLs for the current user",
        protect: true,
      },
    })
    .input(paginationInputSchema)
    .output(getAllUrlsOutputSchema)
    .query(async ({ input, ctx }) => {
      try {
        const { page, limit, sortBy, sortOrder } = input;
        return await urlController.getAllUrls(
          ctx.user,
          page,
          limit,
          sortBy,
          sortOrder
        );
      } catch (error) {
        throw handleError(error);
      }
    }),

  deleteURL: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/url/{shortId}",
        tags: ["URL"],
        description: "Delete or restore a short URL",
        protect: true,
      },
    })
    .input(shortIdInputSchema)
    .output(deleteURLOutputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await urlController.deleteURL(input.shortId, ctx.user);
      } catch (error) {
        throw handleError(error);
      }
    }),
});

export type UrlRouter = typeof urlRouter;
