import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import z from "zod";

export const validate =
  (schema: z.ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      const firstError = messages[0];
      const friendlyMessage = `${firstError.field}, ${firstError.message.toLowerCase()}`;

      return next(new AppError(`Validation field: ${friendlyMessage}`, 400));
    }
    req.body = result.data;
    next();
  };
