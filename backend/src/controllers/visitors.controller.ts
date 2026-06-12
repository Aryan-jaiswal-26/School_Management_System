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

// ─── Gate Pass ────────────────────────────────────────────────────────────────

export async function createGatePass(req: Request, res: Response) {
  const { visitorName, visitorPhone, purpose, validFrom, validUntil } = req.body;
  const schoolId = (req as any).user?.schoolId;
  const createdBy = (req as any).user?.id;

  if (!schoolId || !createdBy) {
    return sendResponse(res, 400, 'Missing user or school context', null);
  }
  if (!visitorName || !visitorPhone || !purpose || !validFrom || !validUntil) {
    return sendResponse(res, 400, 'Missing required fields: visitorName, visitorPhone, purpose, validFrom, validUntil', null);
  }

  const { GatePass } = await import('../models/GatePass.js');
  const qrCode = `GATEPASS-${schoolId}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  const gatePass = await GatePass.create({
    schoolId,
    visitorName,
    visitorPhone,
    purpose,
    validFrom: new Date(validFrom),
    validUntil: new Date(validUntil),
    qrCode,
    otpCode,
    createdBy,
  });

  return sendResponse(res, 201, 'Gate pass created', gatePass);
}

export async function listGatePasses(req: Request, res: Response) {
  const schoolId = (req as any).user?.schoolId;
  if (!schoolId) {
    return sendResponse(res, 400, 'Missing school context', null);
  }

  const { GatePass } = await import('../models/GatePass.js');
  const passes = await GatePass.find({ schoolId }).sort({ createdAt: -1 }).limit(100);
  return sendResponse(res, 200, 'Gate passes retrieved', passes);
}

export async function verifyGatePass(req: Request, res: Response) {
  const { qrCode, otpCode } = req.body;
  const schoolId = (req as any).user?.schoolId;

  if (!schoolId) {
    return sendResponse(res, 400, 'Missing school context', null);
  }
  if (!qrCode && !otpCode) {
    return sendResponse(res, 400, 'Provide qrCode or otpCode', null);
  }

  const { GatePass } = await import('../models/GatePass.js');
  const orConditions: object[] = [];
  if (qrCode) orConditions.push({ qrCode });
  if (otpCode) orConditions.push({ otpCode });

  const pass = await GatePass.findOne({ schoolId, $or: orConditions });
  if (!pass) return sendResponse(res, 404, 'Gate pass not found', null);
  if (pass.isUsed) return sendResponse(res, 400, 'Gate pass already used', null);
  if (new Date() > pass.validUntil) return sendResponse(res, 400, 'Gate pass expired', null);

  pass.isUsed = true;
  pass.usedAt = new Date();
  await pass.save();

  return sendResponse(res, 200, 'Gate pass verified and used', pass);
}
