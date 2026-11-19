import { Request, Response } from "express";
import {
  getGlobalMessages,
  createGlobalMessage,
  deleteGlobalMessage,
} from "./globalMessage.service.js";

export async function listGlobalMessages(req: Request, res: Response) {
  try {
    const cursor = req.query.cursor as string | undefined;
    const messages = await getGlobalMessages(req.user!.userId, cursor);
    return res.json({ success: true, messages });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

export async function sendGlobalMessage(req: Request, res: Response) {
  try {
    const { content } = req.body as { content: string };
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: "Content is required" });
    }
    const message = await createGlobalMessage(req.user!.userId, content);
    return res.status(201).json({ success: true, message });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}

export async function removeGlobalMessage(req: Request, res: Response) {
  try {
    const messageId = req.params.messageId as string;
    const result = await deleteGlobalMessage(messageId, req.user!.userId);
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
}
