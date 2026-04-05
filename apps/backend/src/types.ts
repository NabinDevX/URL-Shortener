import { Request, Response } from "express";
import { Document, Types, Model, AggregatePaginateModel } from "mongoose";
import { RedisClientType } from "redis";
import * as trpcExpress from "@trpc/server/adapters/express";

export interface Context {
  req: Request;
  res: Response;
}

export interface AuthenticatedContext extends Context {
  user: IUserDocument;
  token: string;
}

export type CreateContextFn = ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions) => Context;

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  password?: string;
  name: string;
  authProvider?: "local" | "google";
  googleId?: string;
  avatar?: string;
  refreshToken?: string;
  emailVerified: boolean;
  apiKey?: string;
  apiKeyExpiresAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): Promise<string>;
  generateRefreshToken(): Promise<string>;
  generateApiKey(expiryDays?: number): string;
}

export interface IVisitHistory {
  timestamp: Date;
}

export interface IURL {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  shortId: string;
  qrCode?: string;
  redirectUrl: string;
  isDeleted: boolean;
  visitHistory: IVisitHistory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IURLDocument extends IURL, Document {
  _id: Types.ObjectId;
}

export interface IURLModel
  extends Model<IURLDocument>, AggregatePaginateModel<IURLDocument> { }

export interface JWTPayload {
  _id: string;
  email?: string;
  name?: string;
  exp?: number;
  iat?: number;
}

export type RedisClient = RedisClientType;
export type RedisOperation<T> = (client: RedisClientType) => Promise<T>;

export interface OTPRecord {
  otp: string;
  createdAt: number;
}

export interface OTPInfo {
  exists: boolean;
  expiresIn: number;
  createdAt: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalDocs: number;
  limit?: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage?: number | null;
  prevPage?: number | null;
}

export interface URLWithAnalytics extends IURL {
  totalClicks: number;
  lastVisit?: Date;
  firstVisit?: Date;
}

export interface URLsResponse {
  urls: URLWithAnalytics[];
  totalUrls: number;
  totalClicks: number;
  pagination: PaginationInfo;
}

export interface BrevoEmailPayload {
  sender: {
    name: string;
    email: string;
  };
  to: Array<{
    email: string;
    name: string;
  }>;
  subject: string;
  textContent: string;
}

export interface IApiError extends Error {
  statusCode: number;
  data: null;
  message: string;
  success: false;
  errors: string[];
}

export interface IApiResponse<T = unknown> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface GenerateShortURLInput {
  url: string;
  customShortId?: string;
  idLength?: number;
}

export interface GenerateShortURLOutput {
  shortId: string;
  redirectUrl: string;
  fullShortUrl: string;
  isExisting?: boolean;
  isCustom?: boolean;
}

export interface UpdateShortURLInput {
  shortId: string;
  qrCode: string;
}

export interface UpdateShortURLOutput {
  shortId: string;
  redirectUrl: string;
  qrCode: string;
  fullShortUrl: string;
  updatedAt: Date;
}

export interface AnalyticsOutput {
  totalClicks: number;
  analytics: IVisitHistory[];
}

export interface DeleteURLOutput {
  shortId: string;
  isDeleted: boolean;
}

export interface SendOtpInput {
  email: string;
  name?: string;
}

export interface UserSignupInput {
  email: string;
  password: string;
  name: string;
  otp: string;
}

export interface UserSigninInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  oldPassword: string;
  newPassword: string;
}

export interface UpdateAccountInput {
  name?: string;
  email?: string;
  otp?: string;
}

export interface DeleteAccountInput {
  password: string;
}

export interface RefreshTokenInput {
  refreshToken?: string;
}

export interface GoogleAuthUrlInput {
  mode?: "signup" | "signin";
  state?: string;
  redirectUri?: string;
}

export interface GoogleAuthCodeInput {
  code: string;
  redirectUri?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserPublic {
  _id: string;
  email: string;
  name: string;
  authProvider?: "local" | "google";
  avatar?: string;
  apiKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscription {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  razorpaySubscriptionId?: string;
  planId: "basic_20" | "pro_50";
  status: "active" | "paused" | "cancelled" | "expired" | "halted";
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  nextBillingDate?: Date;
  cancelledAt?: Date;
  pausedAt?: Date;
  totalPaid: number;
  totalPayments: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionDocument extends ISubscription, Document {
  _id: Types.ObjectId;
}

export interface ISubscriptionString extends Omit<
  ISubscription,
  "_id" | "userId"
> {
  _id: string;
  userId: string;
}

export interface CreateSubscriptionInput {
  planId: "basic_20" | "pro_50";
  customerId?: string;
  totalCount?: number;
}

export interface CreateSubscriptionOutput {
  subscriptionId: string;
  orderId: string;
  amount: number;
  currency: string;
  planId: string;
  firstName: string;
  email: string;
  contact: string;
}

export interface GetSubscriptionOutput {
  subscription: ISubscriptionString | null;
  plan: {
    id: string;
    name: string;
    amount: number;
  } | null;
}

export interface GetPlansOutput {
  plans: Array<{
    id: string;
    name: string;
    amount: number;
    period: string;
    description: string;
  }>;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly NODE_ENV: "development" | "production" | "test";
      PORT?: string;
      MONGODB_URL?: string;
      REDIS_URL?: string;
      USER_SECRET_ACCESS_TOKEN?: string;
      USER_SECRET_REFRESH_TOKEN?: string;
      ACCESS_TOKEN_EXPIRY?: string;
      REFRESH_TOKEN_EXPIRY?: string;
      BREVO_API_KEY?: string;
      BREVO_SENDER_EMAIL?: string;
      GOOGLE_CLIENT_ID?: string;
      GOOGLE_CLIENT_SECRET?: string;
      RAZORPAY_KEY_ID?: string;
      RAZORPAY_KEY_SECRET?: string;
    }
  }
}
