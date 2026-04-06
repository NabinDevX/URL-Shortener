import { router, publicProcedure, protectedProcedure } from "../trpc";
import { z } from "zod";
import * as userController from "@/controllers/user.controller";
import { sendOtp, sendForgotPasswordOtp, verifyOtp } from "@/middlewares/otp";
import { handleError } from "@/utils/errorHandler";
import {
  getRateLimitInfo,
  MAX_REQUESTS_PER_WINDOW,
  RATE_LIMIT_WINDOW,
} from "@/middlewares/rateLimit";

const userPublicSchema = z.object({
  _id: z.string(),
  email: z.string().email(),
  name: z.string(),
  apiKey: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const sendOtpInputSchema = z.object({
  email: z.string().email("Invalid email format"),
  name: z.string().optional(),
});

const userSignupInputSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const userSigninInputSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const googleAuthUrlInputSchema = z.object({
  mode: z.enum(["signup", "signin"]).optional(),
  state: z.string().optional(),
  redirectUri: z.union([z.literal("postmessage"), z.string().url()]).optional(),
});

const googleAuthCodeInputSchema = z.object({
  code: z.string().min(1, "Google authorization code is required"),
  redirectUri: z.union([z.literal("postmessage"), z.string().url()]).optional(),
});

const googleTokenInputSchema = z.object({
  token: z.string().min(1, "Google ID token is required"),
});

const changePasswordInputSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

const forgotPasswordChangeInputSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

const updateAccountInputSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  otp: z.string().length(6).optional(),
});

const deleteAccountInputSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

const refreshTokenInputSchema = z.object({
  refreshToken: z.string().optional(),
});

const authTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const userRouter = router({
  sendOtp: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/user/send-otp",
        tags: ["User"],
        description: "Send OTP to email for verification",
      },
    })
    .input(sendOtpInputSchema)
    .output(z.object({ email: z.string(), message: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return await sendOtp(input);
      } catch (error) {
        throw handleError(error);
      }
    }),

  forgotPasswordSendOtp: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/user/forgot-password/send-otp",
        tags: ["User"],
        description: "Send OTP to email for forgot password flow",
      },
    })
    .input(z.object({ email: z.string().email("Invalid email format") }))
    .output(z.object({ email: z.string(), message: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return await sendForgotPasswordOtp(input);
      } catch (error) {
        throw handleError(error);
      }
    }),

  signup: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/user/signup",
        tags: ["User"],
        description: "Sign up a new user",
      },
    })
    .input(userSignupInputSchema)
    .output(
      z.object({
        user: userPublicSchema,
        accessToken: z.string(),
        refreshToken: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await verifyOtp(input.email, input.otp);
        return await userController.signup(input, ctx);
      } catch (error) {
        throw handleError(error);
      }
    }),

  signin: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/user/signin",
        tags: ["User"],
        description: "Sign in user",
      },
    })
    .input(userSigninInputSchema)
    .output(
      z.object({
        user: userPublicSchema,
        accessToken: z.string(),
        refreshToken: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await userController.signin(input, ctx);
      } catch (error) {
        throw handleError(error);
      }
    }),

  googleAuthUrl: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/user/google/auth-url",
        tags: ["User"],
        description: "Generate Google OAuth2 authorization URL",
      },
    })
    .input(googleAuthUrlInputSchema.optional())
    .output(z.object({ authUrl: z.string().url(), message: z.string() }))
    .query(async ({ input }) => {
      try {
        return await userController.getGoogleOAuthUrl(input ?? {});
      } catch (error) {
        throw handleError(error);
      }
    }),

  googleSignup: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/user/google/signup",
        tags: ["User"],
        description: "Sign up user with Google OAuth2 authorization code",
      },
    })
    .input(googleAuthCodeInputSchema)
    .output(
      z.object({
        user: userPublicSchema,
        accessToken: z.string(),
        refreshToken: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await userController.googleSignup(input, ctx);
      } catch (error) {
        throw handleError(error);
      }
    }),

  googleSignin: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/user/google/signin",
        tags: ["User"],
        description: "Sign in user with Google OAuth2 authorization code",
      },
    })
    .input(googleAuthCodeInputSchema)
    .output(
      z.object({
        user: userPublicSchema,
        accessToken: z.string(),
        refreshToken: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await userController.googleSignin(input, ctx);
      } catch (error) {
        throw handleError(error);
      }
    }),

  googleSigninWithToken: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/user/google/signin-token",
        tags: ["User"],
        description:
          "Sign in user with Google ID token from @react-oauth/google",
      },
    })
    .input(googleTokenInputSchema)
    .output(
      z.object({
        user: userPublicSchema,
        accessToken: z.string(),
        refreshToken: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await userController.googleSigninWithToken(input.token, ctx);
      } catch (error) {
        throw handleError(error);
      }
    }),

  googleSignupWithToken: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/user/google/signup-token",
        tags: ["User"],
        description:
          "Signup user with Google ID token from @react-oauth/google",
      },
    })
    .input(googleTokenInputSchema)
    .output(
      z.object({
        user: userPublicSchema,
        accessToken: z.string(),
        refreshToken: z.string(),
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await userController.googleSignupWithToken(input.token, ctx);
      } catch (error) {
        throw handleError(error);
      }
    }),

  signout: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/user/signout",
        tags: ["User"],
        description: "Sign out user",
        protect: true,
      },
    })
    .input(z.object({}).optional())
    .output(z.object({ message: z.string() }))
    .mutation(async ({ ctx }) => {
      try {
        return await userController.signout(ctx.user, ctx.token, ctx);
      } catch (error) {
        throw handleError(error);
      }
    }),

  refreshToken: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/user/refresh-token",
        tags: ["User"],
        description: "Refresh access token",
      },
    })
    .input(refreshTokenInputSchema)
    .output(authTokensSchema.extend({ message: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await userController.refreshAccessToken(input.refreshToken, ctx);
      } catch (error) {
        throw handleError(error);
      }
    }),

  changePassword: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/user/change-password",
        tags: ["User"],
        description: "Change user password",
        protect: true,
      },
    })
    .input(changePasswordInputSchema)
    .output(z.object({ message: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await userController.changePassword(input, ctx.user);
      } catch (error) {
        throw handleError(error);
      }
    }),

  forgotPasswordChange: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/user/forgot-password/change-password",
        tags: ["User"],
        description: "Change password using email + OTP",
      },
    })
    .input(forgotPasswordChangeInputSchema)
    .output(z.object({ message: z.string() }))
    .mutation(async ({ input }) => {
      try {
        return await userController.forgotPasswordChange(input);
      } catch (error) {
        throw handleError(error);
      }
    }),

  getCurrentUser: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/user/current-user",
        tags: ["User"],
        description: "Get current logged in user",
        protect: true,
      },
    })
    .input(z.undefined())
    .output(z.object({ user: userPublicSchema, message: z.string() }))
    .query(({ ctx }) => {
      try {
        return userController.getCurrentUser(ctx.user);
      } catch (error) {
        throw handleError(error);
      }
    }),

  updateAccount: protectedProcedure
    .meta({
      openapi: {
        method: "PATCH",
        path: "/user/update-account",
        tags: ["User"],
        description: "Update user account details",
        protect: true,
      },
    })
    .input(updateAccountInputSchema)
    .output(z.object({ user: userPublicSchema, message: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await userController.updateAccount(input, ctx.user);
      } catch (error) {
        throw handleError(error);
      }
    }),

  deleteAccount: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: "/user/delete-account",
        tags: ["User"],
        description: "Delete user account",
        protect: true,
      },
    })
    .input(deleteAccountInputSchema)
    .output(z.object({ message: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await userController.deleteAccount(input, ctx.user, ctx);
      } catch (error) {
        throw handleError(error);
      }
    }),

  regenerateApiKey: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/user/regenerate-api-key",
        tags: ["User"],
        description: "Regenerate user API key",
        protect: true,
      },
    })
    .input(z.object({}).optional())
    .output(z.object({ apiKey: z.string(), message: z.string() }))
    .mutation(async ({ ctx }) => {
      try {
        return await userController.regenerateApiKey(ctx.user);
      } catch (error) {
        throw handleError(error);
      }
    }),

  getApiKey: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/user/api-key",
        tags: ["User"],
        description: "Get current user API key",
        protect: true,
      },
    })
    .input(z.undefined())
    .output(
      z.object({
        apiKey: z.string().optional(),
        apiKeyExpiresAt: z.date().optional(),
        createdAt: z.date(),
        updatedAt: z.date(),
        message: z.string(),
      })
    )
    .query(({ ctx }) => {
      try {
        return userController.getApiKey(ctx.user);
      } catch (error) {
        throw handleError(error);
      }
    }),

  getApiRateLimit: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/user/api-rate-limit",
        tags: ["User"],
        description: "Get API key rate-limit snapshot for current user",
        protect: true,
      },
    })
    .input(z.undefined())
    .output(
      z.object({
        remaining: z.number(),
        used: z.number(),
        maxRequests: z.number(),
        resetIn: z.number(),
        windowInSeconds: z.number(),
        message: z.string(),
      })
    )
    .query(async ({ ctx }) => {
      try {
        const snapshot = await getRateLimitInfo(ctx.user._id.toString());
        return {
          remaining: snapshot.remaining,
          used: Math.max(0, MAX_REQUESTS_PER_WINDOW - snapshot.remaining),
          maxRequests: MAX_REQUESTS_PER_WINDOW,
          resetIn: snapshot.resetIn,
          windowInSeconds: RATE_LIMIT_WINDOW,
          message: "API rate-limit snapshot fetched successfully",
        };
      } catch (error) {
        throw handleError(error);
      }
    }),
});

export type UserRouter = typeof userRouter;
