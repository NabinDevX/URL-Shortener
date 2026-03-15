import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import User from "@/models/user";
import redisClient from "@/utils/redisClient";
import { ApiError } from "@/utils/apiError";
import { blacklistToken } from "@/middlewares/auth";
import {
  buildGoogleAuthUrl,
  exchangeCodeForGoogleProfile,
} from "@/utils/googleOAuth";
import type {
  IUserDocument,
  JWTPayload,
  UserSignupInput,
  UserLoginInput,
  GoogleAuthCodeInput,
  GoogleAuthUrlInput,
  ChangePasswordInput,
  UpdateAccountInput,
  DeleteAccountInput,
  AuthTokens,
  UserPublic,
  Context,
} from "@/types";

const generateAccessAndRefreshTokens = async (
  userId: string
): Promise<AuthTokens> => {
  const user = (await User.findById(userId)) as IUserDocument | null;
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const accessToken = await user.generateAccessToken();
  const refreshToken = await user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "none" as const,
});

const formatUserPublic = (user: IUserDocument): UserPublic => ({
  _id: user._id.toString(),
  email: user.email,
  name: user.name,
  authProvider: user.authProvider,
  avatar: user.avatar,
  apiKey: user.apiKey,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const createGooglePassword = (): string =>
  `google_${crypto.randomBytes(24).toString("hex")}`;

const createGoogleAuthResponse = async (
  user: IUserDocument,
  message: string,
  ctx: Context
): Promise<{
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
  message: string;
}> => {
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id.toString()
  );

  const currentUser = await User.findById(user._id).select("-password -refreshToken");
  if (!currentUser) {
    throw new ApiError(404, "User not found");
  }

  ctx.res.cookie("accessToken", accessToken, getCookieOptions());
  ctx.res.cookie("refreshToken", refreshToken, getCookieOptions());

  return {
    user: formatUserPublic(currentUser as IUserDocument),
    accessToken,
    refreshToken,
    message,
  };
};

export const signup = async (
  input: UserSignupInput,
  ctx: Context
): Promise<{
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
  message: string;
}> => {
  const { email, password, name } = input;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const user = await User.create({ name, email, password });
  user.generateApiKey();
  await user.save({ validateBeforeSave: false });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating user");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    createdUser._id.toString()
  );

  ctx.res.cookie("accessToken", accessToken, getCookieOptions());
  ctx.res.cookie("refreshToken", refreshToken, getCookieOptions());

  return {
    user: formatUserPublic(createdUser as IUserDocument),
    accessToken,
    refreshToken,
    message: "User registered successfully",
  };
};

export const login = async (
  input: UserLoginInput,
  ctx: Context
): Promise<{
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
  message: string;
}> => {
  const { email, password } = input;

  const user = (await User.findOne({ email })) as IUserDocument | null;
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (user.authProvider === "google") {
    throw new ApiError(400, "This account uses Google login");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id.toString()
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  ctx.res.cookie("accessToken", accessToken, getCookieOptions());
  ctx.res.cookie("refreshToken", refreshToken, getCookieOptions());

  return {
    user: formatUserPublic(loggedInUser as IUserDocument),
    accessToken,
    refreshToken,
    message: "User logged in successfully",
  };
};

export const getGoogleOAuthUrl = async (
  input: GoogleAuthUrlInput
): Promise<{ authUrl: string; message: string }> => {
  const authUrl = await buildGoogleAuthUrl(input);
  return {
    authUrl,
    message: "Google OAuth URL generated successfully",
  };
};

export const googleRegister = async (
  input: GoogleAuthCodeInput,
  ctx: Context
): Promise<{
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
  message: string;
}> => {
  const profile = await exchangeCodeForGoogleProfile(input.code, input.redirectUri);

  if (!profile.emailVerified) {
    throw new ApiError(400, "Google email is not verified");
  }

  const existingUser = (await User.findOne({ email: profile.email })) as IUserDocument | null;

  if (existingUser) {
    if (existingUser.isDeleted) {
      throw new ApiError(403, "This account has been deleted");
    }

    if (existingUser.authProvider !== "google") {
      throw new ApiError(409, "Account already exists with password login");
    }

    if (existingUser.googleId && existingUser.googleId !== profile.googleId) {
      throw new ApiError(401, "Google account does not match existing account");
    }

    existingUser.googleId = profile.googleId;
    existingUser.avatar = profile.picture;
    existingUser.name = profile.name;
    await existingUser.save({ validateBeforeSave: false });

    return createGoogleAuthResponse(existingUser, "Google user logged in successfully", ctx);
  }

  const user = await User.create({
    email: profile.email,
    name: profile.name,
    password: createGooglePassword(),
    authProvider: "google",
    googleId: profile.googleId,
    avatar: profile.picture,
  });

  user.generateApiKey();
  await user.save({ validateBeforeSave: false });

  return createGoogleAuthResponse(user as IUserDocument, "Google user registered successfully", ctx);
};

export const googleLogin = async (
  input: GoogleAuthCodeInput,
  ctx: Context
): Promise<{
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
  message: string;
}> => {
  const profile = await exchangeCodeForGoogleProfile(input.code, input.redirectUri);

  if (!profile.emailVerified) {
    throw new ApiError(400, "Google email is not verified");
  }

  const user = (await User.findOne({ email: profile.email })) as IUserDocument | null;

  if (!user) {
    throw new ApiError(404, "Google account is not registered");
  }

  if (user.isDeleted) {
    throw new ApiError(403, "This account has been deleted");
  }

  if (user.authProvider !== "google") {
    throw new ApiError(400, "This account uses password login");
  }

  if (user.googleId && user.googleId !== profile.googleId) {
    throw new ApiError(401, "Google account does not match existing account");
  }

  user.googleId = profile.googleId;
  user.avatar = profile.picture;
  user.name = profile.name;
  await user.save({ validateBeforeSave: false });

  return createGoogleAuthResponse(user, "Google user logged in successfully", ctx);
};

export const logout = async (
  user: IUserDocument,
  token: string,
  ctx: Context
): Promise<{ message: string }> => {
  await User.findByIdAndUpdate(
    user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );

  if (token && redisClient) {
    await blacklistToken(token);
  }

  ctx.res.clearCookie("accessToken", getCookieOptions());
  ctx.res.clearCookie("refreshToken", getCookieOptions());

  return { message: "User logged out successfully" };
};

export const refreshAccessToken = async (
  refreshTokenInput: string | undefined,
  ctx: Context
): Promise<AuthTokens & { message: string }> => {
  const incomingRefreshToken =
    ctx.req.cookies?.refreshToken || refreshTokenInput;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.USER_SECRET_REFRESH_TOKEN as string
    ) as JWTPayload;

    const user = (await User.findById(
      decodedToken._id
    )) as IUserDocument | null;

    if (!user) {
      throw new ApiError(401, "Invalid refresh token - user not found");
    }

    if (user.isDeleted) {
      throw new ApiError(401, "User account has been deleted");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id.toString()
    );

    ctx.res.cookie("accessToken", accessToken, getCookieOptions());
    ctx.res.cookie("refreshToken", refreshToken, getCookieOptions());

    return { accessToken, refreshToken, message: "Access token refreshed" };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "Invalid refresh token");
  }
};

