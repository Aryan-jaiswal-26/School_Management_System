import { Router } from 'express';
import { SportsController } from '../../controllers/sports.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';

export const sportsRouter = Router();

sportsRouter.use(authenticateToken);

sportsRouter.get('/teams', SportsController.getTeams);
sportsRouter.post('/teams', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMIN'), SportsController.createTeam);

sportsRouter.get('/tournaments', SportsController.getTournaments);
sportsRouter.post('/tournaments', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMIN'), SportsController.createTournament);

sportsRouter.get('/activities', SportsController.getActivities);
sportsRouter.post('/activities', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMIN'), SportsController.createActivity);

sportsRouter.get('/achievements', SportsController.getAchievements);
sportsRouter.post('/achievements', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMIN'), SportsController.createAchievement);

sportsRouter.get('/events', SportsController.getEvents);
sportsRouter.post('/events', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMIN'), SportsController.createEvent);

