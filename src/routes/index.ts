import { Router, Request, Response } from "express";
import todoRoute from "./todo.router.js";
import authRoute from "./auth.router.js";

const router = Router();

//health check
router.get("/health", (req: Request, res: Response) => {
  res.json({ con: true, message: "Server running....." });
});

router.use("/auth", authRoute);
router.use("/todos", todoRoute);

export default router;
