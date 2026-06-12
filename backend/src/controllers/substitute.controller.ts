import { Request, Response } from 'express';
import { SubstituteAssignment } from '../models/SubstituteAssignment.js';
import { sendResponse } from '../utils/response.js';
import { Types } from 'mongoose';

export async function createAssignment(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.body.schoolId;
    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const assignment = new SubstituteAssignment({
      schoolId: new Types.ObjectId(schoolId as string),
      absentTeacherId: new Types.ObjectId(req.body.absentTeacherId),
      substituteTeacherId: new Types.ObjectId(req.body.substituteTeacherId),
      date: new Date(req.body.date),
      periodOrTime: req.body.periodOrTime,
      classId: new Types.ObjectId(req.body.classId),
      subjectId: new Types.ObjectId(req.body.subjectId),
      notes: req.body.notes
    });

    await assignment.save();
    return sendResponse(res, 201, 'Substitute assigned', assignment);
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
      query.date = { $gte: new Date(d.setHours(0,0,0)), $lt: new Date(d.setHours(23,59,59)) };
    }

    const assignments = await SubstituteAssignment.find(query)
      .populate('absentTeacherId', 'firstName lastName')
      .populate('substituteTeacherId', 'firstName lastName')
      .populate('classId', 'name')
      .populate('subjectId', 'name');

    return sendResponse(res, 200, 'Substitute assignments retrieved', assignments);
  } catch (error: any) {
    return sendResponse(res, 500, 'Failed to list substitute assignments', { error: error.message });
  }
}
