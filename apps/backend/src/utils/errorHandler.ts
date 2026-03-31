import { TRPCError } from "@trpc/server";
import { ApiError } from "./apiError";
import logger from "./logger";

type TRPCErrorCode =
  | "PARSE_ERROR"
  | "BAD_REQUEST"
  | "INTERNAL_SERVER_ERROR"
  | "NOT_IMPLEMENTED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "METHOD_NOT_SUPPORTED"
  | "TIMEOUT"
  | "CONFLICT"
  | "PRECONDITION_FAILED"
  | "PAYLOAD_TOO_LARGE"
  | "UNPROCESSABLE_CONTENT"
  | "TOO_MANY_REQUESTS"
  | "CLIENT_CLOSED_REQUEST";

const statusCodeToTRPCCode = (statusCode: number): TRPCErrorCode => {
  const mapping: Record<number, TRPCErrorCode> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_SUPPORTED",
    408: "TIMEOUT",
    409: "CONFLICT",
    412: "PRECONDITION_FAILED",
    413: "PAYLOAD_TOO_LARGE",
    422: "UNPROCESSABLE_CONTENT",
    429: "TOO_MANY_REQUESTS",
    499: "CLIENT_CLOSED_REQUEST",
    500: "INTERNAL_SERVER_ERROR",
    501: "NOT_IMPLEMENTED",
  };
  return mapping[statusCode] || "INTERNAL_SERVER_ERROR";
};

const handleError = (error: unknown): never => {
  if (error instanceof TRPCError) {
    logger.warn("TRPCError handled", {
      code: error.code,
      message: error.message,
    });
    throw error;
  }

  if (error instanceof ApiError) {
    logger.warn("API Error handled", {
      statusCode: error.statusCode,
      message: error.message,
    });
    throw new TRPCError({
      code: statusCodeToTRPCCode(error.statusCode),
      message: error.message,
    });
  }

  if (error instanceof Error) {
    logger.error("Unexpected error handled", {
      message: error.message,
      stack: error.stack,
    });
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
    });
  }

  logger.error("Unknown error handled", { error });
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
  });
};

export { handleError, statusCodeToTRPCCode };
