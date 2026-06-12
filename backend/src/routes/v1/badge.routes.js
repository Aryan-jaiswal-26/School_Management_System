import { Router } from 'express';
import { BadgeController } from '../../controllers/badge.controller.js';

const badgeRouter = Router();
badgeRouter.get('/', BadgeController.getAllBadges);

export { badgeRouter };
