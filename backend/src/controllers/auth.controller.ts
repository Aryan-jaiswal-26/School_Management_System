import type { Request, Response, CookieOptions } from "express";
import { AuthService } from "../services/auth.service.js";
import { sendResponse } from "../utils/response.js";
import { SubscriptionPlan } from "../models/SubscriptionPlan.js";
import { OTPService } from "../services/otp.service.js";
import { User } from "../models/User.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { signAccessToken, signRefreshToken } from "../config/jwt.js";

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

export async function sendOTP(req: Request, res: Response): Promise<Response> {
  const { phone, email } = req.body;
  if (!phone && !email) {
    return sendResponse(res, 400, "phone or email is required");
  }

  const identifier = phone ? { phone } : { email };
  const otp = await OTPService.generateOTP(identifier);

  if (phone) {
    await OTPService.sendSMSOTP(phone, otp);
  } else if (email) {
    await OTPService.sendEmailOTP(email, otp);
  }

  return sendResponse(res, 200, "OTP sent successfully");
}

export async function verifyOTP(req: Request, res: Response): Promise<Response> {
  const { phone, email, otp } = req.body;
  if ((!phone && !email) || !otp) {
    return sendResponse(res, 400, "phone or email and otp are required");
  }

  const identifier = phone ? { phone } : { email };
  const isValid = await OTPService.verifyOTP(identifier, otp);
  if (!isValid) {
    return sendResponse(res, 400, "Invalid or expired OTP");
  }

  // Find user by email or phone
  let user;
  if (phone) {
    user = await User.findOne({ phoneNumber: phone });
  } else {
    user = await User.findOne({ email: email.toLowerCase() });
  }

  if (!user) {
    return sendResponse(res, 404, "Account not found with this identifier");
  }

  if (!user.isActive) {
    return sendResponse(res, 403, "This account is currently inactive");
  }

  // Authenticate user
  user.lastLogin = new Date();
  const accessToken = signAccessToken({
    sub: user._id.toString(),
    email: user.email,
    fullName: `${user.firstName} ${user.lastName}`,
    role: user.role,
  });

  const refreshToken = signRefreshToken({ sub: user._id.toString() });
  user.refreshToken = refreshToken;
  await user.save();

  // Log activity
  try {
    await ActivityLog.create({
      schoolId: user.schoolId ? (user.schoolId._id || user.schoolId) : undefined,
      userId: user._id,
      activityType: 'LOGIN',
      ipAddress: 'System-OTP',
      userAgent: 'Browser/Client',
    });
  } catch (e) {
    console.error("Failed to write login activity log", e);
  }

  const profile = await authService.getProfile(user._id.toString());

  res.cookie("accessToken", accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 });

  return sendResponse(res, 200, "Login successful", profile, {
    accessToken,
    tokenType: "Bearer",
  });
}
