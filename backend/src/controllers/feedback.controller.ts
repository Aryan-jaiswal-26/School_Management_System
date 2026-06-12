import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ParentFeedback } from '../models/ParentFeedback.js';
import { sendResponse } from '../utils/response.js';

export class FeedbackController {
  /**
   * GET /feedback
   * Admins see all feedback for the school. Supports filters: category, rating, page, limit.
   */
  static async list(req: Request, res: Response): Promise<Response> {
    const schoolId = (req as any).user?.schoolId;
    const page     = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10));
    const limit    = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
    const skip     = (page - 1) * limit;

    const filter: Record<string, unknown> = { schoolId };
    const userRole = (req as any).user?.role;
    if (userRole === 'PARENT' || userRole === 'STUDENT') {
      filter.userId = new mongoose.Types.ObjectId((req as any).user?.id);
    } else if (req.query.userId) {
      filter.userId = new mongoose.Types.ObjectId(String(req.query.userId));
    }
    if (req.query.category) filter.category = req.query.category;
    if (req.query.rating)   filter.rating   = Number(req.query.rating);

    const [feedbacks, total] = await Promise.all([
      ParentFeedback.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name email')
        .lean(),
      ParentFeedback.countDocuments(filter),
    ]);

    return sendResponse(res, 200, 'Feedback fetched successfully', {
      feedbacks,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  }

  /**
   * GET /feedback/stats
   * Aggregate rating stats per category for the school.
   */
  static async getStats(req: Request, res: Response): Promise<Response> {
    const schoolId = (req as any).user?.schoolId;

    const stats = await ParentFeedback.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
      {
        $group: {
          _id:         '$category',
          averageRating: { $avg: '$rating' },
          totalCount:    { $sum: 1 },
          ratingBreakdown: {
            $push: '$rating',
          },
        },
      },
      {
        $project: {
          category:      '$_id',
          averageRating: { $round: ['$averageRating', 2] },
          totalCount:    1,
          // compute distribution 1-5
          distribution: {
            $arrayToObject: {
              $map: {
                input: [1, 2, 3, 4, 5],
                as:    'star',
                in: {
                  k: { $toString: '$$star' },
                  v: {
                    $size: {
                      $filter: {
                        input: '$ratingBreakdown',
                        as:    'r',
                        cond:  { $eq: ['$$r', '$$star'] },
                      },
                    },
                  },
                },
              },
            },
          },
          _id: 0,
        },
      },
      { $sort: { category: 1 } },
    ]);

    // Overall averages
    const overall = await ParentFeedback.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
      {
        $group: {
          _id:           null,
          overallAvg:    { $avg: '$rating' },
          totalFeedbacks:{ $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          overallAvg:     { $round: ['$overallAvg', 2] },
          totalFeedbacks: 1,
        },
      },
    ]);

    return sendResponse(res, 200, 'Feedback stats fetched successfully', {
      overall: overall[0] ?? { overallAvg: 0, totalFeedbacks: 0 },
      byCategory: stats,
    });
  }

  /**
   * POST /feedback
   * Parents / students submit feedback.
   */
  static async create(req: Request, res: Response): Promise<Response> {
    const user     = (req as any).user;
    const schoolId = user?.schoolId;

    const { target, rating, feedback, category, anonymous, parentId } = req.body;

    if (!target || !rating || !feedback) {
      return sendResponse(res, 400, 'target, rating, and feedback are required');
    }

    if (rating < 1 || rating > 5) {
      return sendResponse(res, 400, 'rating must be between 1 and 5');
    }

    const doc = await ParentFeedback.create({
      schoolId,
      parentId: parentId ?? user.id,
      userId:   user.id,
      target:   String(target).trim(),
      rating:   Number(rating),
      feedback: String(feedback).trim(),
      category: category ?? 'GENERAL',
      anonymous: anonymous ?? false,
    });

    return sendResponse(res, 201, 'Feedback submitted successfully', { feedback: doc });
  }
}
