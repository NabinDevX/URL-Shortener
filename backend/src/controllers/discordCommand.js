import { REST, Routes } from "discord.js";
import { Command } from "../models/discord.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import discordClient from "../utils/discordClient.js";

// Helper function to validate message command
const validateMessageCommand = (commandName, commandResponse) => {
  if (!commandName) {
    throw new ApiError(400, "Command name is required");
  }
  
  if (commandName.length > 100) {
    throw new ApiError(400, "Command name must be less than 100 characters");
  }
  
  if (commandResponse && commandResponse.length > 2000) {
    throw new ApiError(400, "Command response must be less than 2000 characters");
  }
};

// ========== SLASH COMMANDS ==========

const createSlashCommand = asyncHandler(async (req, res) => {
  const { commandName, commandContent, commandResponse, commandOptions } = req.body;
  const userId = req.user._id;

  // Validate required fields
  if (!commandName || !commandContent) {
    throw new ApiError(400, "Command name and content are required");
  }

  // Validate command name format (Discord requirements)
  if (!/^[a-z0-9_-]{1,32}$/.test(commandName)) {
    throw new ApiError(400, "Command name must be 1-32 characters and contain only lowercase letters, numbers, hyphens, and underscores");
  }

  // Prepare Discord command structure
  const discordCommand = {
    name: commandName,
    description: commandContent,
  };

  // Add options if provided
  if (commandOptions && Array.isArray(commandOptions) && commandOptions.length > 0) {
    discordCommand.options = commandOptions;
  }

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log("Started creating Discord slash command:", commandName);

    // Get existing commands to avoid overwriting
    const existingCommands = await rest.get(Routes.applicationCommands(process.env.CLIENT_ID));
    
    // Add new command to existing ones
    const updatedCommands = [...existingCommands, discordCommand];

    // Deploy updated commands
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: updatedCommands,
    });

    // Save command to database
    const savedCommand = await Command.create({
      userId,
      commandType: 'slash',
      commandName,
      commandContent,
      commandResponse: commandResponse || null,
      commandOptions: commandOptions || [],
    });

    console.log("Successfully created Discord slash command:", commandName);

    return res.status(201).json(
      new ApiResponse(
        201,
        {
          command: savedCommand,
          discordCommand,
        },
        "Discord slash command created successfully"
      )
    );
  } catch (error) {
    console.error("Discord command creation failed:", error);
    
    // Handle unique validation errors
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      throw new ApiError(409, errorMessages.join(', '));
    }
    
    // Clean up database entry if Discord deployment failed
    await Command.findOneAndDelete({ 
      commandName,
      commandType: 'slash',
      userId
    });
    
    throw new ApiError(500, "Failed to create Discord command: " + error.message);
  }
});

const deleteSlashCommand = asyncHandler(async (req, res) => {
  const { commandName } = req.body;
  const userId = req.user._id;

  if (!commandName) {
    throw new ApiError(400, "Command name is required");
  }

  // Check if command exists in database and belongs to user
  const existingCommand = await Command.findOne({ 
    commandName,
    commandType: 'slash',
    userId
  });

  if (!existingCommand) {
    throw new ApiError(404, "Command not found or you don't have permission to delete it");
  }

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log("Started deleting Discord slash command:", commandName);

    // Get all current commands
    const currentCommands = await rest.get(Routes.applicationCommands(process.env.CLIENT_ID));
    
    // Filter out the command to delete
    const updatedCommands = currentCommands.filter(cmd => cmd.name !== commandName);

    // Deploy updated commands (without the deleted one)
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: updatedCommands,
    });

    // Remove from database
    await Command.findByIdAndDelete(existingCommand._id);

    console.log("Successfully deleted Discord slash command:", commandName);

    return res.status(200).json(
      new ApiResponse(
        200,
        { deletedCommand: commandName },
        "Discord slash command deleted successfully"
      )
    );
  } catch (error) {
    console.error("Discord command deletion failed:", error);
    throw new ApiError(500, "Failed to delete Discord command: " + error.message);
  }
});

