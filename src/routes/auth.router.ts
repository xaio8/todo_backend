import { Router } from "express";
import * as authController from "../controller/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, signUpSchema } from "../validators/auth.validator.js";

const authRoute = Router();
authRoute.post("/login", validate(loginSchema), authController.loginUser);
authRoute.post("/signup", validate(signUpSchema), authController.signUpUser);
authRoute.post("/logout", authController.logout);
authRoute.post("/refresh_access_token", authController.refreshAccessToken);
// authRoute.post("/verify-email",authController.verifyEmail);

export default authRoute;
