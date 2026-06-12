import { Router } from "express";
import { teacherRouter } from "./teacher.routes.js";
import { authRoutes as authRouter } from "./auth.routes.js";
import { healthRoutes as healthRouter } from "./health.routes.js";
import { schoolRouter } from "./school.routes.js";
import { studentRouter } from "./student.routes.js";
import { employeeRouter } from "./employee.routes.js";
import { badgeRouter } from "./badge.routes.js";
import { candidateRouter } from "./candidate.routes.js";
import { feeRouter } from "./fee.routes.js";
import { examRouter } from "./exam.routes.js";
import { homeworkRouter } from "./homework.routes.js";
import { notificationRouter } from "./notification.routes.js";
import { chatRouter } from "./chat.routes.js";
import { academicsRouter } from "./academics.routes.js";
import { hostelRouter } from "./hostel.routes.js";
import { transportRouter } from "./transport.routes.js";
import { libraryRouter } from './library.routes.js';
import { canteenRouter } from "./canteen.routes.js";
import { superAdminRouter } from './super-admin.routes.js';
import { hrRouter } from "./hr.routes.js";
import { userRouter } from "./user.routes.js";
import { inventoryRoutes as inventoryRouter } from "./inventory.routes.js";
import { eventsRoutes as eventsRouter } from "./events.routes.js";
import { admissionsRoutes as admissionsRouter } from "./admissions.routes.js";
import { visitorsRoutes as visitorsRouter } from "./visitors.routes.js";
import { analyticsRouter } from "./analytics.routes.js";
import { syllabusRouter } from "./syllabus.routes.js";
import { sportsRouter } from "./sports.routes.js";
import { parentRouter } from "./parent.routes.js";
import { brandingRouter } from "./branding.routes.js";
import { rbacRouter } from "./rbac.routes.js";
import { HRController } from "../../controllers/hr.controller.js";
import { authenticateToken } from "../../middleware/auth.js";
// New imports

import { attendanceRouter } from "./attendance.routes.js";
import { quizRouter } from "./quiz.routes.js";
import branchRouter from "./branch.routes.js";
import apiKeyRouter from "./api-key.routes.js";
import onboardingRouter from "./onboarding.routes.js";
import disciplineRouter from './discipline.routes.js';
import backupRouter from "./backup.routes.js";
import importRouter from "./import.routes.js";
import auditRouter from "./audit.routes.js";
import duplicateRouter from "./duplicate.routes.js";
import exportRouter from "./export.routes.js";
import documentRouter from "./document.routes.js";
import alumniRouter from './alumni.routes.js';
import invoiceRouter from "./invoice.routes.js";
import paymentGatewayRouter from "./payment-gateway.routes.js";
import performanceRouter from "./performance.routes.js";
import substituteRouter from "./substitute.routes.js";
import newsletterRouter from "./newsletter.routes.js";
import timetableRouter from './timetable.routes.js';
import { ptmRouter } from './ptm.routes.js';
import { liveClassRouter } from './live-class.routes.js';
import { emergencyRouter } from './emergency.routes.js';
import { electionRoutes as electionRouter } from './election.routes.js';
import { lessonPlanRouter } from './lesson-plan.routes.js';
import { feedRouter } from './feed.routes.js';
import { portfolioRouter } from './portfolio.routes.js';
import { suggestionRouter } from './suggestion.routes.js';
import { communityRouter } from './community.routes.js';
import { feedbackRouter } from './feedback.routes.js';
import { auditRouter } from './audit.routes.js';
import { supportRouter } from './support.routes.js';
import { safetyRouter } from './safety.routes.js';
import { certificateRouter } from './certificate.routes.js';
import { calendarRouter } from './calendar.routes.js';
import { studentOfMonthRouter } from './student-of-month.routes.js';
import { gstInvoiceRouter } from './gst-invoice.routes.js';

export const v1Router = Router();

const leaveRouter = Router();
leaveRouter.use(authenticateToken);
leaveRouter.get("/my", (req, res, next) => {
  req.query.staffId = req.user?.id;
  return HRController.getLeaveRequests(req, res, next);
});
leaveRouter.post("/", HRController.createLeaveRequest);
leaveRouter.get("/", HRController.getLeaveRequests);
leaveRouter.patch("/:id", HRController.updateLeaveStatus);

v1Router.use("/health", healthRouter);
v1Router.use("/auth", authRouter);
v1Router.use("/schools", schoolRouter);
v1Router.use("/students", studentRouter);
v1Router.use("/employees", employeeRouter);

v1Router.use("/teachers", teacherRouter);
v1Router.use("/teacher", teacherRouter);

