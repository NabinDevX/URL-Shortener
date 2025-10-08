import { Router } from "express";
import {
  userSignup,
  userLogin,
  userLogout,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  deleteAccount,
} from "../controllers/user.js";
import verifyJWT from "../middlewares/auth.js";

const router = Router();

router.route("/signup").post(userSignup);
router.route("/login").post(userLogin);
router.route("/refresh-token").post(refreshAccessToken);

router.use(verifyJWT);

router.route("/logout").post(userLogout);
router.route("/change-password").post(changeCurrentPassword);
router.route("/current-user").get(getCurrentUser);
router.route("/update-account").patch(updateAccountDetails);
router.route("/delete-account").delete(deleteAccount);

export default router;