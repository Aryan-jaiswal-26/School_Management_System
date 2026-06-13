import { Request, Response } from 'express';
import { PerformanceReview } from '../models/PerformanceReview.js';
import { Employee } from '../models/Employee.js';
import { AcademicYear } from '../models/AcademicYear.js';
import { sendResponse } from '../utils/response.js';
import mongoose, { Types } from 'mongoose';

export async function createReview(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.body.schoolId;
    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    // 1. Resolve teacher (User) ID
    let teacherUserId: Types.ObjectId | null = null;
    const targetId = req.body.teacherId || req.body.employeeId || req.body.staffId;
    if (!targetId) {
      return sendResponse(res, 400, 'Teacher ID / Employee ID is required', null);
    }

    const employee = await Employee.findOne({
      schoolId,
      $or: [
        { _id: mongoose.isValidObjectId(targetId) ? new Types.ObjectId(targetId) : null },
        { employeeId: targetId },
        { userId: mongoose.isValidObjectId(targetId) ? new Types.ObjectId(targetId) : null }
      ]
    });

    if (employee) {
      teacherUserId = employee.userId;
    } else if (mongoose.isValidObjectId(targetId)) {
      teacherUserId = new Types.ObjectId(targetId);
    }

    if (!teacherUserId) {
      return sendResponse(res, 404, 'Employee/Teacher profile not found', null);
    }

    // 2. Resolve Academic Year ID
    let academicYearId = req.body.academicYearId;
    if (!academicYearId || !mongoose.isValidObjectId(academicYearId)) {
      const currentYear = await AcademicYear.findOne({ schoolId, isCurrent: true });
      if (currentYear) {
        academicYearId = currentYear._id;
      } else {
        const anyYear = await AcademicYear.findOne({ schoolId });
        if (anyYear) {
          academicYearId = anyYear._id;
        } else {
          // Auto-create a default academic year if none exists
          const defaultYear = new AcademicYear({
            schoolId,
            name: '2026-2027',
            startDate: new Date('2026-06-01'),
            endDate: new Date('2027-05-31'),
            isCurrent: true,
            isActive: true
          });
          await defaultYear.save();
          academicYearId = defaultYear._id;
        }
      }
    }

    const reviewerId = (req.user as any)?._id || (req.user as any)?.id;
    if (!reviewerId) {
      return sendResponse(res, 401, 'Unauthorized', null);
    }

    const review = new PerformanceReview({
      schoolId: new Types.ObjectId(schoolId as string),
      teacherId: teacherUserId,
      reviewerId: new Types.ObjectId(reviewerId),
      reviewDate: req.body.reviewDate || new Date(),
      academicYearId: new Types.ObjectId(academicYearId as string),
      rating: Number(req.body.rating || 4),
      feedback: req.body.feedback || req.body.comments || 'No feedback provided',
      goals: req.body.goals || [],
      status: req.body.status || 'PUBLISHED'
    });

    await review.save();
    return sendResponse(res, 201, 'Performance review created successfully', review);
  } catch (error: any) {
    return sendResponse(res, 500, 'Failed to create review', { error: error.message });
  }
}

export async function listReviews(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.query.schoolId;
    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const query: any = { schoolId: new Types.ObjectId(schoolId as string) };
    
    const targetId = req.query.teacherId || req.query.employeeId || req.query.staffId;
    if (targetId) {
      const employee = await Employee.findOne({
        schoolId: new Types.ObjectId(schoolId as string),
        $or: [
          { _id: mongoose.isValidObjectId(targetId) ? new Types.ObjectId(targetId as string) : null },
          { employeeId: targetId as string },
          { userId: mongoose.isValidObjectId(targetId) ? new Types.ObjectId(targetId as string) : null }
        ]
      });
      if (employee) {
        query.teacherId = employee.userId;
      } else if (mongoose.isValidObjectId(targetId)) {
        query.teacherId = new Types.ObjectId(targetId as string);
      }
    }

    const reviews = await PerformanceReview.find(query)
      .populate('teacherId', 'firstName lastName')
      .populate('reviewerId', 'firstName lastName')
      .sort({ reviewDate: -1 });

    return sendResponse(res, 200, 'Reviews retrieved successfully', reviews);
  } catch (error: any) {
    return sendResponse(res, 500, 'Failed to list reviews', { error: error.message });
  }
}
