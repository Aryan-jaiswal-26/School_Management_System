import { Router } from 'express';
import { SuggestionController } from '../../controllers/suggestion.controller.js';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';

export const suggestionRouter = Router();

// Anonymous submission — no auth required
suggestionRouter.post('/', asyncHandler(SuggestionController.create));

// Admin-only endpoints
suggestionRouter.get(
  '/',
  authenticateToken,
  requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN'),
  asyncHandler(SuggestionController.list),
);
suggestionRouter.patch(
  '/:id/status',
  authenticateToken,
  requireRoles('SCHOOL_ADMIN', 'SUPER_ADMIN'),
  asyncHandler(SuggestionController.updateStatus),
);
