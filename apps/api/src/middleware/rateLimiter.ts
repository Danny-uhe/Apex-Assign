import { rateLimit } from "express-rate-limit";

// ── Auth endpoints: 10 attempts per 15 minutes ─────────────────────────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please try again in 15 minutes." },
  skipSuccessfulRequests: true, // only count failed attempts
});

// ── Global chat: 60 messages per minute ───────────────────────────────────
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Slow down! You're sending messages too fast." },
});

// ── General API: 300 requests per minute ──────────────────────────────────
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Rate limit exceeded. Please slow down." },
});
