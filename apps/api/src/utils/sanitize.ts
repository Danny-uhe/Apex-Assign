import type { NextFunction, Request, Response } from "express";
import sanitizeHtml from "sanitize-html";

const SENSITIVE_SKIP_KEYS = new Set([
  "password",
  "currentPassword",
  "newPassword",
  "confirmPassword",
  "token",
  "refreshToken",
]);

const FORBIDDEN_PROTO_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const MAX_JSON_DEPTH = 10;

export function stripHtml(input: string): string {
  // Remove null bytes and strip all HTML tags/attributes to prevent stored/reflected XSS
  const cleaned = input.replace(/\0/g, "");
  return sanitizeHtml(cleaned, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: "discard",
  }).trim();
}

function sanitizeValue(value: unknown, depth: number): unknown {
  if (depth > MAX_JSON_DEPTH) {
    throw new Error("Payload nesting depth exceeded");
  }

  if (typeof value === "string") {
    return stripHtml(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (FORBIDDEN_PROTO_KEYS.has(key)) {
        throw new Error("Invalid payload key");
      }
      if (SENSITIVE_SKIP_KEYS.has(key)) {
        out[key] = typeof val === "string" ? val.replace(/\0/g, "") : val;
      } else {
        out[key] = sanitizeValue(val, depth + 1);
      }
    }
    return out;
  }

  return value;
}

/**
 * Global middleware that strips null bytes, blocks prototype pollution keys,
 * limits object nesting depth, and strips HTML/XSS from req.body and req.query.
 */
export function sanitizeInputs(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.body && typeof req.body === "object") {
      req.body = sanitizeValue(req.body, 0);
    }

    if (req.query && typeof req.query === "object") {
      for (const [key, val] of Object.entries(req.query)) {
        if (FORBIDDEN_PROTO_KEYS.has(key)) {
          return res.status(400).json({ success: false, message: "Invalid query parameter" });
        }
        if (typeof val === "string") {
          (req.query as Record<string, unknown>)[key] = stripHtml(val);
        }
      }
    }

    next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err instanceof Error ? err.message : "Malformed request payload",
    });
  }
}
