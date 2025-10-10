import { REST, Routes } from "discord.js";
import { Command } from "../models/discord.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const createSlashCommand = asyncHandler(async (req, res) => {
  const { commandName, commandDescription, commandOptions } = req.body;
  const userId = req.user._id; // From auth middleware

  // Validate required fields
  if (!commandName || !commandDescription) {
    throw new ApiError(400, "Command name and description are required");
  }

  // Validate command name format (Discord requirements)
  if (!/^[a-z0-9_-]{1,32}$/.test(commandName)) {
    throw new ApiError(400, "Command name must be 1-32 characters and contain only lowercase letters, numbers, hyphens, and underscores");
  }

  // Check if command already exists in database
  const existingCommand = await Command.findOne({ command: commandName });
  if (existingCommand) {
    throw new ApiError(409, "Command name already exists");
  }

  // Prepare Discord command structure
  const discordCommand = {
    name: commandName,
    description: commandDescription,
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
      command: commandName,
      commandDescription,
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
    
    // Clean up database entry if Discord deployment failed
    await Command.findOneAndDelete({ command: commandName });
    
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
    command: commandName,
    userId: userId 
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
    // Get commands from database for this user
    const userCommands = await Command.find({ userId }).populate('userId', 'name email');

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
        "Commands retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Failed to retrieve commands:", error);
    throw new ApiError(500, "Failed to retrieve commands: " + error.message);
  }
});

const updateSlashCommand = asyncHandler(async (req, res) => {
  const { commandId } = req.params;
  const { commandDescription, commandOptions } = req.body;
  const userId = req.user._id;

  if (!commandDescription) {
    throw new ApiError(400, "Command description is required");
  }

  // Check if command exists and belongs to user
  const existingCommand = await Command.findOne({
    _id: commandId,
    userId: userId
  });

  if (!existingCommand) {
    throw new ApiError(404, "Command not found or you don't have permission to update it");
  }

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log("Started updating Discord slash command:", existingCommand.command);

    // Get all current commands
    const currentCommands = await rest.get(Routes.applicationCommands(process.env.CLIENT_ID));
    
    // Find and update the specific command
    const updatedCommands = currentCommands.map(cmd => {
      if (cmd.name === existingCommand.command) {
        const updatedCmd = {
          name: cmd.name,
          description: commandDescription,
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
      { commandDescription },
      { new: true, runValidators: true }
    );

    console.log("Successfully updated Discord slash command:", existingCommand.command);

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

    // Get count of user commands before deletion
    const userCommandsCount = await Command.countDocuments({ userId });

    // Remove all user commands from database
    await Command.deleteMany({ userId });

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

export { 
  createSlashCommand, 
  deleteSlashCommand, 
  getAllSlashCommands, 
  updateSlashCommand, 
  deleteAllSlashCommands 
};
