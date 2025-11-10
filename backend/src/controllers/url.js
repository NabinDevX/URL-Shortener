import { nanoid } from "nanoid";
import { URL } from "../models/url.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const generateShortURL = asyncHandler(async (req, res) => {
  const { url, customShortId, idLength } = req.body;

  if (!url) throw new ApiError(400, "URL is required");
  if (!req.user || !req.user._id)
    throw new ApiError(401, "Authentication required");

  let shortId;

  if (customShortId) {
    if (typeof customShortId !== "string" || customShortId.trim() === "") {
      throw new ApiError(400, "Custom short ID must be a non-empty string");
    }

    if (customShortId.length < 3) {
      throw new ApiError(
        400,
        "Custom short ID must be at least 3 characters long"
      );
    }

    if (customShortId.length > 20) {
      throw new ApiError(400, "Custom short ID must not exceed 20 characters");
    }

    const validShortIdRegex = /^[a-zA-Z0-9_-]+$/;
    if (!validShortIdRegex.test(customShortId)) {
      throw new ApiError(
        400,
        "Custom short ID can only contain letters, numbers, hyphens, and underscores"
      );
    }

    const existingShortId = await URL.findOne({ shortId: customShortId });
    if (existingShortId) {
      throw new ApiError(
        409,
        "This custom short ID is already taken. Please choose another one"
      );
    }

    shortId = customShortId;
  } else {
    let length = 8;

    if (idLength) {
      length = parseInt(idLength);

      if (isNaN(length) || length < 4 || length > 15) {
        throw new ApiError(
          400,
          "ID length must be between 4 and 15 characters"
        );
      }
    }

    shortId = nanoid(length);

    let existingShortId = await URL.findOne({ shortId });
    let attempts = 0;
    const maxAttempts = 5;

    while (existingShortId && attempts < maxAttempts) {
      shortId = nanoid(length);
      existingShortId = await URL.findOne({ shortId });
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new ApiError(
        500,
        "Failed to generate unique short ID. Please try again"
      );
    }
  }

  const existingUrl = await URL.findOne({
    redirectUrl: url,
    userId: req.user._id,
  });

  if (existingUrl) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          shortId: existingUrl.shortId,
          redirectUrl: existingUrl.redirectUrl,
          fullShortUrl: `${process.env.NODE_ENV === "production" ? "https://urltinier.app" : "http://localhost:8001"}/${existingUrl.shortId}`,
          isExisting: true,
        },
        "URL already exists for this user"
      )
    );
  }

  const newUrl = await URL.create({
    userId: req.user._id,
    shortId,
    redirectUrl: url,
    visitHistory: [],
  });

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        shortId: newUrl.shortId,
        redirectUrl: newUrl.redirectUrl,
        fullShortUrl: `${process.env.NODE_ENV === "production" ? "https://urltinier.app" : "http://localhost:8001"}/${newUrl.shortId}`,
        isCustom: !!customShortId,
      },
      "Short URL created successfully"
    )
  );
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

const updateShortURL = asyncHandler(async (req, res) => {
  const { shortId } = req.params;
  const { qrCode } = req.body;

  if (!shortId || !qrCode) {
    throw new ApiError(400, "Short ID and QR Code are required");
  }

  if (typeof qrCode !== "string") {
    throw new ApiError(400, "QR Code must be a string");
  }

  if (qrCode.trim() === "") {
    throw new ApiError(400, "QR Code cannot be empty");
  }

  const url = await URL.findOne({ shortId, userId: req.user._id });

  if (!url) {
    throw new ApiError(
      404,
      "Short URL not found or you don't have permission to update it"
    );
  }

  if (url.isDeleted) {
    throw new ApiError(
      400,
      "Cannot update a deleted URL. Please restore it first"
    );
  }

  if (url.qrCode !== qrCode) {
    const existingQrCode = await URL.findOne({
      qrCode,
      shortId: { $ne: shortId },
    });

    if (existingQrCode) {
      throw new ApiError(409, "This QR Code is already in use by another URL");
    }
  }

  url.qrCode = qrCode.trim();
  await url.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        shortId: url.shortId,
        redirectUrl: url.redirectUrl,
        qrCode: url.qrCode,
        fullShortUrl: `${process.env.NODE_ENV === "production" ? "https://urltinier.app" : "http://localhost:8001"}/${url.shortId}`,
        updatedAt: url.updatedAt,
      },
      "QR Code updated successfully"
    )
  );
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

const getAllUrlsDetails = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    throw new ApiError(401, "Authentication required");
  }

  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const aggregate = URL.aggregate([
    {
      $match: {
        userId: req.user._id,
      },
    },
    {
      $addFields: {
        totalClicks: { $size: "$visitHistory" },
        lastVisit: { $arrayElemAt: ["$visitHistory.timestamp", -1] },
        firstVisit: { $arrayElemAt: ["$visitHistory.timestamp", 0] },
      },
    },
    {
      $project: {
        shortId: 1,
        redirectUrl: 1,
        totalClicks: 1,
        lastVisit: 1,
        firstVisit: 1,
        createdAt: 1,
        updatedAt: 1,
        visitHistory: 1,
      },
    },
    {
      $sort: { [sortBy]: sortDirection },
    },
  ]);

  const options = {
    page: pageNum,
    limit: limitNum,
  };

  const result = await URL.aggregatePaginate(aggregate, options);

  if (!result.docs || result.docs.length === 0) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          urls: [],
          totalUrls: 0,
          totalClicks: 0,
          pagination: {
            currentPage: pageNum,
            totalPages: 0,
            totalDocs: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
        "No URLs found for this user"
      )
    );
  }

  const totalClicks = result.docs.reduce(
    (sum, url) => sum + url.totalClicks,
    0
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        urls: result.docs,
        totalUrls: result.totalDocs,
        totalClicks,
        pagination: {
          currentPage: result.page,
          totalPages: result.totalPages,
          totalDocs: result.totalDocs,
          limit: result.limit,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
          nextPage: result.nextPage,
          prevPage: result.prevPage,
        },
      },
      "URLs fetched successfully"
    )
  );
});

const deleteURL = asyncHandler(async (req, res) => {
  const { shortId } = req.params;

  if (!shortId) {
    throw new ApiError(400, "Short ID is required");
  }

  if (!req.user || !req.user._id) {
    throw new ApiError(401, "Authentication required");
  }

  // Find the URL and verify ownership
  const url = await URL.findOne({ shortId, userId: req.user._id });

  if (!url) {
    throw new ApiError(
      404,
      "Short URL not found or you don't have permission to delete it"
    );
  }

  // Toggle the isDeleted field
  url.isDeleted = !url.isDeleted;
  await url.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        shortId: url.shortId,
        isDeleted: url.isDeleted,
      },
      url.isDeleted ? "URL deleted successfully" : "URL restored successfully"
    )
  );
});

// Export the function
export {
  generateShortURL,
  getOriginalURL,
  updateShortURL,
  getAnalytics,
  getAllUrlsDetails,
  deleteURL,
};
