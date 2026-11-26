import { Request, Response } from "express";
import { z } from "zod";
import {
  getGlobalMessages,
  createGlobalMessage,
  deleteGlobalMessage,
} from "./globalMessage.service.js";

const globalMessageSchema = z.object({
  content: z.string().trim().min(1, "Content is required").max(2000),
});

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
    const { content } = globalMessageSchema.parse(req.body);
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
