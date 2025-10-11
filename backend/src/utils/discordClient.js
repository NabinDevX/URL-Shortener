import { Client, GatewayIntentBits } from "discord.js";
import { Command } from "../models/discord.model.js";

class DiscordClientManager {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.client.once("ready", () => {
      console.log(`✅ Discord Bot logged in as ${this.client.user.tag}`);
    });

    this.client.on("messageCreate", this.handleMessageCreate.bind(this));
    this.client.on("interactionCreate", this.handleInteractionCreate.bind(this));
    this.client.on("error", this.handleError.bind(this));
  }

  async handleMessageCreate(message) {
    if (message.author.bot) return;

    try {
      const messageContent = message.content.toLowerCase().trim();

      // Get all message commands from database
      const messageCommands = await Command.find({
        commandName: messageContent.split(" ")[0],
        commandType: "message",
      });

      if (messageCommands.length === 0) return;

      // Check each command to see if it matches
      for (const cmd of messageCommands) {
        if (await this.shouldRespondToCommand(message, cmd)) {
          const response = await this.processMessageCommand(message, cmd);
          await message.reply({ content: response });
          break; // Only respond to first matching command
        }
      }
    } catch (error) {
      console.error("Error handling message command:", error);
    }
  }

  async shouldRespondToCommand(message, cmd) {
    const messageContent = message.content.toLowerCase().trim();
    const commandName = cmd.commandName.toLowerCase();
    const isExactMatch = cmd.settings?.isExactMatch ?? false;

    if (isExactMatch) {
      // Exact match: message must be exactly the command name
      return messageContent === commandName;
    } else {
      // Partial match: message contains the command name
      return messageContent.includes(commandName);
    }
  }

  async processMessageCommand(message, cmd) {
    // Use commandResponse if available, otherwise use commandContent
    let response = cmd.commandResponse || cmd.commandContent;

    // Extract dynamic content from the message
    const messageContent = message.content;
    const words = messageContent.split(' ');
    
    // Replace variables in response
    response = this.replaceVariables(response, {
      user: message.author.username,
      mention: `<@${message.author.id}>`,
      server: message.guild?.name || "DM",
      channel: message.channel?.name || "DM",
      message: messageContent,
      words: words,
    });

    return response;
  }

  async handleInteractionCreate(interaction) {
    if (!interaction.isChatInputCommand()) return;

    try {
      // Find command in database
      const slashCommand = await Command.findOne({
        commandName: interaction.commandName,
        commandType: "slash",
      });

      if (!slashCommand) {
        await interaction.reply({
          content: "❌ This command is not available.",
          ephemeral: true,
        });
        return;
      }

      // Use commandResponse if available, otherwise use commandContent
      let response = slashCommand.commandResponse || slashCommand.commandContent;

      // Replace variables
      response = this.replaceVariables(response, {
        user: interaction.user.username,
        mention: `<@${interaction.user.id}>`,
        server: interaction.guild?.name || "DM",
        channel: interaction.channel?.name || "DM",
      });

      await interaction.reply(response);
    } catch (error) {
      console.error("Error handling slash command:", error);
      
      if (!interaction.replied) {
        await interaction.reply({
          content: "❌ Something went wrong.",
          ephemeral: true,
        });
      }
    }
  }

  // Helper method to replace variables in responses
  replaceVariables(text, variables) {
    let result = text;
    
    // Basic variables
    result = result.replace(/{user}/g, variables.user);
    result = result.replace(/{mention}/g, variables.mention);
    result = result.replace(/{server}/g, variables.server);
    result = result.replace(/{channel}/g, variables.channel);
    result = result.replace(/{date}/g, new Date().toLocaleDateString());
    result = result.replace(/{time}/g, new Date().toLocaleTimeString());

    // Message-specific variables
    if (variables.message) {
      result = result.replace(/{message}/g, variables.message);
      
      // Extract URLs from message
      const urlMatch = variables.message.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        result = result.replace(/{url}/g, urlMatch[0]);
        
        // Extract domain from URL
        try {
          const domain = new URL(urlMatch[0]).hostname;
          result = result.replace(/{domain}/g, domain);
        } catch (e) {
          result = result.replace(/{domain}/g, 'unknown');
        }
      }

      // Word-based replacements
      if (variables.words) {
        result = result.replace(/{word1}/g, variables.words[0] || '');
        result = result.replace(/{word2}/g, variables.words[1] || '');
        result = result.replace(/{word3}/g, variables.words[2] || '');
        result = result.replace(/{lastword}/g, variables.words[variables.words.length - 1] || '');
        
        // Extract specific patterns (like website names)
        const websiteMatch = variables.message.match(/(\w+\.\w+)/);
        if (websiteMatch) {
          result = result.replace(/{website}/g, websiteMatch[0]);
        }
      }
    }

    return result;
  }

  handleError(error) {
    console.error("Discord client error:", error);
  }

  async initialize() {
    try {
      if (!process.env.DISCORD_TOKEN) {
        throw new Error("DISCORD_TOKEN is not set");
      }
      
      await this.client.login(process.env.DISCORD_TOKEN);
      console.log("🤖 Discord bot initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Discord bot:", error);
      throw error;
    }
  }

  getClient() {
    return this.client;
  }

  async shutdown() {
    try {
      await this.client.destroy();
      console.log("🔌 Discord bot disconnected");
    } catch (error) {
      console.error("Error shutting down Discord bot:", error);
    }
  }

  async getActiveCommands() {
    try {
      const commands = await Command.find({});
      return {
        slashCommands: commands.filter((cmd) => cmd.commandType === "slash"),
        messageCommands: commands.filter((cmd) => cmd.commandType === "message"),
        total: commands.length,
      };
    } catch (error) {
      console.error("Error getting active commands:", error);
      return { slashCommands: [], messageCommands: [], total: 0 };
    }
  }
}

const discordClient = new DiscordClientManager();

export default discordClient;
export { DiscordClientManager };
