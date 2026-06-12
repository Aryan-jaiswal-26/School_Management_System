import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Student } from '../models/Student.js';
import { sendResponse } from '../utils/response.js';
import { Types } from 'mongoose';

export async function checkStudentDuplicates(req: Request, res: Response) {
  const schoolId = req.user?.schoolId || req.query.schoolId;
  const { firstName, lastName, dateOfBirth } = req.body;

  if (!schoolId) {
    return sendResponse(res, 400, 'School context required', null);
  }

  if (!firstName || !lastName || !dateOfBirth) {
    return sendResponse(res, 400, 'First name, last name, and date of birth are required', null);
  }

  // Exact matching for potential duplicates
  const users = await User.find({
    schoolId: new Types.ObjectId(schoolId as string),
    firstName: { $regex: new RegExp(`^${firstName}$`, 'i') },
    lastName: { $regex: new RegExp(`^${lastName}$`, 'i') }
  });

  let duplicates: any[] = [];
  if (users.length > 0) {
    const userIds = users.map((u: any) => u._id);
    duplicates = await Student.find({
      schoolId: new Types.ObjectId(schoolId as string),
      userId: { $in: userIds },
      dob: new Date(dateOfBirth),
      isDeleted: false
    }).populate('userId', 'firstName lastName email');
  }

  return sendResponse(res, 200, 'Duplicate check completed', {
    hasDuplicates: duplicates.length > 0,
    duplicates
  });
}

export async function findDuplicateRecords(req: Request, res: Response) {
  // A heavier analytical function to find all duplicates across the school
  const schoolId = req.user?.schoolId || req.query.schoolId;
  if (!schoolId) {
    return sendResponse(res, 400, 'School context required', null);
  }

  // Aggregation over Students joining with Users to find duplicates
  const duplicates = await Student.aggregate([
    { $match: { schoolId: new Types.ObjectId(schoolId as string), isDeleted: false } },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $group: {
        _id: { firstName: '$user.firstName', lastName: '$user.lastName', dob: '$dob' },
        count: { $sum: 1 },
        students: { $push: '$$ROOT' }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]);

  return sendResponse(res, 200, 'Duplicate records analysis completed', {
    totalDuplicateGroups: duplicates.length,
    groups: duplicates
  });
}
