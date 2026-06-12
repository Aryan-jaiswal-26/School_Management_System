// backend/src/controllers/teacher.controller.ts
import { Request, Response, NextFunction } from 'express';
import { Announcement } from '../models/Announcement.js';
import { Employee } from '../models/Employee.js'; // Assuming Employee model represents teachers
import { User } from '../models/User.js';
import { Timetable } from '../models/Timetable.js';
// Placeholder models for live classes and exam insights can be added later.

export class TeacherController {
  /**
   * Get teacher feed announcements.
   * Returns an array of announcements filtered for the teacher or all audience.
   * If no announcements exist, returns an empty array.
   */
  static async getTeacherFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      // Filter announcements for the teacher's school and audience
      const announcements = await Announcement.find({
        schoolId: user.schoolId,
        $or: [
          { targetAudience: 'ALL' },
          { targetAudience: 'TEACHERS' },
        ],
      })
        .sort({ publishedDate: -1 })
        .lean();
      // If none, send empty array
      return res.json({ data: announcements || [] });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get teacher profile by ID.
   * If the teacher does not exist, returns a minimal empty profile object.
   */
  static async getTeacherProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id || (req as any).user.id;
      let teacher = await Employee.findOne({ userId: id, employeeType: 'TEACHING' }).lean();
      if (!teacher) {
        teacher = await Employee.findOne({ _id: id, employeeType: 'TEACHING' }).lean();
      }
      if (!teacher) {
        return res.json({ data: null });
      }

      const user = await User.findById(teacher.userId).lean();
      if (!user) {
        return res.json({ data: teacher });
      }

      const profile = {
        ...teacher,
        name: `${user.firstName} ${user.lastName}`,
        phone: user.phoneNumber || '',
        bio: teacher.bio || '',
      };

      return res.json({ data: profile });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update teacher profile details.
   */
  static async updateTeacherProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const id = (req as any).user.id;
      let teacher = await Employee.findOne({ userId: id, employeeType: 'TEACHING' });
      if (!teacher) {
        teacher = await Employee.findOne({ _id: id, employeeType: 'TEACHING' });
      }
      if (!teacher) {
        res.status(404).json({ success: false, message: 'Teacher profile not found' });
        return;
      }

      const user = await User.findById(teacher.userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User record not found' });
        return;
      }

      const { name, phone, bio } = req.body;

      if (name) {
        const parts = name.trim().split(/\s+/);
        user.firstName = parts[0] || '';
        user.lastName = parts.slice(1).join(' ') || '';
      }
      if (phone !== undefined) {
        user.phoneNumber = phone;
      }
      await user.save();

      if (bio !== undefined) {
        teacher.bio = bio;
        await teacher.save();
      }

      const profile = {
        ...teacher.toObject(),
        name: `${user.firstName} ${user.lastName}`,
        phone: user.phoneNumber || '',
        bio: teacher.bio || '',
      };

      return res.json({ success: true, message: 'Profile updated successfully', data: profile });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Placeholder live class participants endpoint.
   * Returns an empty array when no data is present.
   */
  static async getLiveClasses(req: Request, res: Response, next: NextFunction) {
    try {
      // In a real implementation you would query a LiveClass or Session model.
      // For now we simply return an empty list.
      return res.json({ data: [] });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Exam insights endpoint.
   * Returns structure { overall: [], examwise: [], subwise: [] } with empty arrays when no data.
   */
  static async getExamInsights(req: Request, res: Response, next: NextFunction) {
    try {
      // Real logic would aggregate results; here we respond with empty defaults.
      const insights = {
        overall: [],
        examwise: [],
        subwise: [],
      };
      return res.json({ data: insights });
    } catch (err) {
      next(err);
    }
  }

  static async getTeacherTimetable(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const employee = await Employee.findOne({ userId: user.id, employeeType: 'TEACHING', schoolId: user.schoolId });
      if (!employee) {
        return res.json({ data: [] });
      }

      const entries = await Timetable.find({
        schoolId: user.schoolId,
        teacherId: employee._id,
        isDeleted: false
      })
        .populate('classId', 'name')
        .populate('sectionId', 'name')
        .populate('subjectId', 'name code')
        .sort({ dayOfWeek: 1, startTime: 1 })
        .lean();

      return res.json({ data: entries || [] });
    } catch (err) {
      next(err);
    }
  }
}
