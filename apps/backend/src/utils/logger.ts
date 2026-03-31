import winston from "winston";
import LokiTransport from "winston-loki";

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

const customLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    trace: 5,
  },
  colors: {
    fatal: "red",
    error: "red",
    warn: "yellow",
    info: "green",
    debug: "blue",
    trace: "gray",
  },
};

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr =
      Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : "";
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.json()
);

const transports: winston.transport[] = [];

if (isDevelopment) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.LOG_LEVEL || "debug",
    })
  );
}

transports.push(
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
    format: jsonFormat,
    maxsize: 10485760,
    maxFiles: 5,
  })
);

transports.push(
  new winston.transports.File({
    filename: "logs/combined.log",
    level: process.env.LOG_LEVEL || "info",
    format: jsonFormat,
    maxsize: 10485760,
    maxFiles: 5,
  })
);

if (isProduction && process.env.LOKI_HOST) {
  transports.push(
    new LokiTransport({
      host: process.env.LOKI_HOST || "http://localhost:3100",
      labels: {
        app: "url-shortener-backend",
        environment: process.env.NODE_ENV || "development",
        service: "api",
      },
      json: true,
      format: jsonFormat,
      replaceTimestamp: true,
      onConnectionError: (error: Error) => {
        console.error("Loki connection error:", error);
      },
    })
  );
}

export const logger = winston.createLogger({
  levels: customLevels.levels,
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: "logs/exceptions.log" }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: "logs/rejections.log" }),
  ],
});

winston.addColors(customLevels.colors);

export default logger;
