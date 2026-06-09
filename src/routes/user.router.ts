import { Router } from "express";
import {
  protectedRoute,
  roleBasedAccess,
} from "../middleware/protectedRoute.js";
import * as userController from "../controller/user.controller.js";
import { validate } from "../middleware/validate.js";
import { updateUserSchema } from "../validators/user.validator.js";

const userRouter = Router();

userRouter.use(protectedRoute);
userRouter.get(
  "/:id",
  roleBasedAccess("admin", "user"),
  userController.getUserById,
);
userRouter.patch(
  "/:id",
  validate(updateUserSchema),
  roleBasedAccess("admin", "user"),
  userController.updateUserById,
);

export default userRouter;
