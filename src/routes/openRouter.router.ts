import { Router } from "express";
import { ask } from "../controller/openRouter.controller.js";
import {
  protectedRoute,
  roleBasedAccess,
} from "../middleware/protectedRoute.js";

const aiRouter = Router();

aiRouter.use(protectedRoute);
aiRouter.post("/ask", roleBasedAccess("admin"), ask);

export default aiRouter;
