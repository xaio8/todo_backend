import { Router } from "express";
import * as todoController from "../controller/todo_controller.js";

const todoRoute = Router();

todoRoute.get("/", todoController.getAllTodos);
todoRoute.post("/", todoController.createTodo);
// todoRoute.patch("/:id/status", todoController.updateTodoStatus);
todoRoute.delete("/:id", todoController.deleteTodo);

export default todoRoute;
