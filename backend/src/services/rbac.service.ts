import { ApiError } from "../utils/api-error.js";
import { Permission } from "../models/Permission.js";
import { Role } from "../models/Role.js";
import { resolveSchoolId } from "../utils/school.js";

type PermissionSeed = {
  name: string;
  module: string;
  description: string;
};

const DEFAULT_PERMISSIONS: PermissionSeed[] = [
  {
    name: "MANAGE_SCHOOL",
    module: "ADMINISTRATION",
    description: "Manage school profile and settings",
  },
  { name: "MANAGE_USERS", module: "ADMINISTRATION", description: "Manage system users" },
  { name: "MANAGE_ACADEMICS", module: "ACADEMICS", description: "Manage academic configuration" },
  { name: "MANAGE_EXAMS", module: "ACADEMICS", description: "Manage exams and results" },
  {
    name: "MANAGE_COMMUNICATIONS",
    module: "COMMUNICATIONS",
    description: "Manage announcements and notices",
  },
  {
    name: "MANAGE_TRANSPORT",
    module: "TRANSPORT",
    description: "Manage transport routes and tracking",
  },
  {
    name: "MANAGE_LIBRARY",
    module: "LIBRARY",
    description: "Manage library inventory and circulation",
  },
  { name: "MANAGE_FEES", module: "FINANCE", description: "Manage fee structures and payments" },
  { name: "MANAGE_HR", module: "HR", description: "Manage staff leave, payroll, and documents" },
  { name: "MANAGE_STUDENTS", module: "STUDENT", description: "Manage student records" },
  { name: "VIEW_STUDENT", module: "STUDENT", description: "View student details" },
  { name: "CREATE_STUDENT", module: "STUDENT", description: "Create new student" },
  { name: "EDIT_STUDENT", module: "STUDENT", description: "Edit student details" },
  { name: "DELETE_STUDENT", module: "STUDENT", description: "Delete student" },
  { name: "VIEW_ATTENDANCE", module: "ATTENDANCE", description: "View attendance records" },
  { name: "MARK_ATTENDANCE", module: "ATTENDANCE", description: "Mark student attendance" },
  { name: "VIEW_FEES", module: "FINANCE", description: "View fee details" },
  { name: "VIEW_REPORTS", module: "REPORTING", description: "View academic and financial reports" },
  { name: "VIEW_ANALYTICS", module: "REPORTING", description: "View operational analytics" },
  { name: "MANAGE_EVENTS", module: "EVENTS", description: "Manage events and culture content" },
  { name: "MANAGE_HOSTEL", module: "HOSTEL", description: "Manage hostel rooms and operations" },
];

const DEFAULT_ROLE_PERMISSION_NAMES: Record<string, string[]> = {
  ADMIN: DEFAULT_PERMISSIONS.map((permission) => permission.name),
  SCHOOL_ADMIN: DEFAULT_PERMISSIONS.map((permission) => permission.name),
  TEACHER: [
    "VIEW_STUDENT",
    "VIEW_ATTENDANCE",
    "MARK_ATTENDANCE",
    "VIEW_FEES",
    "VIEW_REPORTS",
    "VIEW_ANALYTICS",
    "MANAGE_ACADEMICS",
    "MANAGE_EXAMS",
    "MANAGE_COMMUNICATIONS",
  ],
  DRIVER: ["VIEW_STUDENT", "VIEW_ATTENDANCE", "VIEW_REPORTS", "MANAGE_TRANSPORT"],
  PARENT: ["VIEW_STUDENT", "VIEW_ATTENDANCE", "VIEW_FEES", "VIEW_REPORTS"],
  STUDENT: ["VIEW_STUDENT", "VIEW_ATTENDANCE", "VIEW_FEES", "VIEW_REPORTS"],
  ACCOUNTANT: ["VIEW_FEES", "VIEW_REPORTS", "MANAGE_FEES"],
};

export class RBACService {
  private static async ensureDefaultPermissions() {
    const existingPermissions = await Permission.countDocuments();
    if (existingPermissions > 0) {
      return;
    }

    await Permission.insertMany(DEFAULT_PERMISSIONS);
  }

  private static async ensureDefaultRoles(schoolIdInput: string) {
    const schoolId = await resolveSchoolId(schoolIdInput);
    const existingRoles = await Role.countDocuments({ schoolId });
    if (existingRoles > 0) {
      return;
    }

    const permissions = await Permission.find();
    const permissionLookup = new Map(
      permissions.map((permission) => [permission.name, permission]),
    );

    const rolesToSeed = Object.entries(DEFAULT_ROLE_PERMISSION_NAMES).map(
      ([name, permissionNames]) => ({
        name,
        schoolId,
        permissions: permissionNames
          .map((permissionName) => permissionLookup.get(permissionName))
          .filter((permission): permission is (typeof permissions)[number] => Boolean(permission))
          .map((permission) => permission._id),
      }),
    );

    if (rolesToSeed.length > 0) {
      await Role.insertMany(rolesToSeed);
    }
  }

  static async listPermissions() {
    await RBACService.ensureDefaultPermissions();
    return Permission.find().sort({ module: 1, name: 1 });
  }

  static async listRoles(schoolIdInput: string) {
    await RBACService.ensureDefaultPermissions();
    await RBACService.ensureDefaultRoles(schoolIdInput);
    const schoolId = await resolveSchoolId(schoolIdInput);
    return Role.find({ schoolId }).populate("permissions").sort({ name: 1 });
  }

  static async updateRolePermissions(
    schoolIdInput: string,
    roleName: string,
    permissionIds: string[],
    updatedBy?: string,
  ) {
    await RBACService.ensureDefaultPermissions();
    const schoolId = await resolveSchoolId(schoolIdInput);
    const normalizedRole = roleName.trim().toUpperCase();

    if (!normalizedRole) {
      throw new ApiError(400, "Role name is required");
    }

    const uniquePermissionIds = [...new Set(permissionIds.filter(Boolean))];
    const permissions = await Permission.find({ _id: { $in: uniquePermissionIds } });

    if (permissions.length !== uniquePermissionIds.length) {
      throw new ApiError(400, "One or more permission IDs are invalid");
    }

    const role = await Role.findOneAndUpdate(
      { schoolId, name: normalizedRole },
      {
        $set: {
          name: normalizedRole,
          schoolId,
          permissions: permissions.map((permission) => permission._id),
          updatedBy,
        },
      },
      { new: true, upsert: true, runValidators: true },
    ).populate("permissions");

    return role;
  }
}
