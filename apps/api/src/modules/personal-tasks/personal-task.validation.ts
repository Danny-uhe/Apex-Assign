import { z } from "zod";

const dateStringToISO = z
  .string()
  .transform((v) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T23:59:59.999Z`;
    return v;
  })
  .pipe(z.string().datetime());

export const createPersonalTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(200),
  description: z.string().trim().max(5000).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["todo", "in_progress", "done"]).default("todo"),
  repeat: z.enum(["none", "daily", "weekly", "monthly"]).default("none"),
  dueDate: dateStringToISO.optional(),
  reminderAt: dateStringToISO.optional(),
  expiresAt: dateStringToISO.optional(),
});

export type CreatePersonalTaskInput = z.infer<typeof createPersonalTaskSchema>;

export const updatePersonalTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(200).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["todo", "in_progress", "done"]).optional(),
  repeat: z.enum(["none", "daily", "weekly", "monthly"]).optional(),
  dueDate: dateStringToISO.nullable().optional(),
  reminderAt: dateStringToISO.nullable().optional(),
  expiresAt: dateStringToISO.nullable().optional(),
});

export type UpdatePersonalTaskInput = z.infer<typeof updatePersonalTaskSchema>;

export const setReminderSchema = z.object({
  reminderAt: dateStringToISO,
});

export type SetReminderInput = z.infer<typeof setReminderSchema>;
