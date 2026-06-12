import { Request, Response } from 'express';
import { PerformanceReview } from '../models/PerformanceReview.js';
import { sendResponse } from '../utils/response.js';
import { Types } from 'mongoose';

export async function createReview(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.body.schoolId;
    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const review = new PerformanceReview({
      schoolId: new Types.ObjectId(schoolId as string),
      teacherId: new Types.ObjectId(req.body.teacherId),
      reviewerId: new Types.ObjectId((req.user as any)?._id || (req.user as any)?.id),
      reviewDate: req.body.reviewDate || new Date(),
      academicYearId: new Types.ObjectId(req.body.academicYearId),
      rating: req.body.rating,
      feedback: req.body.feedback,
      goals: req.body.goals || [],
      status: req.body.status || 'DRAFT'
    });

    await review.save();
    return sendResponse(res, 201, 'Performance review created', review);
  } catch (error: any) {
    return sendResponse(res, 500, 'Failed to create review', { error: error.message });
  }
}

export async function listReviews(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.query.schoolId;
    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const query: any = { schoolId: new Types.ObjectId(schoolId as string) };
    if (req.query.teacherId) query.teacherId = new Types.ObjectId(req.query.teacherId as string);

    const reviews = await PerformanceReview.find(query).populate('teacherId', 'firstName lastName').populate('reviewerId', 'firstName lastName');
    return sendResponse(res, 200, 'Reviews retrieved', reviews);
  } catch (error: any) {
    return sendResponse(res, 500, 'Failed to list reviews', { error: error.message });
  }
}
