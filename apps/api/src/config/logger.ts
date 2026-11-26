import crypto from "node:crypto";
import pino from "pino";
import { pinoHttp } from "pino-http";
import { env } from "./env.js";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.currentPassword",
      "*.newPassword",
      "*.refreshToken",
      "*.token",
    ],
    censor: "[REDACTED]",
  },
  ...(env.NODE_ENV === "development" && !process.env.NODE_TEST_CONTEXT && {
    transport: {
      target: "pino-pretty",
      options: { colorize: true, translateTime: "SYS:standard", ignore: "pid,hostname" },
    },
  }),
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existing = req.headers["x-request-id"];
    const id = typeof existing === "string" && existing.trim() ? existing : crypto.randomUUID();
    res.setHeader("X-Request-Id", id);
    return id;
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  autoLogging: {
    ignore: (req) => req.url === "/api/health",
  },
});
