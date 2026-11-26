import { Request, Response } from "express";
import { z } from "zod";
import {
  createComment,
  getTaskComments,
  upadteComment,
  deleteComment,
} from "./comment.service.js";

const commentContentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment content is required")
    .max(2000, "Comment cannot exceed 2000 characters"),
});

export async function create(req: Request, res: Response) {
  try {
    const taskId = req.params.taskId as string;
    const userId = req.user!.userId;
    const { content } = commentContentSchema.parse(req.body);

    const comment = await createComment(taskId, userId, content);

    return res.status(201).json({
      success: true,
      comment,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    const status =
      message === "Task not found"
        ? 404
        : message === "You are not a member of this project"
        ? 403
        : 400;
    return res.status(status).json({
      success: false,
      message,
    });
  }
}

export async function getAll(req: Request, res: Response) {
  try {
    const taskId = req.params.taskId as string;
    const comments = await getTaskComments(taskId, req.user!.userId);

    return res.status(200).json({
      success: true,
      comments,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    const status =
      message === "Task not found"
        ? 404
        : message === "You are not a member of this project"
        ? 403
        : 400;
    return res.status(status).json({
      success: false,
      message,
    });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const commentId = req.params.commentId as string;
    const userId = req.user!.userId;
    const { content } = commentContentSchema.parse(req.body);

    const comment = await upadteComment(commentId, userId, content);

    return res.status(200).json({
      success: true,
      comment,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    const status =
      message === "Comment not found"
        ? 404
        : message === "You can only edit your own comment"
        ? 403
        : 400;
    return res.status(status).json({
      success: false,
      message,
    });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    const commentId = req.params.commentId as string;
    const userId = req.user!.userId;

    const result = await deleteComment(commentId, userId);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    const status =
      message === "Comment not found"
        ? 404
        : message === "You can only delete your own comment"
        ? 403
        : 400;
    return res.status(status).json({
      success: false,
      message,
    });
  }
}
