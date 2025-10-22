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
import { sendOtpToEmail, emailOtpValidation } from "../middlewares/otp.js";

const router = Router();

router.route("/send-otp").post(sendOtpToEmail);
router.route("/signup").post(emailOtpValidation, userSignup);
router.route("/login").post(userLogin);
router.route("/refresh-token").post(refreshAccessToken);

router.route("/logout").post(verifyJWT, userLogout);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, emailOtpValidation, updateAccountDetails);
router.route("/delete-account").delete(verifyJWT, deleteAccount);

export default router;