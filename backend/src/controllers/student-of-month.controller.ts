import type { Request, Response, NextFunction } from 'express';
import { StudentOfMonth } from '../models/StudentOfMonth.js';
import { sendResponse } from '../utils/response.js';

export class StudentOfMonthController {
  /**
   * GET /student-of-month
   * Query params: month, year, category, page, limit
   */
  static list = async (req: any, res: Response, next: NextFunction) => {
    try {
      const schoolId = req.user?.schoolId;
      const { month, year, category, page = 1, limit = 20 } = req.query;

      const filter: Record<string, any> = { schoolId };
      if (month) filter.month = Number(month);
      if (year) filter.year = Number(year);
      if (category) filter.category = category;

      const skip = (Number(page) - 1) * Number(limit);
      const [records, total] = await Promise.all([
        StudentOfMonth.find(filter)
          .sort({ year: -1, month: -1, points: -1 })
          .skip(skip)
          .limit(Number(limit))
          .populate('studentId', 'firstName lastName profilePicture')
          .populate('nominatedBy', 'firstName lastName'),
        StudentOfMonth.countDocuments(filter),
      ]);

      return sendResponse(res, 200, 'Student of the month records retrieved', {
        records,
        pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /student-of-month/month?month=6&year=2026
   * Returns all entries for the specified month and year
   */
  static getByMonth = async (req: any, res: Response, next: NextFunction) => {
    try {
      const schoolId = req.user?.schoolId;
      const { month, year } = req.query;

      if (!month || !year) {
        return sendResponse(res, 400, 'month and year query params are required', null);
      }

      const records = await StudentOfMonth.find({
        schoolId,
        month: Number(month),
        year: Number(year),
      })
        .sort({ points: -1, category: 1 })
        .populate('studentId', 'firstName lastName profilePicture grade')
        .populate('nominatedBy', 'firstName lastName');

      return sendResponse(res, 200, 'Student of the month for given period', records);
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /student-of-month
   * Body: { studentId, studentName, grade, month, year, category, reason, photoUrl, points }
   */
  static create = async (req: any, res: Response, next: NextFunction) => {
    try {
      const schoolId = req.user?.schoolId;
      const nominatedBy = req.user?.id;
      const { studentId, studentName, grade, month, year, category, reason, photoUrl, points } = req.body;

      if (!studentId || !studentName || !grade || !month || !year || !reason) {
        return sendResponse(res, 400, 'studentId, studentName, grade, month, year, and reason are required', null);
      }

      const record = await StudentOfMonth.create({
        schoolId,
        studentId,
        studentName,
        grade,
        month: Number(month),
        year: Number(year),
        category: category || 'overall',
        reason,
        nominatedBy,
        photoUrl,
        points: points || 0,
      });

      return sendResponse(res, 201, 'Student of the month record created', record);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /student-of-month/:id
   */
  static delete = async (req: any, res: Response, next: NextFunction) => {
    try {
      const schoolId = req.user?.schoolId;
      const { id } = req.params;

      const record = await StudentOfMonth.findOneAndDelete({ _id: id, schoolId });
      if (!record) {
        return sendResponse(res, 404, 'Record not found', null);
      }

      return sendResponse(res, 200, 'Record deleted successfully', null);
    } catch (error) {
      next(error);
    }
  };
}
