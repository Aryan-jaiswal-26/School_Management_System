import { Router } from "express";
import { authenticateToken } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { 
  getCurrentUser, 
  loginUser, 
  logoutUser,
  registerUser, 
  refreshToken, 
  forgotPassword, 
  resetPassword,
  updateUserProfile,
  getPublicSubscriptionPlans,
  sendOTP,
  verifyOTP
} from "../../controllers/auth.controller.js";
import { validateBody } from "../../middleware/validate.js";
import { 
  loginSchema, 
  registerSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema 
} from "../../validations/auth.validation.js";

export const authRoutes = Router();

authRoutes.post("/register", validateBody(registerSchema), asyncHandler(registerUser));
authRoutes.post("/login", validateBody(loginSchema), asyncHandler(loginUser));
authRoutes.post("/logout", asyncHandler(logoutUser));
authRoutes.post("/refresh", asyncHandler(refreshToken));
authRoutes.post("/forgot-password", validateBody(forgotPasswordSchema), asyncHandler(forgotPassword));
authRoutes.post("/reset-password", validateBody(resetPasswordSchema), asyncHandler(resetPassword));
authRoutes.get("/plans", asyncHandler(getPublicSubscriptionPlans));
authRoutes.get("/me", authenticateToken, asyncHandler(getCurrentUser));
authRoutes.put("/profile", authenticateToken, asyncHandler(updateUserProfile));

// OTP Login endpoints
authRoutes.post("/send-otp", asyncHandler(sendOTP));
authRoutes.post("/verify-otp", asyncHandler(verifyOTP));

