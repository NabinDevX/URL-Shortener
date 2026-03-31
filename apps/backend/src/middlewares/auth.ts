import jwt from "jsonwebtoken";
import User from "@/models/user";
import { safeRedisOperation } from "@/utils/redisClient";
import { ApiError } from "@/utils/apiError";
import type {
  Context,
  AuthenticatedContext,
  JWTPayload,
  IUserDocument,
} from "@/types";

export const verifyAuth = async (
  ctx: Context
): Promise<AuthenticatedContext> => {
  const token =
    ctx.req.cookies?.accessToken ||
    ctx.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  const isBlacklisted = await safeRedisOperation(async (client) => {
    return await client.get(`bl_${token}`);
  });

  if (isBlacklisted) {
    throw new ApiError(401, "Token has been logged out");
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
      throw new ApiError(401, "Invalid Access Token");
    }

    return {
      ...ctx,
      user: user as IUserDocument,
      token,
    };
  } catch {
    throw new ApiError(401, "Unauthorized request");
  }
};

export const blacklistToken = async (token: string): Promise<void> => {
  try {
    const decoded = jwt.decode(token) as JWTPayload | null;
    if (decoded?.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await safeRedisOperation(async (client) => {
          await client.setEx(`bl_${token}`, ttl, "blacklisted");
        });
      }
    }
  } catch {
    console.log("Redis blacklist failed");
  }
};
