import { Router } from "express";
import * as todoController from "../controller/todo.controller.js";
import { protectedRoute } from "../middleware/protectedRoute.js";

const todoRoute = Router();

todoRoute.use(protectedRoute);
todoRoute.get("/all", todoController.getAllTodos);
todoRoute.get("/by-date", todoController.getTodayTodos);
todoRoute.post("/", todoController.createTodo);
todoRoute.patch("/:id", todoController.updateTodo);
todoRoute.delete("/:id", todoController.deleteTodo);

export default todoRoute;
