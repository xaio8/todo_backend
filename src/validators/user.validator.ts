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