import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import uniqueValidator from "mongoose-unique-validator";
import { ApiError } from "@/utils/apiError";
import type { IUserDocument } from "@/types";

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function (this: IUserDocument) {
        return !this.googleId;
      },
    },
    name: {
      type: String,
      required: true,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    avatar: {
      type: String,
    },
    refreshToken: {
      type: String,
      default: "",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    apiKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    apiKeyExpiresAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.plugin(uniqueValidator, { message: "is already taken." });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  this.password = await bcrypt.hash(this.password, 9);
  next();
});

userSchema.methods.isPasswordCorrect = async function (
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function (): Promise<string> {
  const secret = process.env.USER_SECRET_ACCESS_TOKEN;
  if (!secret) {
    throw new ApiError(
      500,
      "Missing USER_SECRET_ACCESS_TOKEN. Add it to your backend environment (.env)"
    );
  }

  const expiresIn = process.env.ACCESS_TOKEN_EXPIRY;
  if (!expiresIn) {
    throw new ApiError(
      500,
      "Missing ACCESS_TOKEN_EXPIRY. Add it to your backend environment (.env)"
    );
  }

  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
    },
    secret,
    {
      expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
    }
  );
};

userSchema.methods.generateRefreshToken = async function (): Promise<string> {
  const secret = process.env.USER_SECRET_REFRESH_TOKEN;
  if (!secret) {
    throw new ApiError(
      500,
      "Missing USER_SECRET_REFRESH_TOKEN. Add it to your backend environment (.env)"
    );
  }

  const expiresIn = process.env.REFRESH_TOKEN_EXPIRY;
  if (!expiresIn) {
    throw new ApiError(
      500,
      "Missing REFRESH_TOKEN_EXPIRY. Add it to your backend environment (.env)"
    );
  }

  return jwt.sign(
    {
      _id: this._id,
    },
    secret,
    {
      expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
    }
  );
};

userSchema.methods.generateApiKey = function (expiryDays: number = 30): string {
  const apiKey = `uk_${crypto.randomBytes(32).toString("hex")}`;
  this.apiKey = apiKey;
  this.apiKeyExpiresAt = new Date(
    Date.now() + expiryDays * 24 * 60 * 60 * 1000
  );
  return apiKey;
};

const User = mongoose.model<IUserDocument>("User", userSchema);

export default User;
