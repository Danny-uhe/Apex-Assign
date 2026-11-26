import { prisma } from "../../config/prisma.js";
import { createNotification } from "../notifications/notification.service.js";
import { queueTaskReminderEmail } from "../../queues/email.queue.js";
import { getIO } from "../../sockets/socket.js";
import { env } from "../../config/env.js";
import type {
  CreatePersonalTaskInput,
  UpdatePersonalTaskInput,
} from "./personal-task.validation.js";

function shiftDateByRepeat(
  date: Date | null,
  repeat: string
): Date | null {
  if (!date) return null;
  const next = new Date(date.getTime());
  if (repeat === "daily") next.setUTCDate(next.getUTCDate() + 1);
  else if (repeat === "weekly") next.setUTCDate(next.getUTCDate() + 7);
  else if (repeat === "monthly") next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}

function isTaskPastDue(
  task: { dueDate: Date | null; expiresAt: Date | null; status: string },
  now: Date
): boolean {
  if (task.status === "done") return false;
  if (task.dueDate && task.dueDate < now) return true;
  if (task.expiresAt && task.expiresAt < now) return true;
  return false;
}

async function syncExpiredTasks<
  T extends {
    id: string;
    title: string;
    userId: string;
    dueDate: Date | null;
    expiresAt: Date | null;
    status: string;
    isExpired: boolean;
  },
>(tasks: T[]): Promise<T[]> {
  const now = new Date();
  const newlyExpired: T[] = [];

  for (const task of tasks) {
    if (!task.isExpired && isTaskPastDue(task, now)) {
      newlyExpired.push(task);
    }
  }

  if (newlyExpired.length > 0) {
    await prisma.personalTask.updateMany({
      where: { id: { in: newlyExpired.map((t) => t.id) } },
      data: { isExpired: true },
    });

    await Promise.all(
      newlyExpired.map(async (task) => {
        try {
          await createNotification(
            task.userId,
            "PERSONAL_TASK_EXPIRED",
            `Your task '${task.title}' has expired`,
            task.id
          );
        } catch (err) {
          console.error(
            `[PersonalTask] Failed to notify expiration for task ${task.id}:`,
            err
          );
        }
      })
    );
  }

  const expiredSet = new Set(newlyExpired.map((t) => t.id));
  return tasks.map((task) =>
    expiredSet.has(task.id) ? { ...task, isExpired: true } : task
  );
}

export async function createPersonalTask(
  userId: string,
  data: CreatePersonalTaskInput
) {
  const now = new Date();
  const dueDate = data.dueDate ? new Date(data.dueDate) : null;
  const reminderAt = data.reminderAt ? new Date(data.reminderAt) : null;
  const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;

  const isExpired = isTaskPastDue(
    { dueDate, expiresAt, status: data.status },
    now
  );

  const task = await prisma.personalTask.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      repeat: data.repeat,
      dueDate,
      reminderAt,
      expiresAt,
      isExpired,
      userId,
    },
  });

  if (reminderAt && reminderAt <= now && task.status !== "done") {
    try {
      await createNotification(
        userId,
        "PERSONAL_TASK_REMINDER",
        `Reminder: ${task.title}`,
        task.id
      );
    } catch (err) {
      console.error("[PersonalTask] Failed to create reminder notification:", err);
    }
  }

  return task;
}

