import { Router } from "express";
import { ask } from "../controller/openRouter.controller.js";

const aiRouter = Router();

aiRouter.post("/ask", ask);

export default aiRouter;
