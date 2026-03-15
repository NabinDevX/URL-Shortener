import { nanoid } from "nanoid";
import { URL } from "@/models/url";
import { ApiError } from "@/utils/apiError";
import type {
  IUserDocument,
  GenerateShortURLInput,
  GenerateShortURLOutput,
  UpdateShortURLInput,
  UpdateShortURLOutput,
  AnalyticsOutput,
  DeleteURLOutput,
  PaginationInfo,
  URLWithAnalytics,
} from "@/types";

const getBaseUrl = (): string => {
  return process.env.NODE_ENV === "production"
    ? "https://urltinier.app"
    : "http://localhost:8001";
};

export const generateShortURL = async (
  input: GenerateShortURLInput,
  user: IUserDocument
): Promise<GenerateShortURLOutput> => {
  const { url, customShortId, idLength } = input;

  let shortId: string;

  if (customShortId) {
    const existingShortId = await URL.findOne({ shortId: customShortId });
    if (existingShortId) {
      throw new ApiError(
        409,
        "This custom short ID is already taken. Please choose another one"
      );
    }
    shortId = customShortId;
  } else {
    const length = idLength || 8;
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
    userId: user._id,
  });

  if (existingUrl) {
    return {
      shortId: existingUrl.shortId,
      redirectUrl: existingUrl.redirectUrl,
      fullShortUrl: `${getBaseUrl()}/${existingUrl.shortId}`,
      isExisting: true,
    };
  }

  const newUrl = await URL.create({
    userId: user._id,
    shortId,
    redirectUrl: url,
    visitHistory: [],
  });

  return {
    shortId: newUrl.shortId,
    redirectUrl: newUrl.redirectUrl,
    fullShortUrl: `${getBaseUrl()}/${newUrl.shortId}`,
    isCustom: !!customShortId,
  };
};

export const getAnalytics = async (
  shortId: string
): Promise<AnalyticsOutput> => {
  const result = await URL.findOne({ shortId });
  if (!result) {
    throw new ApiError(404, "Short URL not found");
  }

  return {
    totalClicks: result.visitHistory.length,
    analytics: result.visitHistory,
  };
};

export const updateShortURL = async (
  input: UpdateShortURLInput,
  user: IUserDocument
): Promise<UpdateShortURLOutput> => {
  const { shortId, qrCode } = input;

  const url = await URL.findOne({ shortId, userId: user._id });

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

  return {
    shortId: url.shortId,
    redirectUrl: url.redirectUrl,
    qrCode: url.qrCode,
    fullShortUrl: `${getBaseUrl()}/${url.shortId}`,
    updatedAt: url.updatedAt,
  };
};

export const getAllUrls = async (
  user: IUserDocument,
  page: number,
  limit: number,
  sortBy: string,
  sortOrder: "asc" | "desc"
): Promise<{
  urls: URLWithAnalytics[];
  totalUrls: number;
  totalClicks: number;
  pagination: PaginationInfo;
}> => {
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const aggregate = URL.aggregate([
    { $match: { userId: user._id } },
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
        userId: 1,
        isDeleted: 1,
        qrCode: 1,
      },
    },
    { $sort: { [sortBy]: sortDirection } },
  ]);

  const result = await URL.aggregatePaginate(aggregate, { page, limit });

  if (!result.docs || result.docs.length === 0) {
    return {
      urls: [],
      totalUrls: 0,
      totalClicks: 0,
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalDocs: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  const totalClicks = result.docs.reduce(
    (sum: number, url: { totalClicks: number }) => sum + url.totalClicks,
    0
  );

  return {
    urls: result.docs as URLWithAnalytics[],
    totalUrls: result.totalDocs,
    totalClicks,
    pagination: {
      currentPage: result.page ?? page,
      totalPages: result.totalPages,
      totalDocs: result.totalDocs,
      limit: result.limit,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
      nextPage: result.nextPage,
      prevPage: result.prevPage,
    },
  };
};

export const deleteURL = async (
  shortId: string,
  user: IUserDocument
): Promise<DeleteURLOutput> => {
  const url = await URL.findOne({ shortId, userId: user._id });

  if (!url) {
    throw new ApiError(
      404,
      "Short URL not found or you don't have permission to delete it"
    );
  }

  url.isDeleted = !url.isDeleted;
  await url.save({ validateBeforeSave: false });

  return {
    shortId: url.shortId,
    isDeleted: url.isDeleted,
  };
};

export const getOriginalURL = async (shortId: string): Promise<string> => {
  const entry = await URL.findOneAndUpdate(
    { shortId },
    { $push: { visitHistory: { timestamp: new Date() } } },
    { new: true }
  );

  if (!entry) {
    throw new ApiError(404, "Short URL not found");
  }

  return entry.redirectUrl;
};
