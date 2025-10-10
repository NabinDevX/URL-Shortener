import express from "express";
import { 
  createSlashCommand, 
  deleteSlashCommand, 
  getAllSlashCommands, 
  updateSlashCommand, 
  deleteAllSlashCommands 
} from "../controllers/discordCommand.js";
import verifyJWT from "../middlewares/auth.js";

const router = express.Router();

router.use(verifyJWT);

router.route('/create').post(createSlashCommand);
router.route('/').get(getAllSlashCommands);
router.route('/delete').delete(deleteSlashCommand);
router.route('/:commandId').patch(updateSlashCommand);
router.route('/delete-all').delete(deleteAllSlashCommands);

export default router;