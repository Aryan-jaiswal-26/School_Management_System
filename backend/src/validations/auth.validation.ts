import { z } from "zod";
import { roles } from "../types/auth.js";

const roleEnum = z.enum(roles);

export const registerSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  role: z.preprocess((val) => typeof val === "string" ? val.toUpperCase() : val, roleEnum).optional(),
  schoolId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid schoolId ObjectId").optional(),
  schoolName: z.string().trim().min(1).optional(),
  schoolCode: z.string().trim().min(1).optional(),
  childrenCodes: z.array(z.string().trim()).optional(),
})
  .refine((data) => {
    return !!(data.fullName || data.name || (data.firstName && data.lastName) || data.firstName);
  }, {
    message: "Name is required (either provide name, fullName, firstName, or both firstName and lastName fields)",
    path: ["fullName"],
  })
  .refine((data) => {
    // SCHOOL_ADMIN must provide a school name, code, or existing ID
    const role = typeof data.role === "string" ? data.role.toUpperCase() : data.role;
    if (role === "SCHOOL_ADMIN") {
      return !!(data.schoolName || data.schoolCode || data.schoolId);
    }
    return true;
  }, {
    message: "School Admin registration requires a schoolName, schoolCode, or schoolId",
    path: ["schoolName"],
  })
  .transform((data) => ({
    ...data,
    fullName: data.fullName || data.name || `${data.firstName || ""} ${data.lastName || ""}`.trim(),
  }));

export const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});