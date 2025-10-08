import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { safeRedisOperation } from "../utils/redisClient.js";
import User from "../models/user.js";

const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) throw new ApiError(401, "Unauthorized request");

    const isBlacklisted = await safeRedisOperation(async (client) => {
      return await client.get(`bl_${token}`);
    });

    if (isBlacklisted) throw new ApiError(401, "Token has been logged out");

    // Verify token
    const decodedToken = jwt.verify(token, process.env.USER_SECRET_ACCESS_TOKEN);

    const user = await User.findById(decodedToken?._id)
      .select("-password -refreshToken");

    if (!user) throw new ApiError(401, "Invalid Access Token");

    req.user = user;
    next();
  } catch (error) {
    console.log(error.massage);
    throw new ApiError(401, "Unauthorized request");
  }
});

export default verifyJWT;
