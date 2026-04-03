import { Router, Request, Response } from "express";
import todoRoute from "./todo.js";
import authRoute from "./auth.js";
import userRoute from "./user.js";

const router = Router();

//health check
router.get("/health", (req: Request, res: Response) => {
  res.json({ con: true, message: "Server running....." });
});

router.use("/auth", authRoute);
router.use("/todos", todoRoute);
router.use("/users", userRoute);

export default router;
