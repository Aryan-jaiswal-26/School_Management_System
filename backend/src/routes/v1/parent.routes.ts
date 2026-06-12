import { Router } from 'express';
import { ParentController } from '../../controllers/parent.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';

export const parentRouter = Router();

// All parent routes require authentication and PARENT or SUPER_ADMIN role
parentRouter.use(authenticateToken);
parentRouter.use(requireRoles('PARENT', 'SUPER_ADMIN'));

// ── Dashboard & Profile ──────────────────────────────────────────────────────
parentRouter.get('/dashboard', ParentController.getDashboard);
parentRouter.get('/profile', ParentController.getProfile);
parentRouter.get('/children/:studentId/contacts', ParentController.getChildContacts);
parentRouter.get('/children/:studentId/leaves', ParentController.listChildLeaves);
parentRouter.post('/children/:studentId/leaves', ParentController.submitChildLeave);
parentRouter.get('/children/:studentId/canteen', ParentController.getChildCanteen);

// ── Fee & Payment (parent-scoped, filtered by their children) ───────────────
// These mirror the same /fees & /fees/payments paths the frontend calls
// GET /parents/fees?studentId=<id>
parentRouter.get('/fees', ParentController.getFees);
// GET /parents/payments?studentId=<id>
parentRouter.get('/payments', ParentController.getPayments);

// ── Per-Child Data Endpoints ─────────────────────────────────────────────────
// All secured: the service verifies the studentId belongs to this parent

// Academic overview (CGPA, rank, results)
parentRouter.get('/children/:studentId/academics', ParentController.getChildAcademics);

// Homework diary
parentRouter.get('/children/:studentId/homework', ParentController.getChildHomework);

// Report cards / term results
parentRouter.get('/children/:studentId/report-cards', ParentController.getChildReportCards);

// Daily attendance records
parentRouter.get('/children/:studentId/attendance', ParentController.getChildAttendance);

// Bus / transport info
parentRouter.get('/children/:studentId/transport', ParentController.getChildTransport);

// Parent-Teacher Meetings
parentRouter.get('/children/:studentId/ptm', ParentController.getPtmMeetings);
parentRouter.post('/children/:studentId/ptm', ParentController.createPtmMeeting);
parentRouter.get('/preferences', ParentController.getNotificationPreferences);
parentRouter.put('/preferences', ParentController.updateNotificationPreferences);
parentRouter.get('/community/posts', ParentController.listCommunityPosts);
parentRouter.post('/community/posts', ParentController.createCommunityPost);
parentRouter.get('/feedback', ParentController.listFeedback);
parentRouter.post('/feedback', ParentController.submitFeedback);
