import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { AnalyticsService } from "../services/analytics.service.js";
import { AdminAnalyticsService } from "../services/admin.analytics.service.js";

export const getFullTodoReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    const isAdmin = req.user?.role === "admin";
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    if (!userId) throw new AppError("Unauthorized", 401);

    const [userAnalysis, monthlyStats, globalStats] = await Promise.all([
      AnalyticsService.getUserAnalysis(userId),
      AnalyticsService.getMonthlyStats(userId, year),
      isAdmin ? AnalyticsService.getGlobalAnalysis() : Promise.resolve(null),
    ]);

    return res.status(200).json({
      con: true,
      message: "Full analysis generated",
      data: {
        personal: {
          ...userAnalysis,
          monthlyChart: monthlyStats,
        },
        systemWide: globalStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const [monthlyStats, kpis] = await Promise.all([
      AdminAnalyticsService.getGlobalMonthlyStats(year),
      AdminAnalyticsService.getSystemKPIs(),
    ]);

    return res.status(200).json({
      con: true,
      message: "Global system analysis retrieved",
      data: {
        kpis,
        yearlyChart: monthlyStats,
      },
    });
  } catch (error) {
    next(error);
  }
};
