import { Router } from 'express';
import { authenticateToken, requireRoles } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  getElections,
  createElection,
  getCandidates,
  addCandidate,
  castVote,
} from '../../controllers/election.controller.js';

export const electionRoutes = Router();

electionRoutes.use(authenticateToken);

electionRoutes.get('/', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), asyncHandler(getElections));
electionRoutes.post('/', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), asyncHandler(createElection));

electionRoutes.get('/:electionId/candidates', asyncHandler(getCandidates));
electionRoutes.post('/:electionId/candidates', requireRoles('SUPER_ADMIN', 'SCHOOL_ADMIN'), asyncHandler(addCandidate));

electionRoutes.post('/:electionId/vote', requireRoles('STUDENT'), asyncHandler(castVote));
