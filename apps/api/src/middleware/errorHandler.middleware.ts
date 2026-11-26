import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import multer from "multer";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Malformed JSON payload",
    });
  }

  if (err instanceof Error && err.message.startsWith("CORS:")) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  logger.error({ err, reqId: req.id, path: req.path }, "Unhandled API error");

  return res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === "production"
        ? "Internal server error"
        : err instanceof Error
        ? err.message
        : "Internal server error",
  });
}
