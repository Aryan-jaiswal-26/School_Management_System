import { Request, Response } from 'express';
import { SubstituteAssignment } from '../models/SubstituteAssignment.js';
import { Employee } from '../models/Employee.js';
import { Class } from '../models/Class.js';
import { Subject } from '../models/Subject.js';
import { sendResponse } from '../utils/response.js';
import mongoose, { Types } from 'mongoose';

export async function createAssignment(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.body.schoolId;
    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    // 1. Resolve absent teacher's User ID
    let absentTeacherUserId: Types.ObjectId | null = null;
    const absentId = req.body.absentTeacherId;
    if (absentId) {
      const emp = await Employee.findOne({
        schoolId: new Types.ObjectId(schoolId as string),
        $or: [
          { _id: mongoose.isValidObjectId(absentId) ? new Types.ObjectId(absentId) : null },
          { employeeId: absentId },
          { userId: mongoose.isValidObjectId(absentId) ? new Types.ObjectId(absentId) : null }
        ]
      });
      if (emp) absentTeacherUserId = emp.userId;
      else if (mongoose.isValidObjectId(absentId)) absentTeacherUserId = new Types.ObjectId(absentId);
    }
    
    if (!absentTeacherUserId) {
      return sendResponse(res, 400, 'Absent teacher profile not found', null);
    }

    // 2. Resolve substitute teacher's User ID
    let substituteTeacherUserId: Types.ObjectId | null = null;
    const substituteId = req.body.substituteTeacherId;
    if (substituteId) {
      const emp = await Employee.findOne({
        schoolId: new Types.ObjectId(schoolId as string),
        $or: [
          { _id: mongoose.isValidObjectId(substituteId) ? new Types.ObjectId(substituteId) : null },
          { employeeId: substituteId },
          { userId: mongoose.isValidObjectId(substituteId) ? new Types.ObjectId(substituteId) : null }
        ]
      });
      if (emp) substituteTeacherUserId = emp.userId;
      else if (mongoose.isValidObjectId(substituteId)) substituteTeacherUserId = new Types.ObjectId(substituteId);
    }

    if (!substituteTeacherUserId) {
      return sendResponse(res, 400, 'Substitute teacher profile not found', null);
    }

    // 3. Resolve Class
    let classId = req.body.classId;
    if (!classId || !mongoose.isValidObjectId(classId)) {
      const cls = await Class.findOne({ schoolId: new Types.ObjectId(schoolId as string) });
      if (cls) {
        classId = cls._id;
      } else {
        const defaultClass = new Class({
          schoolId: new Types.ObjectId(schoolId as string),
          name: 'Default Class',
          sections: []
        });
        await defaultClass.save();
        classId = defaultClass._id;
      }
    }

    // 4. Resolve Subject
    let subjectId = req.body.subjectId;
    if (!subjectId || !mongoose.isValidObjectId(subjectId)) {
      const sub = await Subject.findOne({ schoolId: new Types.ObjectId(schoolId as string) });
      if (sub) {
        subjectId = sub._id;
      } else {
        const defaultSubject = new Subject({
          schoolId: new Types.ObjectId(schoolId as string),
          name: 'Default Subject',
          code: 'SUBJ101'
        });
        await defaultSubject.save();
        subjectId = defaultSubject._id;
      }
    }

    const assignment = new SubstituteAssignment({
      schoolId: new Types.ObjectId(schoolId as string),
      absentTeacherId: absentTeacherUserId,
      substituteTeacherId: substituteTeacherUserId,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      periodOrTime: req.body.periodOrTime || req.body.periodOrClass || 'Period 1',
      classId: new Types.ObjectId(classId as string),
      subjectId: new Types.ObjectId(subjectId as string),
      notes: req.body.notes || '',
      status: 'PENDING'
    });

    await assignment.save();
    return sendResponse(res, 201, 'Substitute assigned successfully', assignment);
  } catch (error: any) {
    return sendResponse(res, 500, 'Failed to assign substitute', { error: error.message });
  }
}

export async function listAssignments(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.query.schoolId;
    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const query: any = { schoolId: new Types.ObjectId(schoolId as string) };
    if (req.query.date) {
      const d = new Date(req.query.date as string);
      query.date = { 
        $gte: new Date(d.setHours(0,0,0,0)), 
        $lt: new Date(d.setHours(23,59,59,999)) 
      };
    }

    const assignments = await SubstituteAssignment.find(query)
      .populate('absentTeacherId', 'firstName lastName')
      .populate('substituteTeacherId', 'firstName lastName')
      .populate('classId', 'name')
      .populate('subjectId', 'name')
      .sort({ date: -1 });

    return sendResponse(res, 200, 'Substitute assignments retrieved successfully', assignments);
  } catch (error: any) {
    return sendResponse(res, 500, 'Failed to list substitute assignments', { error: error.message });
  }
}

export async function getMyAssignments(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    if (!schoolId || !userId) return sendResponse(res, 400, 'Context required', null);

    // Find the employee profile associated with the user
    const employee = await Employee.findOne({ 
      schoolId: new Types.ObjectId(schoolId as string), 
      userId: new Types.ObjectId(userId as string) 
    });

    // Query assignments where this user is either the substitute teacher
    const query = {
      schoolId: new Types.ObjectId(schoolId as string),
      $or: [
        { substituteTeacherId: new Types.ObjectId(userId as string) },
        ...(employee ? [{ substituteTeacherId: employee._id }] : [])
      ]
    };

    const assignments = await SubstituteAssignment.find(query)
      .populate('absentTeacherId', 'firstName lastName')
      .populate('substituteTeacherId', 'firstName lastName')
      .populate('classId', 'name')
      .populate('subjectId', 'name')
      .sort({ date: -1 });

    return sendResponse(res, 200, 'My substitute assignments retrieved successfully', assignments);
  } catch (error: any) {
    return sendResponse(res, 500, 'Failed to retrieve my assignments', { error: error.message });
  }
}
