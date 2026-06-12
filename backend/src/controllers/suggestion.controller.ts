import type { Request, Response, NextFunction } from 'express';
import { Suggestion } from '../models/Suggestion.js';
import { sendResponse } from '../utils/response.js';

export class SuggestionController {
  /**
   * POST /suggestions
   * Submit an anonymous suggestion.
   * No authentication required — schoolId must be provided in the body.
   * Body: { schoolId, content, category? }
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { schoolId, content, category } = req.body;

      if (!schoolId) {
        res.status(400).json({ success: false, message: 'schoolId is required' });
        return;
      }

      if (!content || !String(content).trim()) {
        res.status(400).json({ success: false, message: 'Suggestion content is required' });
        return;
      }

      if (String(content).length > 2000) {
        res.status(400).json({ success: false, message: 'Suggestion content must not exceed 2000 characters' });
        return;
      }

      const suggestion = await Suggestion.create({
        schoolId,
        content: String(content).trim(),
        category: category ?? 'other',
        status: 'pending',
        submittedAt: new Date(),
      });

      // Deliberately return minimal data to preserve anonymity
      sendResponse(res, 201, 'Suggestion submitted successfully', {
        id: suggestion._id,
        category: suggestion.category,
        submittedAt: suggestion.submittedAt,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /suggestions
   * List all suggestions for the school (admin only).
   * Supports optional filters: ?status=, ?category=
   */
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const {
        status,
        category,
        page = '1',
        limit = '20',
      } = req.query as Record<string, string>;

      const filter: Record<string, unknown> = { schoolId };
      if (status) filter.status = status;
      if (category) filter.category = category;

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
      const skip = (pageNum - 1) * limitNum;

      const [suggestions, total] = await Promise.all([
        Suggestion.find(filter)
          .sort({ submittedAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Suggestion.countDocuments(filter),
      ]);

      sendResponse(res, 200, 'Suggestions retrieved successfully', suggestions, {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /suggestions/:id/status
   * Admin updates the status of a suggestion.
   * Body: { status: 'reviewed' | 'actioned' | 'dismissed', adminNotes?: string }
   */
  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const { id } = req.params;
      const { status, adminNotes } = req.body as {
        status: 'reviewed' | 'actioned' | 'dismissed';
        adminNotes?: string;
      };

      const validStatuses = ['reviewed', 'actioned', 'dismissed'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: `status must be one of: ${validStatuses.join(', ')}`,
        });
        return;
      }

      const suggestion = await Suggestion.findOneAndUpdate(
        { _id: id, schoolId },
        {
          $set: {
            status,
            ...(adminNotes !== undefined && { adminNotes }),
          },
        },
        { new: true },
      );

      if (!suggestion) {
        res.status(404).json({ success: false, message: 'Suggestion not found' });
        return;
      }

      sendResponse(res, 200, 'Suggestion status updated successfully', suggestion);
    } catch (error) {
      next(error);
    }
  }
}