export async function getPersonalTasks(userId: string, month?: string) {
  let dueDateFilter: { gte: Date; lt: Date } | undefined;

  if (month) {
    const match = /^(\d{4})-(\d{2})$/.exec(month);
    if (!match) {
      throw new Error("Invalid month format. Expected YYYY-MM");
    }
    const year = Number(match[1]);
    const monthNum = Number(match[2]);
    if (monthNum < 1 || monthNum > 12) {
      throw new Error("Month must be between 01 and 12");
    }
    dueDateFilter = {
      gte: new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0)),
      lt: new Date(Date.UTC(year, monthNum, 1, 0, 0, 0, 0)),
    };
  }

  const tasks = await prisma.personalTask.findMany({
    where: {
      userId,
      ...(dueDateFilter ? { dueDate: dueDateFilter } : {}),
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return syncExpiredTasks(tasks);
}

export async function getPersonalTaskById(taskId: string, userId: string) {
  const task = await prisma.personalTask.findFirst({
    where: { id: taskId, userId },
  });

  if (!task) {
    throw new Error("Personal task not found");
  }

  const [synced] = await syncExpiredTasks([task]);
  return synced;
}

export async function updatePersonalTask(
  taskId: string,
  userId: string,
  data: UpdatePersonalTaskInput
) {
  const existing = await prisma.personalTask.findFirst({
    where: { id: taskId, userId },
  });

  if (!existing) {
    throw new Error("Personal task not found");
  }

  const nextStatus = data.status ?? existing.status;
  const nextDueDate =
    data.dueDate === undefined
      ? existing.dueDate
      : data.dueDate === null
        ? null
        : new Date(data.dueDate);
  const nextExpiresAt =
    data.expiresAt === undefined
      ? existing.expiresAt
      : data.expiresAt === null
        ? null
        : new Date(data.expiresAt);
  const nextReminderAt =
    data.reminderAt === undefined
      ? existing.reminderAt
      : data.reminderAt === null
        ? null
        : new Date(data.reminderAt);

  const now = new Date();
  const nextIsExpired = isTaskPastDue(
    { dueDate: nextDueDate, expiresAt: nextExpiresAt, status: nextStatus },
    now
  );

  const updated = await prisma.personalTask.update({
    where: { id: taskId },
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      repeat: data.repeat,
      dueDate:
        data.dueDate === undefined
          ? undefined
          : data.dueDate === null
            ? null
            : nextDueDate,
      reminderAt:
        data.reminderAt === undefined
          ? undefined
          : data.reminderAt === null
            ? null
            : nextReminderAt,
      expiresAt:
        data.expiresAt === undefined
          ? undefined
          : data.expiresAt === null
            ? null
            : nextExpiresAt,
      isExpired: nextIsExpired,
    },
  });

  // If a recurring task was just completed, spawn the next occurrence
  let nextTask = null;
  if (
    existing.status !== "done" &&
    updated.status === "done" &&
    updated.repeat !== "none"
  ) {
    const baseDue = updated.dueDate ?? new Date();
    const nextDue = shiftDateByRepeat(baseDue, updated.repeat);
    const nextRem = shiftDateByRepeat(updated.reminderAt, updated.repeat);
    const nextExp = shiftDateByRepeat(updated.expiresAt, updated.repeat);

    nextTask = await prisma.personalTask.create({
      data: {
        title: updated.title,
        description: updated.description,
        priority: updated.priority,
        status: "todo",
        repeat: updated.repeat,
        dueDate: nextDue,
        reminderAt: nextRem,
        expiresAt: nextExp,
        isExpired: false,
        userId,
      },
    });
  }

  return { task: updated, nextTask };
}

export async function deletePersonalTask(taskId: string, userId: string) {
  const existing = await prisma.personalTask.findFirst({
    where: { id: taskId, userId },
  });

  if (!existing) {
    throw new Error("Personal task not found");
  }

  await prisma.personalTask.delete({
    where: { id: taskId },
  });

  return true;
}

export async function getPersonalTasksCalendar(
  userId: string,
  year: number,
  month: number
) {
  if (!Number.isInteger(year) || year < 1970 || year > 2100) {
    throw new Error("Invalid year");
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Invalid month");
  }

  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  const tasks = await prisma.personalTask.findMany({
    where: {
      userId,
      dueDate: {
        gte: start,
        lt: end,
      },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  const synced = await syncExpiredTasks(tasks);
  const calendar: Record<string, typeof synced> = {};

  for (const task of synced) {
    if (!task.dueDate) continue;
    const key = task.dueDate.toISOString().slice(0, 10);
    if (!calendar[key]) {
      calendar[key] = [];
    }
    calendar[key].push(task);
  }

  return calendar;
}

export async function setPersonalTaskReminder(
  taskId: string,
  userId: string,
  reminderAtStr: string
) {
  const existing = await prisma.personalTask.findFirst({
    where: { id: taskId, userId },
  });

  if (!existing) {
    throw new Error("Personal task not found");
  }

  const reminderAt = new Date(reminderAtStr);
  const updated = await prisma.personalTask.update({
    where: { id: taskId },
    data: { reminderAt },
  });

  const now = new Date();
  if (reminderAt <= now && updated.status !== "done") {
    try {
      await createNotification(
        userId,
        "PERSONAL_TASK_REMINDER",
        `Reminder: ${updated.title}`,
        updated.id
      );
    } catch (err) {
      console.error("[PersonalTask] Failed to create reminder notification:", err);
    }
  }

  return updated;
}

export async function checkExpiredTasks() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // 1. Find uncompleted, non-expired tasks past dueDate or expiresAt
  const expiredTasks = await prisma.personalTask.findMany({
    where: {
      status: { not: "done" },
      isExpired: false,
      OR: [{ dueDate: { lt: now } }, { expiresAt: { lt: now } }],
    },
  });

  if (expiredTasks.length > 0) {
    await prisma.personalTask.updateMany({
      where: { id: { in: expiredTasks.map((t) => t.id) } },
      data: { isExpired: true },
    });

    await Promise.all(
      expiredTasks.map(async (task) => {
        try {
          await createNotification(
            task.userId,
            "PERSONAL_TASK_EXPIRED",
            `Your task '${task.title}' has expired`,
            task.id
          );
        } catch (err) {
          console.error(
            `[PersonalTaskCron] Failed to notify expiration for task ${task.id}:`,
            err
          );
        }
      })
    );
  }

  // 2. Find tasks whose reminderAt fell in (now - 24h, now] and haven't been reminded since reminderAt
  const reminderTasks = await prisma.personalTask.findMany({
    where: {
      status: { not: "done" },
      reminderAt: {
        lte: now,
        gt: oneDayAgo,
      },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  let io: ReturnType<typeof getIO> | null = null;
  try {
    io = getIO();
  } catch {
    io = null;
  }

  let remindedCount = 0;
  await Promise.all(
    reminderTasks.map(async (task) => {
      try {
        const alreadySent = await prisma.notification.findFirst({
          where: {
            userId: task.userId,
            type: "PERSONAL_TASK_REMINDER",
            relatedId: task.id,
            createdAt: { gte: task.reminderAt! },
          },
          select: { id: true },
        });

        if (alreadySent) return;

        await createNotification(
          task.userId,
          "PERSONAL_TASK_REMINDER",
          `Reminder: ${task.title}`,
          task.id
        );
        remindedCount += 1;

        // If user is offline, also send an email reminder
        let isOnline = false;
        if (io) {
          try {
            isOnline = (await io.in(`user:${task.userId}`).fetchSockets()).length > 0;
          } catch {
            isOnline = false;
          }
        }
        if (!isOnline && task.user?.email) {
          await queueTaskReminderEmail({
            to: task.user.email,
            recipientName: task.user.name,
            taskTitle: task.title,
            dueLabel: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : undefined,
            tasksUrl: `${env.FRONTEND_URL}/my-tasks`,
          });
        }
      } catch (err) {
        console.error(
          `[PersonalTaskCron] Failed to send reminder for task ${task.id}:`,
          err
        );
      }
    })
  );

  // 3. Project tasks due within 24h or overdue (notify assignee once per state)
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const projectTasksWithDue = await prisma.task.findMany({
    where: {
      isArchived: false,
      status: { not: "done" },
      assignedToId: { not: null },
      dueDate: { lte: in24Hours },
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      assignedToId: true,
      project: { select: { name: true } },
    },
  });

  await Promise.all(
    projectTasksWithDue.map(async (task) => {
      if (!task.assignedToId || !task.dueDate) return;
      const isOverdue = task.dueDate < now;
      const notifType = isOverdue ? "TASK_OVERDUE" : "TASK_DUE_SOON";
      try {
        const existingNotif = await prisma.notification.findFirst({
          where: {
            userId: task.assignedToId,
            type: notifType,
            relatedId: task.id,
            createdAt: { gt: oneDayAgo },
          },
          select: { id: true },
        });
        if (existingNotif) return;

        await createNotification(
          task.assignedToId,
          notifType,
          isOverdue
            ? `Task overdue: "${task.title}" in ${task.project.name}`
            : `Task due soon: "${task.title}" in ${task.project.name}`,
          task.id
        );
      } catch (err) {
        console.error(
          `[PersonalTaskCron] Failed to notify project task due status ${task.id}:`,
          err
        );
      }
    })
  );

  return {
    expiredCount: expiredTasks.length,
    remindedCount,
  };
}
