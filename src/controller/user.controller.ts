import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service.js";
import { AppError } from "../utils/AppError.js";
import { userRoleEnum } from "../db/schema.js";
import { ApiResponse, SafeUser } from "../types/index.js";
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

//! FOR ADMIN
//* get all users
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

//* update user role by admin
export const updateUserRole = async (
  req: Request,
  res: Response<ApiResponse<SafeUser>>,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!id || !role) {
      return next(new AppError("User ID and role are required", 400));
    }

    if (!userRoleEnum.enumValues.includes(role)) {
      return next(new AppError("Invalid role value", 400));
    }

    const updatedUser = await UserService.updateUserRole(id as string, role);

    return res.status(200).json({
      con: true,
      message: "Update user role successfully",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

//! FOR USER
//* get user by id
export const getUserById = async (
  req: Request,
  res: Response<ApiResponse<SafeUser>>,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!id) {
      return next(new AppError("User ID is required", 400));
    }

    const currentUser = req.user;
    if (currentUser?.role !== "admin" && currentUser?.id !== id) {
      return next(new AppError("Forbidden", 403));
    }

    const user = await UserService.getUserById(id as string);
    return res.status(200).json({
      con: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

//* update user profile
export const updateUserById = async (
  req: Request,
  res: Response<ApiResponse<SafeUser>>,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    if (!id) {
      return next(new AppError("User ID is required", 400));
    }

    const data = updateUserSchema.parse(req.body);
    if (Object.keys(data).length === 0) {
      return next(new AppError("No Data provided to update", 400));
    }

    const updatedUser = await UserService.updateUserById(id as string, data);
    return res.status(200).json({
      con: true,
      message: "User update successfully",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
