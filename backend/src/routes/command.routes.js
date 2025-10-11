import express from "express";
import { 
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

  // Bot commands
  reloadBotCommands,
  getBotStatus
} from "../controllers/discordCommand.js";
import verifyJWT from "../middlewares/auth.js";

const router = express.Router();

router.use(verifyJWT);

// Slash command routes
router.route('/slash/create').post(createSlashCommand);
router.route('/slash/').get(getAllSlashCommands);
router.route('/slash/delete').delete(deleteSlashCommand);
router.route('/slash/:commandId').patch(updateSlashCommand);
router.route('/slash/delete-all').delete(deleteAllSlashCommands);

// Message command routes
router.route('/message/create').post(createMessageCommand);
router.route('/message/').get(getAllMessageCommands);
router.route('/message/delete').delete(deleteMessageCommand);
router.route('/message/:commandId').patch(updateMessageCommand);
router.route('/message/delete-all').delete(deleteAllMessageCommands);
router.route('/message/templates').get(getMessageCommandTemplates);

// Bot command routes
router.route('/bot/reload').post(reloadBotCommands);
router.route('/bot/status').get(getBotStatus);

export default router;