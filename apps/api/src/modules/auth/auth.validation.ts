import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  email: z.string().trim().toLowerCase().pipe(z.email("Invalid email")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(128),
});

export const logoutSchema = z.object({
  refreshToken: z.string().min(1).max(2048),
});

export type LogoutInput = z.infer<typeof logoutSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).max(2048),
});

export type RefreshInput = z.infer<typeof refreshSchema>;
