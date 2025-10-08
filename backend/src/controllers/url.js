import { nanoid } from "nanoid";
import { URL } from "../models/url.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateShortURL = asyncHandler(async (req, res) => {
  const { url } = req.body;
  if (!url) throw new ApiError(400, "URL is required");
  if (!req.user || !req.user._id) throw new ApiError(401, "Authentication required");

  const existingUrl = await URL.findOne({ redirectUrl: url, userId: req.user._id });
  if (existingUrl) {
    return res
      .status(200)
      .json(new ApiResponse(200, { shortId: existingUrl.shortId }, "URL already exists"));
  }

  const shortId = nanoid(8);

  const newUrl = await URL.create({
    userId: req.user._id,
    shortId,
    redirectUrl: url,
    visitHistory: [],
  });

  return res
    .status(201)
    .json(new ApiResponse(201, { shortId: newUrl.shortId }, "Short URL created successfully"));
});

const getOriginalURL = asyncHandler(async (req, res) => {
  const { shortId } = req.params;
  if (!shortId) throw new ApiError(400, "Short ID is required");

  const entry = await URL.findOneAndUpdate(
    { shortId },
    { $push: { visitHistory: { timestamp: new Date() } } },
    { new: true }
  );

  if (!entry) throw new ApiError(404, "Short URL not found");

  return res.redirect(entry.redirectUrl);
});

const getAnalytics = asyncHandler(async (req, res) => {
  const { shortId } = req.params;
  if (!shortId) throw new ApiError(400, "Short ID is required");

  const result = await URL.findOne({ shortId });
  if (!result) throw new ApiError(404, "Short URL not found");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalClicks: result.visitHistory.length,
        analytics: result.visitHistory,
      },
      "Analytics fetched successfully"
    )
  );
});

export { generateShortURL, getOriginalURL, getAnalytics };
