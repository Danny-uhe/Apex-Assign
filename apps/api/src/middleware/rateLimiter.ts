import { rateLimit } from "express-rate-limit";

// ── Auth endpoints (login / refresh): 10 failed attempts per 15 minutes ────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please try again in 15 minutes." },
  skipSuccessfulRequests: true,
});

// ── Password reset & recovery: 5 attempts per 15 minutes (never skip 200) ──
export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many password reset attempts. Please try again in 15 minutes." },
});

// ── Public invitation token endpoints: 20 requests per 15 minutes ──────────
export const inviteTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many invitation requests. Please try again later." },
});

// ── Chat (project, global, DM): 60 messages per minute ─────────────────────
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Slow down! You're sending messages too fast." },
});

// ── File uploads: 30 uploads per 15 minutes ────────────────────────────────
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Upload rate limit exceeded. Please try again later." },
});

// ── General API: 300 requests per minute ───────────────────────────────────
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Rate limit exceeded. Please slow down." },
});
