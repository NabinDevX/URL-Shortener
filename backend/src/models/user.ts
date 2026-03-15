import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import uniqueValidator from "mongoose-unique-validator";
import type { IUserDocument, IUserModel } from "@/types";

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
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
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 9);
  next();
});

userSchema.methods.isPasswordCorrect = async function (
  password: string
): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function (): Promise<string> {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
    },
    process.env.USER_SECRET_ACCESS_TOKEN as string,
    {
      expiresIn: process.env
        .ACCESS_TOKEN_EXPIRY! as jwt.SignOptions["expiresIn"],
    }
  );
};

userSchema.methods.generateRefreshToken = async function (): Promise<string> {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.USER_SECRET_REFRESH_TOKEN as string,
    {
      expiresIn: process.env
        .REFRESH_TOKEN_EXPIRY! as jwt.SignOptions["expiresIn"],
    }
  );
};

userSchema.methods.generateApiKey = function (expiryDays: number = 30): string {
  const apiKey = `uk_${crypto.randomBytes(32).toString("hex")}`;
  this.apiKey = apiKey;
  this.apiKeyExpiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
  return apiKey;
};

const User = mongoose.model<IUserDocument, IUserModel>("User", userSchema);

export default User;