const getAllSlashCommands = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    // Get slash commands from database for this user
    const userCommands = await Command.find({ 
      userId,
      commandType: 'slash'
    }).populate('userId', 'name email');

    // Get all Discord commands
    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
    const discordCommands = await rest.get(Routes.applicationCommands(process.env.CLIENT_ID));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          userCommands,
          totalUserCommands: userCommands.length,
          allDiscordCommands: discordCommands,
          totalDiscordCommands: discordCommands.length,
        },
        "Slash commands retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Failed to retrieve slash commands:", error);
    throw new ApiError(500, "Failed to retrieve slash commands: " + error.message);
  }
});

const updateSlashCommand = asyncHandler(async (req, res) => {
  const { commandId } = req.params;
  const { commandContent, commandResponse, commandOptions } = req.body;
  const userId = req.user._id;

  if (!commandContent) {
    throw new ApiError(400, "Command content is required");
  }

  // Check if command exists and belongs to user
  const existingCommand = await Command.findOne({
    _id: commandId,
    userId,
    commandType: 'slash'
  });

  if (!existingCommand) {
    throw new ApiError(404, "Command not found or you don't have permission to update it");
  }

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log("Started updating Discord slash command:", existingCommand.commandName);

    // Get all current commands
    const currentCommands = await rest.get(Routes.applicationCommands(process.env.CLIENT_ID));
    
    // Find and update the specific command
    const updatedCommands = currentCommands.map(cmd => {
      if (cmd.name === existingCommand.commandName) {
        const updatedCmd = {
          name: cmd.name,
          description: commandContent,
        };
        
        if (commandOptions && Array.isArray(commandOptions) && commandOptions.length > 0) {
          updatedCmd.options = commandOptions;
        }
        
        return updatedCmd;
      }
      return cmd;
    });

    // Deploy updated commands
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: updatedCommands,
    });

    // Update in database
    const updatedCommand = await Command.findByIdAndUpdate(
      commandId,
      { 
        commandContent,
        commandResponse: commandResponse !== undefined ? commandResponse : existingCommand.commandResponse,
        commandOptions: commandOptions || []
      },
      { new: true, runValidators: true }
    );

    console.log("Successfully updated Discord slash command:", existingCommand.commandName);

    return res.status(200).json(
      new ApiResponse(
        200,
        { command: updatedCommand },
        "Discord slash command updated successfully"
      )
    );
  } catch (error) {
    console.error("Discord command update failed:", error);
    throw new ApiError(500, "Failed to update Discord command: " + error.message);
  }
});

const deleteAllSlashCommands = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log("Started deleting all Discord slash commands");

    // Remove all Discord commands
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: [],
    });

    // Get count of user slash commands before deletion
    const userCommandsCount = await Command.countDocuments({ 
      userId,
      commandType: 'slash'
    });

    // Remove all user slash commands from database
    await Command.deleteMany({ 
      userId,
      commandType: 'slash'
    });

    console.log("Successfully deleted all Discord slash commands");

    return res.status(200).json(
      new ApiResponse(
        200,
        { deletedCount: userCommandsCount },
        "All Discord slash commands deleted successfully"
      )
    );
  } catch (error) {
    console.error("Failed to delete all Discord commands:", error);
    throw new ApiError(500, "Failed to delete all Discord commands: " + error.message);
  }
});

// ========== MESSAGE COMMANDS ==========

const createMessageCommand = asyncHandler(async (req, res) => {
  const { 
    commandName, 
    commandContent,
    commandResponse
  } = req.body;
  const userId = req.user._id;

  // Validate input
  validateMessageCommand(commandName, commandResponse);

  if (!commandContent) {
    throw new ApiError(400, "Command content is required");
  }

  try {
    // Save message command to database
    const messageCommand = await Command.create({
      userId,
      commandType: 'message',
      commandName: commandName.toLowerCase(),
      commandContent,
      commandResponse: commandResponse || null,
    });

    console.log("Successfully created message command:", commandName);

    return res.status(201).json(
      new ApiResponse(
        201,
        { command: messageCommand },
        "Message command created successfully"
      )
    );
  } catch (error) {
    console.error("Message command creation failed:", error);
    
    // Handle unique validation errors
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      throw new ApiError(409, errorMessages.join(', '));
    }
    
    throw new ApiError(500, "Failed to create message command: " + error.message);
  }
});

