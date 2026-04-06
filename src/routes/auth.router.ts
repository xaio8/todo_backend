import { Router } from "express";
import * as authController from "../controller/auth.controller.js";

const authRoute = Router();
authRoute.post("/login", authController.loginUser);
authRoute.post("/signup", authController.signUpUser);
authRoute.post("/logout", authController.logout);
authRoute.post("/refresh_access_token", authController.refreshAccessToken);

export default authRoute;
