import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
  listGlobalMessages,
  sendGlobalMessage,
  removeGlobalMessage,
} from "./globalMessage.controller.js";

const router = Router();

router.get("/messages", authenticate, listGlobalMessages);
router.post("/messages", authenticate, sendGlobalMessage);
router.delete("/messages/:messageId", authenticate, removeGlobalMessage);

export default router;
