import z from "zod";

export const loginSchema = z.object({
  email: z.email("Invalid email format").trim(),
  password: z
    .string()
    .min(6, " password must be at least 6 characters")
    .max(100, "password is too long"),
});

export const signUpSchema = z
  .object({
    // name: z.string().max(50),
    email: z.email("Please enter a valid email address").trim(),
    password: z
      .string()
      .min(6, " password must be at least 6 characters")
      .max(100, "password is too long"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
