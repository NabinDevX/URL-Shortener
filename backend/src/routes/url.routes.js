import express from "express";
import { 
  generateShortURL, 
  getAnalytics,
  getAllUrlsDetails,
  deleteURL
} from "../controllers/url.js";
import verifyJWT from "../middlewares/auth.js";

const router = express.Router();

router.use(verifyJWT);

router.route('/').post(generateShortURL);
router.route('/user/all').get(getAllUrlsDetails);
router.route('/analytics/:shortId').get(getAnalytics);
router.route('/:shortId').delete(deleteURL);

export default router;