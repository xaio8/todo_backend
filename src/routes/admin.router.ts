import { Router } from "express";
import {
  protectedRoute,
  roleBasedAccess,
} from "../middleware/protectedRoute.js";
import * as todoController from "../controller/todo.controller.js";
import * as userController from "../controller/user.controller.js";

const adminRoute = Router();

adminRoute.use(protectedRoute);
adminRoute.use(roleBasedAccess("admin"));

adminRoute.get("/todos", todoController.getAllTodosByAdmin);
adminRoute.get("/users", userController.getAllUser);

export default adminRoute;