const deleteMessageCommand = asyncHandler(async (req, res) => {
  const { commandName } = req.body;
  const userId = req.user._id;

  if (!commandName) {
    throw new ApiError(400, "Command name is required");
  }

  // Check if command exists and belongs to user
  const existingCommand = await Command.findOne({ 
    commandName: commandName.toLowerCase(),
    commandType: 'message',
    userId
  });

  if (!existingCommand) {
    throw new ApiError(404, "Message command not found or you don't have permission to delete it");
  }

  try {
    // Remove from database
    await Command.findByIdAndDelete(existingCommand._id);

    console.log("Successfully deleted message command:", commandName);

    return res.status(200).json(
      new ApiResponse(
        200,
        { deletedCommand: commandName },
        "Message command deleted successfully"
      )
    );
  } catch (error) {
    console.error("Message command deletion failed:", error);
    throw new ApiError(500, "Failed to delete message command: " + error.message);
  }
});

const getAllMessageCommands = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    // Get message commands from database for this user
    const messageCommands = await Command.find({ 
      userId,
      commandType: 'message'
    }).populate('userId', 'name email');

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          messageCommands,
          totalMessageCommands: messageCommands.length,
        },
        "Message commands retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Failed to retrieve message commands:", error);
    throw new ApiError(500, "Failed to retrieve message commands: " + error.message);
  }
});

const updateMessageCommand = asyncHandler(async (req, res) => {
  const { commandId } = req.params;
  const { 
    commandContent,
    commandResponse
  } = req.body;
  const userId = req.user._id;

  if (!commandContent) {
    throw new ApiError(400, "Command content is required");
  }

  // Validate response length if provided
  if (commandResponse && commandResponse.length > 2000) {
    throw new ApiError(400, "Command response must be less than 2000 characters");
  }

  // Check if command exists and belongs to user
  const existingCommand = await Command.findOne({
    _id: commandId,
    userId,
    commandType: 'message'
  });

  if (!existingCommand) {
    throw new ApiError(404, "Message command not found or you don't have permission to update it");
  }

  try {
    // Update in database
    const updatedCommand = await Command.findByIdAndUpdate(
      commandId,
      { 
        commandContent,
        commandResponse: commandResponse !== undefined ? commandResponse : existingCommand.commandResponse
      },
      { new: true, runValidators: true }
    );

    console.log("Successfully updated message command:", existingCommand.commandName);

    return res.status(200).json(
      new ApiResponse(
        200,
        { command: updatedCommand },
        "Message command updated successfully"
      )
    );
  } catch (error) {
    console.error("Message command update failed:", error);
    throw new ApiError(500, "Failed to update message command: " + error.message);
  }
});

const deleteAllMessageCommands = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    // Get count before deletion
    const messageCommandsCount = await Command.countDocuments({ 
      userId,
      commandType: 'message'
    });

    // Remove all user message commands from database
    await Command.deleteMany({ 
      userId,
      commandType: 'message'
    });

    console.log("Successfully deleted all message commands");

    return res.status(200).json(
      new ApiResponse(
        200,
        { deletedCount: messageCommandsCount },
        "All message commands deleted successfully"
      )
    );
  } catch (error) {
    console.error("Failed to delete all message commands:", error);
    throw new ApiError(500, "Failed to delete all message commands: " + error.message);
  }
});