export const changePassword = async (
  input: ChangePasswordInput,
  user: IUserDocument
): Promise<{ message: string }> => {
  const { oldPassword, newPassword } = input;

  const fullUser = (await User.findById(user._id)) as IUserDocument | null;
  if (!fullUser) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordCorrect = await fullUser.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  fullUser.password = newPassword;
  await fullUser.save({ validateBeforeSave: false });

  return { message: "Password changed successfully" };
};

export const getCurrentUser = (
  user: IUserDocument
): { user: UserPublic; message: string } => {
  return {
    user: formatUserPublic(user),
    message: "Current user fetched successfully",
  };
};

export const updateAccount = async (
  input: UpdateAccountInput,
  user: IUserDocument
): Promise<{ user: UserPublic; message: string }> => {
  const { name, email } = input;

  if (!name && !email) {
    throw new ApiError(
      400,
      "At least one field (name or email) must be provided for update"
    );
  }

  const updateFields: { name?: string; email?: string } = {};
  if (name) updateFields.name = name;
  if (email) updateFields.email = email;

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { $set: updateFields },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  if (!updatedUser) {
    throw new ApiError(404, "User not found");
  }

  return {
    user: formatUserPublic(updatedUser as IUserDocument),
    message: "Account details updated successfully",
  };
};

export const deleteAccount = async (
  input: DeleteAccountInput,
  user: IUserDocument,
  ctx: Context
): Promise<{ message: string }> => {
  const { password } = input;

  const fullUser = (await User.findById(user._id)) as IUserDocument | null;
  if (!fullUser) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordCorrect = await fullUser.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid password");
  }

  await User.findByIdAndUpdate(
    user._id,
    { $set: { isDeleted: true }, $unset: { refreshToken: 1 } },
    { new: true }
  );

  ctx.res.clearCookie("accessToken", getCookieOptions());
  ctx.res.clearCookie("refreshToken", getCookieOptions());

  return { message: "Account deleted successfully" };
};

export const regenerateApiKey = async (
  user: IUserDocument
): Promise<{ apiKey: string; message: string }> => {
  const fullUser = (await User.findById(user._id)) as IUserDocument | null;
  if (!fullUser) {
    throw new ApiError(404, "User not found");
  }

  const newApiKey = fullUser.generateApiKey();
  await fullUser.save({ validateBeforeSave: false });

  return {
    apiKey: newApiKey,
    message: "API key regenerated successfully",
  };
};

export const getApiKey = (
  user: IUserDocument
): { apiKey: string | undefined; message: string } => {
  return {
    apiKey: user.apiKey,
    message: "API key fetched successfully",
  };
};
