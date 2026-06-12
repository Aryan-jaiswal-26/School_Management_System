import { Router } from 'express';
import { CalendarController } from '../../controllers/calendar.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const calendarRouter = Router();
calendarRouter.use(authenticateToken);

calendarRouter.get('/', asyncHandler(CalendarController.getCalendar));
