import express from "express";
import { 
  generateShortURL, 
  getAnalytics,
  updateShortURL,
  getAllUrlsDetails,
  deleteURL
} from "../controllers/url.js";
import verifyJWT from "../middlewares/auth.js";

const router = express.Router();

router.use(verifyJWT);

router.route('/').post(generateShortURL);
router.route('/user/all').get(getAllUrlsDetails);
router.route('/analytics/:shortId').get(getAnalytics);
router.route('/update/:shortId').get(updateShortURL);
router.route('/:shortId').delete(deleteURL);

export default router;