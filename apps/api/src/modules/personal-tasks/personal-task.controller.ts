import { Request, Response } from "express";
import {
  createPersonalTask,
  getPersonalTasks,
  getPersonalTaskById,
  updatePersonalTask,
  deletePersonalTask,
  getPersonalTasksCalendar,
  setPersonalTaskReminder,
} from "./personal-task.service.js";
import {
  createPersonalTaskSchema,
  updatePersonalTaskSchema,
  setReminderSchema,
} from "./personal-task.validation.js";

export async function create(req: Request, res: Response) {
  try {
    const body = createPersonalTaskSchema.parse(req.body);
    const task = await createPersonalTask(req.user!.userId, body);
    return res.status(201).json({ success: true, task });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create personal task",
    });
  }
}

export async function getAll(req: Request, res: Response) {
  try {
    const month = typeof req.query.month === "string" ? req.query.month : undefined;
    const tasks = await getPersonalTasks(req.user!.userId, month);
    return res.json({ success: true, tasks });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch personal tasks",
    });
  }
}

export async function getOne(req: Request, res: Response) {
  try {
    const task = await getPersonalTaskById(
      req.params.id as string,
      req.user!.userId
    );
    return res.json({ success: true, task });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return res.status(message === "Personal task not found" ? 404 : 400).json({
      success: false,
      message,
    });
  }
}

export async function update(req: Request, res: Response) {
  try {
    const body = updatePersonalTaskSchema.parse(req.body);
    const { task, nextTask } = await updatePersonalTask(
      req.params.id as string,
      req.user!.userId,
      body
    );
    return res.json({ success: true, task, nextTask });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update personal task";
    return res.status(message === "Personal task not found" ? 404 : 400).json({
      success: false,
      message,
    });
  }
}

export async function remove(req: Request, res: Response) {
  try {
    await deletePersonalTask(req.params.id as string, req.user!.userId);
    return res.json({
      success: true,
      message: "Personal task deleted successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete personal task";
    return res.status(message === "Personal task not found" ? 404 : 400).json({
      success: false,
      message,
    });
  }
}

export async function getCalendar(req: Request, res: Response) {
  try {
    const year = Number(req.params.year);
    const month = Number(req.params.month);
    const calendar = await getPersonalTasksCalendar(req.user!.userId, year, month);
    return res.json({ success: true, calendar });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch calendar tasks",
    });
  }
}

export async function setReminder(req: Request, res: Response) {
  try {
    const body = setReminderSchema.parse(req.body);
    const task = await setPersonalTaskReminder(
      req.params.id as string,
      req.user!.userId,
      body.reminderAt
    );
    return res.json({ success: true, task });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to set reminder";
    return res.status(message === "Personal task not found" ? 404 : 400).json({
      success: false,
      message,
    });
  }
}
