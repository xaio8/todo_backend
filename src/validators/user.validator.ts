import z from "zod";

//! Validation
export const updateUserSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 2 characters")
    .max(255, "Name is too long")
    .optional(),
  email: z.email("Invalid email format").optional(),
});

export const searchUserSchema = z.object({
  q: z.string().min(1, "Search query must be at least 1 character").max(50),
  limit: z.coerce.number().int().min(1).max(20).optional().default(10),
});
