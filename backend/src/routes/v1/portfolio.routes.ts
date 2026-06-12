import { Router } from 'express';
import { PortfolioController } from '../../controllers/portfolio.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const portfolioRouter = Router();
portfolioRouter.use(authenticateToken);

portfolioRouter.get('/me', asyncHandler(PortfolioController.getMyPortfolio));
portfolioRouter.put('/me', asyncHandler(PortfolioController.upsert));
portfolioRouter.post('/me/entries', asyncHandler(PortfolioController.addEntry));
portfolioRouter.delete('/me/entries/:entryId', asyncHandler(PortfolioController.removeEntry));
portfolioRouter.get(
  '/student/:studentId',
  requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER', 'PARENT'),
  asyncHandler(PortfolioController.getByStudentId),
);
