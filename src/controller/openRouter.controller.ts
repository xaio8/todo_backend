import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.js";
import { OpenRouterService } from "../services/openRouter.service.js";
import { buildAnalyticsPrompt } from "../utils/promtBuilder.js";
import { AdminAnalyticsService } from "../services/admin.analytics.service.js";

export const ask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return next(new AppError("Prompt is required", 400));
    }

    const aiResponse = await OpenRouterService.chat({ prompt });
    res.status(200).json({
      con: true,
      message: "AI response fetched successfully",
      data: aiResponse,
    });
  } catch (error) {
    next(error);
  }
};

export const yearlyAnalysisWithAI = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const analytics = await AdminAnalyticsService.getAdminAnalytics(year);
    const prompt = buildAnalyticsPrompt(year, analytics);

    const aiResponse = await OpenRouterService.chat({ prompt });
    res.status(200).json({
      con: true,
      message: "AI response fetched successfully",
      data: aiResponse,
    });
  } catch (error) {
    next(error);
  }
};
