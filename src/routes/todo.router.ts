import { Router } from "express";
import * as todoController from "../controller/todo.controller.js";
import { protectedRoute } from "../middleware/protectedRoute.js";
import { validate } from "../middleware/validate.js";
import {
  createTodoSchema,
  updateTodoSchema,
} from "../validators/todo.validator.js";

const todoRoute = Router();

todoRoute.use(protectedRoute);
todoRoute.get("/all", todoController.getAllTodos);
todoRoute.get("/by-date", todoController.getTodayTodos);
todoRoute.post("/", validate(createTodoSchema), todoController.createTodo);
todoRoute.patch("/:id", validate(updateTodoSchema), todoController.updateTodo);
todoRoute.delete("/:id", todoController.deleteTodo);

export default todoRoute;
