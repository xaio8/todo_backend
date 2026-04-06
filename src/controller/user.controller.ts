import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service.js";

export const getAllUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await UserService.getAllUsers(page, limit);

    res.status(200).json({
      con: true,
      message: "Fetch all users successfully.",
      data: {
        user: result.users,
        pagination: result.meta,
      },
    });
  } catch (error) {
    next(error);
  }
};
