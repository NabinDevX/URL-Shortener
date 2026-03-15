import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import type { IURLDocument, IURLModel } from "@/types";

const urlSchema = new Schema<IURLDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shortId: {
      type: String,
      required: true,
      unique: true,
    },
    qrCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    redirectUrl: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    visitHistory: [{ timestamp: { type: Date } }],
  },
  { timestamps: true }
);

urlSchema.plugin(mongooseAggregatePaginate);

export const URL = mongoose.model<IURLDocument, IURLModel>("URL", urlSchema);
