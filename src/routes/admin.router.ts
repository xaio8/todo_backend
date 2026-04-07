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

// todos management
adminRoute.get("/todos", todoController.getAllTodosByAdmin);

// user management
adminRoute.get("/users", userController.getAllUser);
adminRoute.patch("/users/:id",userController.updateUserRole)

export default adminRoute;
