import { Router } from 'express';
import {
  createTimetableEntry,
  getTimetable,
  getTimetableByClassId,
  updateTimetableEntry,
  deleteTimetableEntry,
  generateTimetable,
  saveGeneratedTimetable,
  createTimetableTemplate,
  listTimetableTemplates,
} from '../../controllers/timetable.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

const router = Router();

router.use(authenticateToken);

// Anyone logged in (teacher, student, parent) can view
router.get('/', asyncHandler(getTimetable));
router.get('/templates', asyncHandler(listTimetableTemplates));
router.get('/:classId', asyncHandler(getTimetableByClassId));

// Only admins can modify
router.use(requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'));
router.post('/generate', asyncHandler(generateTimetable));
router.post('/save', asyncHandler(saveGeneratedTimetable));
router.post('/templates', asyncHandler(createTimetableTemplate));
router.post('/', asyncHandler(createTimetableEntry));
router.put('/:id', asyncHandler(updateTimetableEntry));
router.delete('/:id', asyncHandler(deleteTimetableEntry));

export default router;
