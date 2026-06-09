import z from "zod";

export const createTodoSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.iso.datetime().nullable().optional(),
  scheduledAt: z.iso.datetime().nullable().optional(),
  isAllDay: z.boolean().optional(),
});

export const updateTodoSchema = createTodoSchema.partial();
