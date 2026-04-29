import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { OpenRouterService } from "../services/openRouter.service.js";

export const ask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return next(new AppError("Prompt is required", 400));
    }

    const aiResponse = await OpenRouterService.chat(prompt);
    res.status(200).json({
      con: true,
      message: "AI response fetched successfully",
      data: aiResponse,
    });
  } catch (error) {
    next(error);
  }
};
