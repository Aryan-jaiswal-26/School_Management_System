import { Router } from 'express';
import { AttendanceController } from '../../controllers/attendance.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { requireParentChildAccess, requireTeacherStudentAccess } from '../../middleware/resource-isolation.js';
import { requirePermissions } from '../../middleware/rbac.js';
import {
  dailyStatsQuerySchema,
  monthlyStatsQuerySchema
} from '../../validations/attendance.validation.js';

export const attendanceRouter = Router();

// Ensure all routes require authentication
attendanceRouter.use(authenticateToken);

// --- Frontend Compatible CRUD ---
attendanceRouter.post('/', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), requirePermissions('MARK_ATTENDANCE'), AttendanceController.recordAttendance);
attendanceRouter.post('/bulk', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), requirePermissions('MARK_ATTENDANCE'), AttendanceController.recordAttendanceBulk);
attendanceRouter.get('/', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'), AttendanceController.getAttendanceRecords);
attendanceRouter.get(
  '/student/:studentId',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'),
  AttendanceController.getStudentAttendanceHistory,
);

// --- Student Reports ---
attendanceRouter.get(
  '/students/daily',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'),
  validateRequest(dailyStatsQuerySchema),
  AttendanceController.getDailyStudentStats
);

attendanceRouter.get(
  '/students/monthly/:studentId',
  validateRequest(monthlyStatsQuerySchema),
  requireParentChildAccess,
  requireTeacherStudentAccess,
  AttendanceController.getMonthlyStudentStats
);

// --- Employee Reports ---
attendanceRouter.get(
  '/employees/daily',
  requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'),
  validateRequest(dailyStatsQuerySchema),
  AttendanceController.getDailyEmployeeStats
);

attendanceRouter.get(
  '/employees/monthly/:employeeId',
  (req, res, next) => {
    const role = req.user?.role;
    if (role && ['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(role)) {
       return next();
    }
    next();
  },
  validateRequest(monthlyStatsQuerySchema),
  AttendanceController.getMonthlyEmployeeStats
);
// Duplicate student attendance route removed to avoid middleware conflict
