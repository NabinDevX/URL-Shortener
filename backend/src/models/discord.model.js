import mongoose from "mongoose";
import uniqueValidator from "mongoose-unique-validator";

const discordCommandSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    command: {
      type: String,
      unique: true,
      required: true,
    },
    commandDescription: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

discordCommandSchema.plugin(uniqueValidator, { message: "is already taken." });

export const Command = mongoose.model("Command", discordCommandSchema);
