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

router.use(verifyJWT);

router.route("/logout").post(userLogout);
router.route("/change-password").post(changeCurrentPassword);
router.route("/current-user").get(getCurrentUser);
router.route("/update-account").patch(emailOtpValidation, updateAccountDetails);
router.route("/delete-account").delete(deleteAccount);

export default router;