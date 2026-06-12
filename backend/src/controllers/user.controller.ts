import type { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response.js';
import { User } from '../models/User.js';
import { Parent } from '../models/Parent.js';
import { Student } from '../models/Student.js';
import { Types } from 'mongoose';

export class UserController {
  static async getUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      
      const user = await User.findById(id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      sendResponse(res, 200, 'User profile retrieved', {
        id: user._id.toString(),
        email: user.email,
        full_name: `${user.firstName} ${user.lastName}`.trim(),
        role: user.role.toLowerCase(),
        avatar_url: user.profilePicture || null,
        subtitle: user.role,
        created_at: user.createdAt,
        updated_at: user.updatedAt
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllProfiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { role } = req.query;

      const match: any = { schoolId: new Types.ObjectId(schoolId) };
      if (role) {
        match.role = (role as string).toUpperCase();
      }

      const users = await User.find(match);

      const formatted = users.map(user => ({
        id: user._id.toString(),
        email: user.email,
        full_name: `${user.firstName} ${user.lastName}`.trim(),
        role: user.role.toLowerCase(),
        avatar_url: user.profilePicture || null,
        subtitle: user.role,
        created_at: user.createdAt,
        updated_at: user.updatedAt
      }));

      sendResponse(res, 200, 'User profiles retrieved', formatted);
    } catch (error) {
      next(error);
    }
  }

  static async listParents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { search } = req.query;

      const match: Record<string, unknown> = { schoolId: new Types.ObjectId(schoolId) };
      if (search) {
        match.$or = [
          { contactPrimary: { $regex: search, $options: 'i' } },
          { occupation: { $regex: search, $options: 'i' } },
        ];
      }

      const parents = await Parent.find(match)
        .populate({ path: 'userId', select: 'firstName lastName email role profilePicture' })
        .sort({ createdAt: -1 });

      const parentIds = parents.map((parent) => parent._id);
      const children = await Student.find({
        schoolId: new Types.ObjectId(schoolId),
        parentIds: { $in: parentIds },
        isDeleted: false,
      })
        .populate('userId', 'firstName lastName admissionNumber rollNumber')
        .populate('classId', 'name')
        .populate('sectionId', 'name');

      const formatted = parents.map((parent) => {
        const linkedChildren = children.filter((student) =>
          student.parentIds.some((parentId) => parentId.toString() === parent._id.toString())
        );

        return {
          parentId: parent._id.toString(),
          userId: parent.userId ? parent.userId.toString() : null,
          contactPrimary: parent.contactPrimary,
          contactSecondary: parent.contactSecondary,
          occupation: parent.occupation,
          address: parent.address,
          parentName: parent.userId && typeof parent.userId === 'object'
            ? `${(parent.userId as any).firstName || ''} ${(parent.userId as any).lastName || ''}`.trim()
            : 'Parent',
          email: parent.userId && typeof parent.userId === 'object' ? (parent.userId as any).email : null,
          children: linkedChildren.map((student) => ({
            id: student._id.toString(),
            name: student.userId && typeof student.userId === 'object'
              ? `${(student.userId as any).firstName || ''} ${(student.userId as any).lastName || ''}`.trim()
              : 'Student',
            admissionNumber: student.admissionNumber,
            rollNumber: student.rollNumber,
            className: student.classId && typeof student.classId === 'object' ? (student.classId as any).name : null,
            sectionName: student.sectionId && typeof student.sectionId === 'object' ? (student.sectionId as any).name : null,
          })),
          childCount: linkedChildren.length,
        };
      });

      sendResponse(res, 200, 'Parent profiles retrieved', formatted);
    } catch (error) {
      next(error);
    }
  }
}
