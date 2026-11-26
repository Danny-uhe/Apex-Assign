import { z } from "zod";

const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid 6-digit hex code");

export const createProjectSchema = z.object({
  name: z.string().trim().min(3, "Project name is required").max(120),
  description: z.string().trim().max(1000).optional(),
  color: hexColorSchema.optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().trim().min(3, "Project name is required").max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  color: hexColorSchema.optional(),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const addProjectMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["admin", "member"]).default("member"),
});

export type AddProjectMemberInput = z.infer<
  typeof addProjectMemberSchema
>;