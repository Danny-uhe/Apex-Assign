import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty").max(100).optional(),
  bio: z.string().trim().max(300).optional(),
  position: z.string().trim().max(100).optional(),
  avatar: z
    .string()
    .url()
    .refine((u) => u.startsWith("https://") || u.startsWith("http://"), {
      message: "Avatar URL must use http or https",
    })
    .max(500)
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required").max(128),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters"),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
