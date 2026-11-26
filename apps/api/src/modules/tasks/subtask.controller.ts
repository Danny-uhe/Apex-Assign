import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";

const createSubtaskSchema = z.object({
  title: z.string().trim().min(1, "Subtask title is required").max(200),
});

const updateSubtaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  isDone: z.boolean().optional(),
});

async function assertTaskMembership(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, projectId: true },
  });
  if (!task) throw new Error("Task not found");

  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId: task.projectId } },
  });
  if (!member) throw new Error("You are not a member of this project");
  return task;
}

export async function listSubtasks(req: Request, res: Response) {
  try {
    await assertTaskMembership(req.params.taskId as string, req.user!.userId);
    const subtasks = await prisma.subtask.findMany({
      where: { taskId: req.params.taskId as string },
      orderBy: { createdAt: "asc" },
    });
    return res.json({ success: true, subtasks });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch subtasks";
    return res.status(msg === "Task not found" ? 404 : 403).json({ success: false, message: msg });
  }
}

export async function createSubtask(req: Request, res: Response) {
  try {
    const { title } = createSubtaskSchema.parse(req.body);
    await assertTaskMembership(req.params.taskId as string, req.user!.userId);
    const subtask = await prisma.subtask.create({
      data: { title, taskId: req.params.taskId as string },
    });
    return res.status(201).json({ success: true, subtask });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to create subtask";
    const status = msg === "Task not found" ? 404 : msg.includes("member") ? 403 : 400;
    return res.status(status).json({ success: false, message: msg });
  }
}

export async function updateSubtask(req: Request, res: Response) {
  try {
    const body = updateSubtaskSchema.parse(req.body);
    const existing = await prisma.subtask.findUnique({
      where: { id: req.params.subtaskId as string },
      select: { id: true, taskId: true },
    });
    if (!existing) return res.status(404).json({ success: false, message: "Subtask not found" });
    await assertTaskMembership(existing.taskId, req.user!.userId);

    const subtask = await prisma.subtask.update({
      where: { id: existing.id },
      data: body,
    });
    return res.json({ success: true, subtask });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to update subtask";
    return res.status(msg.includes("member") ? 403 : 400).json({ success: false, message: msg });
  }
}

export async function deleteSubtask(req: Request, res: Response) {
  try {
    const existing = await prisma.subtask.findUnique({
      where: { id: req.params.subtaskId as string },
      select: { id: true, taskId: true },
    });
    if (!existing) return res.status(404).json({ success: false, message: "Subtask not found" });
    await assertTaskMembership(existing.taskId, req.user!.userId);

    await prisma.subtask.delete({ where: { id: existing.id } });
    return res.json({ success: true, message: "Subtask deleted" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to delete subtask";
    return res.status(msg.includes("member") ? 403 : 400).json({ success: false, message: msg });
  }
}