const getMessageCommandTemplates = asyncHandler(async (req, res) => {
  const templates = {
    "greeting": {
      commandName: "hello",
      commandContent: "Greeting command",
      commandResponse: "Hello {mention}! Welcome to {server}! 👋",
    },
    "url-detect": {
      commandName: "http",
      commandContent: "URL detection",
      commandResponse: "🔗 I detected a URL: {url} from domain: {domain}",
    },
    "create": {
      commandName: "create",
      commandContent: "Create command",
      commandResponse: "✅ Creating short URL for {website}... Your link: https://short.ly/{website}",
    },
    "info": {
      commandName: "info",
      commandContent: "Bot information",
      commandResponse: "This is a URL shortener bot! Send me any URL and I'll create a short link.",
    }
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      { templates },
      "Message command templates retrieved successfully"
    )
  );
});

// ========== COMBINED FUNCTIONS ==========

const getAllCommands = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    // Get all commands for this user
    const allCommands = await Command.find({ userId }).populate('userId', 'name email');
    
    // Separate by type
    const slashCommands = allCommands.filter(cmd => cmd.commandType === 'slash');
    const messageCommands = allCommands.filter(cmd => cmd.commandType === 'message');

    // Get Discord slash commands
    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
    const discordCommands = await rest.get(Routes.applicationCommands(process.env.CLIENT_ID));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          slashCommands,
          messageCommands,
          totalSlashCommands: slashCommands.length,
          totalMessageCommands: messageCommands.length,
          totalCommands: allCommands.length,
          discordCommands,
          totalDiscordCommands: discordCommands.length,
        },
        "All commands retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Failed to retrieve commands:", error);
    throw new ApiError(500, "Failed to retrieve commands: " + error.message);
  }
});

const deleteAllCommands = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    // Get count before deletion
    const totalCommandsCount = await Command.countDocuments({ userId });
    const slashCommandsCount = await Command.countDocuments({ 
      userId,
      commandType: 'slash'
    });
    const messageCommandsCount = await Command.countDocuments({ 
      userId,
      commandType: 'message'
    });

    // Remove all Discord slash commands
    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: [],
    });

    // Remove all user commands from database
    await Command.deleteMany({ userId });

    console.log("Successfully deleted all commands");

    return res.status(200).json(
      new ApiResponse(
        200,
        { 
          deletedSlashCommands: slashCommandsCount,
          deletedMessageCommands: messageCommandsCount,
          totalDeleted: totalCommandsCount
        },
        "All commands deleted successfully"
      )
    );
  } catch (error) {
    console.error("Failed to delete all commands:", error);
    throw new ApiError(500, "Failed to delete all commands: " + error.message);
  }
});

// ========== BOT COMMANDS ==========

const reloadBotCommands = asyncHandler(async (req, res) => {
  try {
    const activeCommands = await discordClient.reloadCommands();
    
    return res.status(200).json(
      new ApiResponse(
        200,
        activeCommands,
        "Bot commands reloaded successfully"
      )
    );
  } catch (error) {
    throw new ApiError(500, "Failed to reload bot commands: " + error.message);
  }
});

const getBotStatus = asyncHandler(async (req, res) => {
  try {
    const client = discordClient.getClient();
    const activeCommands = await discordClient.getActiveCommands();
    
    const status = {
      botStatus: client.isReady() ? 'online' : 'offline',
      botTag: client.user?.tag || 'Unknown',
      guilds: client.guilds.cache.size,
      users: client.users.cache.size,
      uptime: client.uptime,
      activeCommands
    };
    
    return res.status(200).json(
      new ApiResponse(200, status, "Bot status retrieved successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Failed to get bot status: " + error.message);
  }
});

// Export all functions
export { 
  // Slash commands
  createSlashCommand, 
  deleteSlashCommand, 
  getAllSlashCommands, 
  updateSlashCommand, 
  deleteAllSlashCommands,
  
  // Message commands
  createMessageCommand,
  deleteMessageCommand,
  getAllMessageCommands,
  updateMessageCommand,
  deleteAllMessageCommands,
  getMessageCommandTemplates,
  
  // Combined functions
  getAllCommands,
  deleteAllCommands,

  // Bot commands
  reloadBotCommands,
  getBotStatus
};
