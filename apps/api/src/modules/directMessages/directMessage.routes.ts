import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import {
  listConversations,
  listMessages,
  sendMessage,
  removeMessage,
} from "./directMessage.controller.js";

const router = Router();

// List all DM conversations (recent threads)
router.get("/conversations", authenticate, listConversations);

// Get message history with a specific user
router.get("/:userId", authenticate, listMessages);

// Send a DM to a specific user
router.post("/:userId", authenticate, sendMessage);

// Delete a DM
router.delete("/messages/:messageId", authenticate, removeMessage);

export default router;
