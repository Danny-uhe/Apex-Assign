import { Request, Response } from "express";
import {
  getDirectMessages,
  sendDirectMessage,
  deleteDirectMessage,
  getConversations,
} from "./directMessage.service.js";

/** GET /dm/conversations — list recent DM threads */
export async function listConversations(req: Request, res: Response) {
  try {
    const conversations = await getConversations(req.user!.userId);
    return res.json({ success: true, conversations });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

/** GET /dm/:userId — get messages with a specific user */
export async function listMessages(req: Request, res: Response) {
  try {
    const otherUserId = req.params.userId as string;
    const cursor = req.query.cursor as string | undefined;
    const messages = await getDirectMessages(
      req.user!.userId,
      otherUserId,
      cursor
    );
    return res.json({ success: true, messages });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

/** POST /dm/:userId — send a DM */
export async function sendMessage(req: Request, res: Response) {
  try {
    const receiverId = req.params.userId as string;
    const { content } = req.body as { content: string };
    if (!content?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Content is required" });
    }
    const message = await sendDirectMessage(
      req.user!.userId,
      receiverId,
      content
    );
    return res.status(201).json({ success: true, message });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

/** DELETE /dm/messages/:messageId — delete own DM */
export async function removeMessage(req: Request, res: Response) {
  try {
    const messageId = req.params.messageId as string;
    const result = await deleteDirectMessage(messageId, req.user!.userId);
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}
