import mongoose, { Schema } from "mongoose";
import type { Document, Model } from "mongoose";
import type { ISubscription, ISubscriptionDocument } from "@/types";

const subscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    razorpaySubscriptionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    planId: {
      type: String,
      enum: ["basic_20", "pro_50"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "paused", "cancelled", "expired", "halted"],
      default: "active",
    },
    currentPeriodStart: {
      type: Date,
    },
    currentPeriodEnd: {
      type: Date,
    },
    nextBillingDate: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    pausedAt: {
      type: Date,
    },
    totalPaid: {
      type: Number,
      default: 0,
    },
    totalPayments: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Subscription = mongoose.model<
  ISubscriptionDocument,
  Model<ISubscriptionDocument>
>("Subscription", subscriptionSchema);

export default Subscription;
