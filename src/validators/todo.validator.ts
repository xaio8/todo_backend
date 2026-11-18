import z from "zod";

export const createTodoSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["pending", "in_progress", "completed"]).optional(),
  dueDate: z.iso.datetime().nullable().optional(),
  scheduledAt: z.iso.datetime().nullable().optional(),
  isAllDay: z.boolean().optional(),
  // ISO datetime strings - one reminder per entry
  remindAt: z.array(z.iso.datetime()).optional(),
});

export const updateTodoSchema = createTodoSchema.partial();
