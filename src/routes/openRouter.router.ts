import { Router } from "express";
import {
  ask,
  yearlyAnalysisWithAI,
} from "../controller/openRouter.controller.js";
import {
  protectedRoute,
  roleBasedAccess,
} from "../middleware/protectedRoute.js";

const aiRouter = Router();

aiRouter.use(protectedRoute);
aiRouter.use(roleBasedAccess("admin"));

aiRouter.post("/ask", ask);
aiRouter.post("/yearly-analysis", yearlyAnalysisWithAI);

export default aiRouter;
