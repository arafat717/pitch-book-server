import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AuthController } from "./auth.controller";
import { UserValidation } from "./auth.validation";

const router = Router();

router.post(
  "/register",
  validateRequest(UserValidation.RegistrationZodSchema),
  AuthController.registerPlayer,
);

router.post(
  "/verify-mail",
  validateRequest(UserValidation.verifyMailOtpZodSchema),
  AuthController.verifyMail,
);

router.post(
  "/login",
  validateRequest(UserValidation.LoginZodSchema),
  AuthController.loginUser,
);
router.get(
  "/me",
  auth(Role.ADMIN, Role.OWNER, Role.PLAYER),
  // validateRequest
  AuthController.getMe,
);
router.post("/refresh-token", AuthController.refreshToken);
router.post("/google", AuthController.googleLogin);
router.post(
  "/forgot-password",
  validateRequest(UserValidation.ForgotPasswordZodSchema),
  AuthController.forgotPassword,
);
router.post(
  "/reset-password",
  validateRequest(UserValidation.ResetPasswordZodSchema),
  AuthController.resetPassword,
);
export const AuthRoutes = router;
