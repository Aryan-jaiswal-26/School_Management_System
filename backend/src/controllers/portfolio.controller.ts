import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Portfolio } from '../models/Portfolio.js';
import { sendResponse } from '../utils/response.js';

export class PortfolioController {
  /**
   * GET /portfolio/me
   * Get the authenticated student's own portfolio.
   */
  static async getMyPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id as string;
      const schoolId = req.user?.schoolId as string;

      const portfolio = await Portfolio.findOne({ studentId, schoolId }).lean();

      if (!portfolio) {
        // Return an empty portfolio shape rather than 404, for easy frontend handling
        sendResponse(res, 200, 'Portfolio not found', null);
        return;
      }

      sendResponse(res, 200, 'Portfolio retrieved successfully', portfolio);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /portfolio/me
   * Create or update the student's portfolio metadata (bio, goals, interests, isPublic).
   */
  static async upsert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id as string;
      const schoolId = req.user?.schoolId as string;

      const { bio, goals, interests, isPublic } = req.body;

      const portfolio = await Portfolio.findOneAndUpdate(
        { studentId, schoolId },
        {
          $set: {
            ...(bio !== undefined && { bio }),
            ...(goals !== undefined && { goals }),
            ...(interests !== undefined && { interests }),
            ...(isPublic !== undefined && { isPublic }),
            studentId,
            schoolId,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      );

      sendResponse(res, 200, 'Portfolio saved successfully', portfolio);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /portfolio/me/entries
   * Add a new entry to the student's portfolio.
   * Body: { type, title, description?, fileUrl?, subject?, grade?, date? }
   */
  static async addEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id as string;
      const schoolId = req.user?.schoolId as string;

      const { type, title, description, fileUrl, subject, grade, date } = req.body;

      if (!type || !title) {
        res.status(400).json({ success: false, message: 'type and title are required for a portfolio entry' });
        return;
      }

      const newEntry = {
        _id: new mongoose.Types.ObjectId(),
        type,
        title,
        description,
        fileUrl,
        subject,
        grade,
        date: date ? new Date(date) : new Date(),
      };

      const portfolio = await Portfolio.findOneAndUpdate(
        { studentId, schoolId },
        {
          $push: { entries: newEntry },
          $setOnInsert: { studentId, schoolId, isPublic: false },
        },
        { new: true, upsert: true },
      );

      sendResponse(res, 201, 'Entry added to portfolio', portfolio);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /portfolio/me/entries/:entryId
   * Remove a specific entry from the student's portfolio.
   */
  static async removeEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id as string;
      const schoolId = req.user?.schoolId as string;
      const { entryId } = req.params;

      const portfolio = await Portfolio.findOneAndUpdate(
        { studentId, schoolId },
        {
          $pull: { entries: { _id: new mongoose.Types.ObjectId(entryId) } },
        },
        { new: true },
      );

      if (!portfolio) {
        res.status(404).json({ success: false, message: 'Portfolio not found' });
        return;
      }

      sendResponse(res, 200, 'Entry removed from portfolio', portfolio);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /portfolio/student/:studentId
   * View a student's portfolio (for parents, teachers, admins).
   * Respects isPublic flag — teachers/admins always see it; parents only see public portfolios.
   */
  static async getByStudentId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const viewerRole = req.user?.role as string;
      const { studentId } = req.params;

      const portfolio = await Portfolio.findOne({ studentId, schoolId }).lean();

      if (!portfolio) {
        res.status(404).json({ success: false, message: 'Portfolio not found' });
        return;
      }

      // Parents can only view public portfolios
      const isParent = viewerRole === 'PARENT';
      if (isParent && !portfolio.isPublic) {
        res.status(403).json({ success: false, message: 'This portfolio is private' });
        return;
      }

      sendResponse(res, 200, 'Portfolio retrieved successfully', portfolio);
    } catch (error) {
      next(error);
    }
  }
}
