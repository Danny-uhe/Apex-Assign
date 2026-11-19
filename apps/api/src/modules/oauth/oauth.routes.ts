import { Router, Request, Response } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";

const router = Router();

// GET /api/oauth/status — returns connection status for all providers
router.get("/status", authenticate, (_req: Request, res: Response) => {
  res.json({ google: false, github: false, slack: false });
});

// POST /api/oauth/connect/:provider — stub connect
router.post("/connect/:provider", authenticate, (_req: Request, res: Response) => {
  res.json({
    message:
      "OAuth not configured. Add GOOGLE_CLIENT_ID etc to environment variables.",
  });
});

// DELETE /api/oauth/disconnect/:provider — stub disconnect
router.delete("/disconnect/:provider", authenticate, (_req: Request, res: Response) => {
  res.json({ message: "Disconnected" });
});

export default router;
