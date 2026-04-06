import { Router } from "express";
import {
  protectedRoute,
  roleBasedAccess,
} from "../middleware/protectedRoute.js";
import * as todoController from "../controller/todo.controller.js";

const adminRoute = Router();

adminRoute.use(protectedRoute);
adminRoute.use(roleBasedAccess("admin"));

adminRoute.use("/todos", todoController.getAllTodosByAdmin);

export default adminRoute;
