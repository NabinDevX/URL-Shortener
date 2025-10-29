import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const urlSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
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

export const URL = mongoose.model("URL", urlSchema);