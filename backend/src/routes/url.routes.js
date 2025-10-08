import express from "express";
import { generateShortURL, getAnalytics, getOriginalURL } from "../controllers/url.js";
import verifyJWT from "../middlewares/auth.js";

const router = express.Router();

router.use(verifyJWT);

router.route('/').post(generateShortURL);
router.route('/:shortId').get(getOriginalURL);
router.route('/analytics/:shortId').get(getAnalytics);

export default router;