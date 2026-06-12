import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { LessonPlan } from '../models/LessonPlan.js';
import { sendResponse } from '../utils/response.js';

export class LessonPlanController {
  /**
   * GET /lesson-plans
   * List all lesson plans for the school. Supports optional filters:
   * ?teacherId=, ?classId=, ?status=, ?weekStartDate=
   */
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const { teacherId, classId, status, weekStartDate } = req.query as Record<string, string>;

      const filter: Record<string, unknown> = { schoolId };

      if (teacherId) filter.teacherId = new mongoose.Types.ObjectId(teacherId);
      if (classId) filter.classId = new mongoose.Types.ObjectId(classId);
      if (status) filter.status = status;
      if (weekStartDate) filter.weekStartDate = new Date(weekStartDate);

      const plans = await LessonPlan.find(filter)
        .sort({ weekStartDate: -1, createdAt: -1 })
        .populate('teacherId', 'firstName lastName')
        .populate('classId', 'name')
        .populate('subjectId', 'name')
        .lean();

      sendResponse(res, 200, 'Lesson plans retrieved successfully', plans);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /lesson-plans
   * Create a new lesson plan (status defaults to 'draft').
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const teacherId = req.user?.id as string;

      const {
        classId,
        subjectId,
        weekStartDate,
        title,
        objectives,
        activities,
        materials,
        homework,
      } = req.body;

      const plan = await LessonPlan.create({
        schoolId,
        teacherId,
        classId,
        subjectId,
        weekStartDate,
        title,
        objectives: objectives ?? [],
        activities: activities ?? [],
        materials: materials ?? [],
        homework,
        status: 'draft',
      });

      sendResponse(res, 201, 'Lesson plan created successfully', plan);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /lesson-plans/:id
   * Get a single lesson plan by ID (must belong to the same school).
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const { id } = req.params;

      const plan = await LessonPlan.findOne({ _id: id, schoolId })
        .populate('teacherId', 'firstName lastName')
        .populate('classId', 'name')
        .populate('subjectId', 'name')
        .populate('reviewedBy', 'name email')
        .lean();

      if (!plan) {
        res.status(404).json({ success: false, message: 'Lesson plan not found' });
        return;
      }

      sendResponse(res, 200, 'Lesson plan retrieved successfully', plan);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /lesson-plans/:id
   * Update a lesson plan. Only allowed if status is 'draft' (or by admin).
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const userId = req.user?.id as string;
      const userRole = req.user?.role as string;
      const { id } = req.params;

      const plan = await LessonPlan.findOne({ _id: id, schoolId });

      if (!plan) {
        res.status(404).json({ success: false, message: 'Lesson plan not found' });
        return;
      }

      // Teachers can only edit their own draft plans
      const isAdmin = ['SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(userRole);
      if (!isAdmin) {
        if (plan.teacherId.toString() !== userId) {
          res.status(403).json({ success: false, message: 'You can only edit your own lesson plans' });
          return;
        }
        if (plan.status !== 'draft') {
          res.status(400).json({ success: false, message: 'Only draft lesson plans can be edited' });
          return;
        }
      }

      const allowedFields = ['classId', 'subjectId', 'weekStartDate', 'title', 'objectives', 'activities', 'materials', 'homework'];
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          (plan as any)[field] = req.body[field];
        }
      }

      await plan.save();

      sendResponse(res, 200, 'Lesson plan updated successfully', plan);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /lesson-plans/:id/submit
   * Teacher submits a lesson plan (draft → submitted).
   */
  static async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const userId = req.user?.id as string;
      const { id } = req.params;

      const plan = await LessonPlan.findOne({ _id: id, schoolId });

      if (!plan) {
        res.status(404).json({ success: false, message: 'Lesson plan not found' });
        return;
      }

      if (plan.teacherId.toString() !== userId) {
        res.status(403).json({ success: false, message: 'You can only submit your own lesson plans' });
        return;
      }

      if (plan.status !== 'draft') {
        res.status(400).json({ success: false, message: `Lesson plan is already ${plan.status}` });
        return;
      }

      plan.status = 'submitted';
      await plan.save();

      sendResponse(res, 200, 'Lesson plan submitted for review', plan);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /lesson-plans/:id/review
   * Admin approves or rejects a submitted lesson plan.
   * Body: { action: 'approve' | 'reject', feedback?: string }
   */
  static async review(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const reviewerId = req.user?.id as string;
      const { id } = req.params;
      const { action, feedback } = req.body as { action: 'approve' | 'reject'; feedback?: string };

      if (!['approve', 'reject'].includes(action)) {
        res.status(400).json({ success: false, message: 'action must be "approve" or "reject"' });
        return;
      }

      const plan = await LessonPlan.findOne({ _id: id, schoolId });

      if (!plan) {
        res.status(404).json({ success: false, message: 'Lesson plan not found' });
        return;
      }

      if (plan.status !== 'submitted') {
        res.status(400).json({ success: false, message: 'Only submitted lesson plans can be reviewed' });
        return;
      }

      plan.status = action === 'approve' ? 'approved' : 'rejected';
      plan.adminFeedback = feedback;
      plan.reviewedBy = new mongoose.Types.ObjectId(reviewerId);
      plan.reviewedAt = new Date();

      await plan.save();

      sendResponse(res, 200, `Lesson plan ${plan.status}`, plan);
    } catch (error) {
      next(error);
    }
  }
}
