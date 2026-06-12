export const roles = [
  "SUPER_ADMIN",
  "SCHOOL_ADMIN",
  "TEACHER",
  "PARENT",
  "STUDENT",
  "DRIVER",
  "ACCOUNTANT",
] as const;

export type Role = (typeof roles)[number];

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  schoolId?: string;
}