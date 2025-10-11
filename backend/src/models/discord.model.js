import mongoose from "mongoose";
import uniqueValidator from "mongoose-unique-validator";

const discordCommandSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    commandName: {
      type: String,
      required: true,
    },
    commandType: {
      type: String,
      enum: ['slash', 'message'],
      required: true,
    },
    commandContent: {
      type: String,
      required: true,
    },
    commandResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    commandOptions: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

// Compound unique index for commands per user
discordCommandSchema.index(
  { userId: 1, commandName: 1, commandType: 1 }, 
  { unique: true }
);

// Global unique index for slash commands (Discord requirement)
discordCommandSchema.index(
  { commandName: 1, commandType: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { commandType: 'slash' }
  }
);

// Pre-save middleware to handle response validation
discordCommandSchema.pre('save', function(next) {
  // For message commands, use commandResponse if provided, otherwise use commandContent
  if (this.commandType === 'message') {
    if (this.commandResponse === undefined || this.commandResponse === '') {
      this.commandResponse = this.commandContent;
    }
  }
  
  // For slash commands, commandResponse can be used for default responses
  if (this.commandType === 'slash') {
    if (this.commandResponse === undefined) {
      this.commandResponse = null;
    }
  }
  
  next();
});

// Instance method to get the appropriate response
discordCommandSchema.methods.getResponse = function() {
  // Return commandResponse if it exists, otherwise fall back to commandContent
  if (this.commandResponse !== null && this.commandResponse !== undefined) {
    return this.commandResponse;
  }
  return this.commandContent;
};

// Instance method to check if command has custom response
discordCommandSchema.methods.hasCustomResponse = function() {
  return this.commandResponse !== null && this.commandResponse !== undefined && this.commandResponse !== this.commandContent;
};

discordCommandSchema.plugin(uniqueValidator, { 
  message: "{PATH} '{VALUE}' is already taken." 
});

export const Command = mongoose.model("Command", discordCommandSchema);
