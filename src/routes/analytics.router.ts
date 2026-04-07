import { Router } from "express";
import * as analysisController from "../controller/analytics.controller.js";
import {
  protectedRoute,
  roleBasedAccess,
} from "../middleware/protectedRoute.js";

const analysisRouter = Router();

analysisRouter.use(protectedRoute);
analysisRouter.use(roleBasedAccess("admin"));

analysisRouter.get("/",analysisController.getFullTodoReport)
analysisRouter.get("/global", analysisController.getAdminDashboard);

export default analysisRouter;
