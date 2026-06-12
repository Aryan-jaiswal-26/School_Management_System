import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import * as BranchService from '../services/branch.service.js';
import { BranchAnalyticsService } from '../services/branch-analytics.service.js';
import { ApiError } from '../utils/api-error.js';

/**
 * Controller for Branch CRUD operations and entity assignments.
 * All routes are protected by auth middleware and role checks (SUPER_ADMIN or SCHOOL_ADMIN).
 */
export const createBranch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branch = await BranchService.createBranch({
      schoolId: new Types.ObjectId(req.user.schoolId),
      ...req.body,
    });
    res.status(201).json(branch);
  } catch (err) {
    next(err);
  }
};

export const listBranches = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query as any;
    const allowedBranchIds = req.user.role === 'SUPER_ADMIN' ? undefined : req.user.allowedBranchIds;
    const result = await BranchService.listBranches({
      schoolId: req.user.schoolId,
      page: Number(page),
      limit: Number(limit),
      search: String(search),
      allowedBranchIds,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getBranch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branch = await BranchService.getBranchById(new Types.ObjectId(req.params.id));
    if (!branch) return next(new ApiError(404, 'Branch not found'));
    res.json(branch);
  } catch (err) {
    next(err);
  }
};

export const updateBranch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branch = await BranchService.updateBranch(
      new Types.ObjectId(req.params.id),
      req.body,
    );
    if (!branch) return next(new ApiError(404, 'Branch not found'));
    res.json(branch);
  } catch (err) {
    next(err);
  }
};

export const deleteBranch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branch = await BranchService.deleteBranch(new Types.ObjectId(req.params.id));
    if (!branch) return next(new ApiError(404, 'Branch not found'));
    res.json(branch);
  } catch (err) {
    next(err);
  }
};

export const activateBranch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branch = await BranchService.updateBranch(new Types.ObjectId(req.params.id), {
      isActive: true,
    });
    if (!branch) return next(new ApiError(404, 'Branch not found'));
    res.json(branch);
  } catch (err) {
    next(err);
  }
};

export const deactivateBranch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const branch = await BranchService.updateBranch(new Types.ObjectId(req.params.id), {
      isActive: false,
    });
    if (!branch) return next(new ApiError(404, 'Branch not found'));
    res.json(branch);
  } catch (err) {
    next(err);
  }
};

/**
 * Assign an existing entity (student, teacher, staff, class, section) to a branch.
 * Expected payload: { entityType: 'student'|'teacher'|'staff'|'class'|'section', entityId: string }
 */
export const assignEntityToBranch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entityType, entityId } = req.body as any;
    if (!entityType || !entityId) {
      return next(new ApiError(400, 'entityType and entityId are required'));
    }
    const branchId = new Types.ObjectId(req.params.id);
    await BranchService.assignEntity(entityType, entityId, branchId);
    res.status(200).json({ message: `${entityType} assigned to branch` });
  } catch (err) {
    next(err);
  }
};

export const getBranchAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schoolId = req.user.schoolId;
    const branchId = req.params.id;
    const stats = await BranchAnalyticsService.getBranchDashboardStats(schoolId, branchId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
};
