import express from "express";
import { 
  generateShortURL, 
  getAnalytics, 
  getOriginalURL,
  getAllUrlsDetails 
} from "../controllers/url.js";
import verifyJWT from "../middlewares/auth.js";

const router = express.Router();

router.route('/:shortId').get(getOriginalURL);

router.use(verifyJWT);

router.route('/').post(generateShortURL);
router.route('/user/all').get(getAllUrlsDetails);
router.route('/analytics/:shortId').get(getAnalytics);

export default router;