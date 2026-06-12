const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');

// Mock authorize middleware if not globally provided
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User not found in request' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

// Super Admin Routes
router.get('/super-admin/dashboard', authorize(['super-admin']), academicController.getDashboardMetrics);
router.post('/super-admin/schools', authorize(['super-admin']), academicController.onboardSchool);
router.put('/super-admin/schools/:id/subscription', authorize(['super-admin']), academicController.updateSchoolSubscription);

// Admin School Setup Routes
router.put('/admin/white-label', authorize(['admin']), academicController.setupWhiteLabel);
router.post('/admin/academic-years', authorize(['admin']), academicController.createAcademicYear);
router.post('/admin/class-sections', authorize(['admin']), academicController.createClassSection);
router.post('/admin/subjects', authorize(['admin']), academicController.createSubject);
router.post('/admin/timetable', authorize(['admin']), academicController.buildTimetable);

// Teacher/Staff Routes
router.post('/teacher/leaves', authorize(['teacher']), academicController.submitLeaveApplication);
router.get('/teacher/schedule', authorize(['teacher']), academicController.getAssignedSchedule);
router.get('/teacher/communications', authorize(['teacher']), academicController.getDashboardCommunications);

module.exports = router;
