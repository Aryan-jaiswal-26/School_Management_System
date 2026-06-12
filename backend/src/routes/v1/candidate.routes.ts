import { Router } from 'express';
import { CandidateController } from '../../controllers/candidate.controller.js';
import { authenticateToken } from '../../middleware/auth.js';

const candidateRouter = Router();

candidateRouter.get('/', authenticateToken, CandidateController.getAllCandidates);
candidateRouter.post('/vote', authenticateToken, CandidateController.toggleVote);

export { candidateRouter };
