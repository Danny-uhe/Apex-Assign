import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import swaggerUi from "swagger-ui-express";
import { httpLogger } from "./config/logger.js";
import { sanitizeInputs } from "./utils/sanitize.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import { authenticate } from "./middleware/auth.middleware.js";
import { requireAdmin } from "./middleware/requireAdmin.middleware.js";
import { getAllowedOrigins } from "./sockets/socket.js";
import { downloadAttachment } from "./modules/tasks/task-attachment.controller.js";

import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/users.routes.js";
import projectRoutes from "./modules/projects/project.routes.js";
import taskRoutes from "./modules/tasks/task.routes.js";
import personalTaskRoutes from "./modules/personal-tasks/personal-task.routes.js";
import commentRoutes from "./modules/comments/comment.routes.js";
import notificationRoutes from "./modules/notifications/ntification.routes.js";
import invitationRoutes from "./modules/invitaions/invitation.routes.js";
import messageRoutes from "./modules/messages/message.routes.js";
import globalMessageRoutes from "./modules/globalMessages/globalMessage.routes.js";
import directMessageRoutes from "./modules/directMessages/directMessage.routes.js";
import oauthRoutes from "./modules/oauth/oauth.routes.js";
import { authLimiter, chatLimiter, apiLimiter } from "./middleware/rateLimiter.js";

// Admin Routes
import adminRoutes from "./modules/users/admin.routes.js";
import orgRoutes from "./modules/organisations/organisation.routes.js";
import activityRoutes from "./modules/activity/activity.routes.js";
import leaderboardRoutes from "./modules/gamification/gamification.routes.js";

const app = express();

// ── CORS — explicit allowlist (no wildcard *.onrender.com) ─────────────────
const allowedOrigins = new Set(getAllowedOrigins());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(sanitizeInputs);
app.use(httpLogger);

// ── Rate limiting ──────────────────────────────────────────────────────────
app.set("trust proxy", 1);
app.use("/api/", apiLimiter);

// ── Health & Readiness checks (used by Render / monitors) ──────────────────
app.get("/api/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/health/ready", async (_, res) => {
  try {
    const { prisma } = await import("./config/prisma.js");
    const { isRedisReady } = await import("./config/redis.js");
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ready",
      db: "ok",
      redis: isRedisReady() ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({ status: "not_ready", db: "error" });
  }
});

// ── Swagger API Docs (admin-only in production) ────────────────────────────
const docsAuth =
  env.NODE_ENV === "production"
    ? [authenticate, requireAdmin]
    : [];

app.use("/api/docs", ...docsAuth, swaggerUi.serve);
app.get(
  "/api/docs",
  ...docsAuth,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "ApexAssign API Docs",
    customCss: ".swagger-ui .topbar { display: none }",
  })
);

app.get("/api/docs.json", ...docsAuth, (_, res) => {
  res.json(swaggerSpec);
});

// Admin Routes
app.use("/api/admin", adminRoutes);

app.get("/", (_, res) => {
  res.json({ success: true, message: "ApexAssign API is running 🚀" });
});

// Serve task attachments ONLY to authenticated project members
app.get("/uploads/tasks/:fileName", authenticate, downloadAttachment);

// Mount all API routes under /api/v1 and /api (backward-compatible alias)
const apiRouter = express.Router();
apiRouter.use("/auth", authLimiter, authRoutes);
apiRouter.use("/users", userRoutes);
apiRouter.use("/projects", projectRoutes);
apiRouter.use("/", taskRoutes);
apiRouter.use("/personal-tasks", personalTaskRoutes);
apiRouter.use("/", commentRoutes);
apiRouter.use("/notifications", notificationRoutes);
apiRouter.use("/invitations", invitationRoutes);
apiRouter.use("/organisation", orgRoutes);
apiRouter.use("/projects/:projectId/messages", chatLimiter, messageRoutes);
apiRouter.use("/activity", activityRoutes);
apiRouter.use("/leaderboard", leaderboardRoutes);
apiRouter.use("/chat", chatLimiter, globalMessageRoutes);
apiRouter.use("/dm", chatLimiter, directMessageRoutes);
apiRouter.use("/oauth", oauthRoutes);

app.use("/api/v1", apiRouter);
app.use("/api", apiRouter);

// ── Centralized Error Handler ──────────────────────────────────────────────
app.use(errorHandler);

export default app;
