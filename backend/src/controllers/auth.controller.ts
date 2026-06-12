import type { Request, Response, CookieOptions } from "express";
import { AuthService } from "../services/auth.service.js";
import { sendResponse } from "../utils/response.js";
import { SubscriptionPlan } from "../models/SubscriptionPlan.js";

const authService = new AuthService();

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  path: "/",
  // Use secure cookies only in production
  secure: process.env.NODE_ENV === "production",
  // In production we allow cross-site (sameSite='none') because frontend and backend
  // may be served from different origins. During development the Vite dev proxy
  // makes requests same-origin, so 'lax' is a safer default to ensure cookies
  // are accepted by browsers.
  sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as CookieOptions["sameSite"],
};

export async function registerUser(req: Request, res: Response): Promise<Response> {
  console.log("REGISTER payload:", req.body);
  const result = await authService.register(req.body);

  res.cookie("accessToken", result.accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 }); // 15 mins
  res.cookie("refreshToken", result.refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days

  return sendResponse(res, 201, "User registered successfully", result.user, {
    accessToken: result.accessToken,
    tokenType: "Bearer",
  });
}

export async function loginUser(req: Request, res: Response): Promise<Response> {
  const result = await authService.login(req.body);

  res.cookie("accessToken", result.accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", result.refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });

  return sendResponse(res, 200, "Login successful", result.user, {
    accessToken: result.accessToken,
    tokenType: "Bearer",
  });
}

export async function logoutUser(req: Request, res: Response): Promise<Response> {
  if (req.user) {
    await authService.logout(req.user.id);
  }

  res.clearCookie("accessToken", COOKIE_OPTIONS);
  res.clearCookie("refreshToken", COOKIE_OPTIONS);

  return sendResponse(res, 200, "Logged out successfully");
}

export async function refreshToken(req: Request, res: Response): Promise<Response> {
  const token = req.cookies?.refreshToken;
  
  if (!token) {
    return sendResponse(res, 401, "Refresh token required");
  }

  const result = await authService.refresh(token);

  res.cookie("accessToken", result.accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", result.refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });

  return sendResponse(res, 200, "Tokens refreshed", null, {
    accessToken: result.accessToken,
    tokenType: "Bearer",
  });
}

export async function forgotPassword(req: Request, res: Response): Promise<Response> {
  const result = await authService.forgotPassword(req.body.email);
  return sendResponse(res, 200, result.message, { resetToken: result.resetToken });
}

export async function resetPassword(req: Request, res: Response): Promise<Response> {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  return sendResponse(res, 200, "Password reset successfully");
}

export async function getCurrentUser(req: Request, res: Response): Promise<Response> {
  if (!req.user) {
    return sendResponse(res, 401, "Authentication required");
  }

  const profile = await authService.getProfile(req.user.id);

  return sendResponse(res, 200, "Authenticated user profile", profile);
}

export async function updateUserProfile(req: Request, res: Response): Promise<Response> {
  if (!req.user) {
    return sendResponse(res, 401, "Authentication required");
  }

  const updatedProfile = await authService.updateProfile(req.user.id, req.body);

  return sendResponse(res, 200, "Profile updated successfully", updatedProfile);
}

export async function getPublicSubscriptionPlans(req: Request, res: Response): Promise<Response> {
  const plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });
  return sendResponse(res, 200, "Public plans fetched successfully", plans);
}
