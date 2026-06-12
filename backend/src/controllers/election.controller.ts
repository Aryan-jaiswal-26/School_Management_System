import type { Request, Response } from 'express';
import { ElectionService } from '../services/election.service.js';
import { sendResponse } from '../utils/response.js';

const electionService = new ElectionService();

export async function getElections(req: Request, res: Response) {
  const schoolId = req.user?.schoolId as string;
  const elections = await electionService.getElections(schoolId);
  return sendResponse(res, 200, 'Elections fetched', elections);
}

export async function createElection(req: Request, res: Response) {
  const schoolId = req.user?.schoolId as string;
  const election = await electionService.createElection(schoolId, req.body);
  return sendResponse(res, 201, 'Election created', election);
}

export async function getCandidates(req: Request, res: Response) {
  const candidates = await electionService.getCandidates(req.params.electionId);
  return sendResponse(res, 200, 'Candidates fetched', candidates);
}

export async function addCandidate(req: Request, res: Response) {
  const schoolId = req.user?.schoolId as string;
  const candidate = await electionService.addCandidate(schoolId, req.params.electionId, req.body);
  return sendResponse(res, 201, 'Candidate added', candidate);
}

export async function castVote(req: Request, res: Response) {
  const schoolId = req.user?.schoolId as string;
  const studentId = req.user?.id as string;
  const result = await electionService.castVote(
    schoolId,
    req.params.electionId,
    req.body.candidateId,
    studentId
  );
  return sendResponse(res, 200, 'Vote cast', result);
}
