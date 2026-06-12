import { Request, Response } from 'express';
import { VisitorsService } from '../services/visitors.service.js';
import { sendResponse } from '../utils/response.js';

const visitorsService = new VisitorsService();

export async function getLogs(req: Request, res: Response) {
  const logs = await visitorsService.getLogs(req.user || req);
  return sendResponse(res, 200, 'Visitor logs retrieved', logs);
}

export async function getPreApproved(req: Request, res: Response) {
  const preApproved = await visitorsService.getPreApproved(req.user || req);
  return sendResponse(res, 200, 'Pre-approved visitors retrieved', preApproved);
}

export async function getBlacklist(req: Request, res: Response) {
  const blacklist = await visitorsService.getBlacklist(req.user || req);
  return sendResponse(res, 200, 'Blacklisted visitors retrieved', blacklist);
}

export async function createLog(req: Request, res: Response) {
  const log = await visitorsService.createLog(req.user || req, req.body);
  return sendResponse(res, 201, 'Visitor log created', log);
}

export async function checkoutVisitor(req: Request, res: Response) {
  const log = await visitorsService.checkoutVisitor(req.user || req, req.params.id as string);
  return sendResponse(res, 200, 'Visitor checked out', log);
}