// Attendance routes are registered on both /attendance-reports (original) and /attendance (new compatible)
v1Router.use("/attendance-reports", attendanceRouter);
v1Router.use("/attendance", attendanceRouter);

v1Router.use("/fees", feeRouter);
v1Router.use("/exams", examRouter);
v1Router.use("/homework", homeworkRouter);
v1Router.use("/notifications", notificationRouter);
v1Router.use("/chat", chatRouter);
v1Router.use("/quizzes", quizRouter);

// New frontend-compatible routes
v1Router.use("/academics", academicsRouter);
v1Router.use("/hostel", hostelRouter);
v1Router.use("/transport", transportRouter);
v1Router.use('/library', libraryRouter);
v1Router.use("/canteen", canteenRouter);
v1Router.use('/super-admin', superAdminRouter);
v1Router.use("/users", userRouter);
v1Router.use("/inventory", inventoryRouter);
v1Router.use("/events", eventsRouter);
v1Router.use("/admissions", admissionsRouter);
v1Router.use("/visitors", visitorsRouter);
v1Router.use("/badges", badgeRouter);
  v1Router.use("/election-candidates", candidateRouter);

v1Router.use("/leaves", leaveRouter);
v1Router.use("/syllabus", syllabusRouter);
v1Router.use("/sports", sportsRouter);
v1Router.use("/parents", parentRouter);
v1Router.use("/analytics", analyticsRouter);
v1Router.use("/rbac", rbacRouter);
v1Router.use("/api-keys", apiKeyRouter);
v1Router.use("/onboarding", onboardingRouter);
v1Router.use('/discipline', disciplineRouter);
v1Router.use('/alumni', alumniRouter);
v1Router.use('/timetable', timetableRouter);
v1Router.use('/ptm', ptmRouter);
v1Router.use('/live-classes', liveClassRouter);
v1Router.use('/emergencies', emergencyRouter);
v1Router.use("/backup", backupRouter);
v1Router.use("/import", importRouter);
v1Router.use("/audit-logs", auditRouter);
v1Router.use("/duplicate", duplicateRouter);
v1Router.use("/export", exportRouter);
v1Router.use("/documents", documentRouter);
v1Router.use("/alumni", alumniRouter);
v1Router.use("/import", importRouter);
v1Router.use("/duplicate", duplicateRouter);
v1Router.use("/export", exportRouter);
v1Router.use("/documents", documentRouter);
v1Router.use("/alumni", alumniRouter);
v1Router.use("/invoices", invoiceRouter);
v1Router.use("/payments", paymentGatewayRouter);
v1Router.use("/performance", performanceRouter);
v1Router.use("/substitutes", substituteRouter);
v1Router.use("/newsletters", newsletterRouter);
v1Router.use("/timetable", timetableRouter);
v1Router.use("/branding", brandingRouter);
v1Router.use("/branches", branchRouter);
v1Router.use("/elections", electionRouter);
v1Router.use('/lesson-plans', lessonPlanRouter);
v1Router.use('/feed', feedRouter);
v1Router.use('/portfolio', portfolioRouter);
v1Router.use('/suggestions', suggestionRouter);
v1Router.use('/community', communityRouter);
v1Router.use('/feedback', feedbackRouter);
v1Router.use('/audit', auditRouter);
v1Router.use('/support', supportRouter);
v1Router.use('/safety', safetyRouter);
v1Router.use('/certificates', certificateRouter);
v1Router.use('/calendar', calendarRouter);
v1Router.use('/student-of-month', studentOfMonthRouter);
v1Router.use('/gst-invoices', gstInvoiceRouter);

// Birthdays endpoint
import { Student } from '../../models/Student.js';
import { Employee } from '../../models/Employee.js';
import { authenticateToken as auth } from '../../middleware/auth.js';
const birthdayRouter = Router();
birthdayRouter.get('/today', auth, async (req: any, res: any) => {
  const schoolId = req.user?.schoolId;
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const [students, staff] = await Promise.all([
    Student.find({ schoolId, $expr: { $and: [{ $eq: [{ $month: '$dateOfBirth' }, month] }, { $eq: [{ $dayOfMonth: '$dateOfBirth' }, day] }] } }).select('firstName lastName grade dateOfBirth'),
    Employee.find({ schoolId, $expr: { $and: [{ $eq: [{ $month: '$dateOfBirth' }, month] }, { $eq: [{ $dayOfMonth: '$dateOfBirth' }, day] }] } }).select('firstName lastName designation dateOfBirth'),
  ]);
  return res.json({ success: true, data: { students, staff } });
});
v1Router.use('/birthdays', birthdayRouter);

