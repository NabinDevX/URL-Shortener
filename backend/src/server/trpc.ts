import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";
import type { Context, JWTPayload, IUserDocument } from "@/types";
import jwt from "jsonwebtoken";
import User from "@/models/user";
import { safeRedisOperation } from "@/utils/redisClient";
import { apiKeyRateLimitMiddleware } from "@/middlewares/rateLimit";

const t = initTRPC.context<Context>().meta<OpenApiMeta>().create();

const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  const apiKey = ctx.req.header("x-api-key");
  
  if (apiKey) {
    const user = await User.findOne({ apiKey, isDeleted: false }).select(
      "-password -refreshToken"
    );
    
    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid API key",
      });
    }
    if (user.apiKeyExpiresAt && new Date() > user.apiKeyExpiresAt) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "API key has expired. Please regenerate your API key.",
      });
    }
    await apiKeyRateLimitMiddleware(user as IUserDocument);
    
    return next({
      ctx: {
        ...ctx,
        user: user as IUserDocument,
        token: "", // No token for API key auth
      },
    });
  }
  const token =
    ctx.req.cookies?.accessToken ||
    ctx.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unauthorized request",
    });
  }

  const isBlacklisted = await safeRedisOperation(async (client) => {
    return await client.get(`bl_${token}`);
  });

  if (isBlacklisted) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Token has been logged out",
    });
  }

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.USER_SECRET_ACCESS_TOKEN as string
    ) as JWTPayload;

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid Access Token",
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: user as IUserDocument,
        token,
      },
    });
  } catch (error) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unauthorized request",
    });
  }
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthenticated);
export const middleware = t.middleware;
