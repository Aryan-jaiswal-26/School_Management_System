import { Request, Response } from 'express';
import { Alumni } from '../models/Alumni.js';
import { sendResponse } from '../utils/response.js';
import { Types } from 'mongoose';

export async function createAlumni(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.body.schoolId;
    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const alumni = new Alumni({
      schoolId: new Types.ObjectId(schoolId as string),
      studentId: new Types.ObjectId(req.body.studentId),
      graduationYear: req.body.graduationYear,
      currentOccupation: req.body.currentOccupation,
      companyOrUniversity: req.body.companyOrUniversity,
      linkedInProfile: req.body.linkedInProfile,
      email: req.body.email,
      phone: req.body.phone,
      address: req.body.address
    });

    await alumni.save();
    return sendResponse(res, 201, 'Alumni record created successfully', alumni);
  } catch (error: any) {
    return sendResponse(res, 500, 'Failed to create alumni record', { error: error.message });
  }
}

export async function listAlumni(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.query.schoolId;
    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const query: any = { schoolId: new Types.ObjectId(schoolId as string), isDeleted: false };
    if (req.query.graduationYear) query.graduationYear = Number(req.query.graduationYear);

    const alumni = await Alumni.find(query).populate({
      path: 'studentId',
      populate: { path: 'userId', select: 'firstName lastName' }
    });

    return sendResponse(res, 200, 'Alumni retrieved successfully', alumni);
  } catch (error: any) {
    return sendResponse(res, 500, 'Failed to retrieve alumni', { error: error.message });
  }
}

export async function updateAlumni(req: Request, res: Response) {
  try {
    const schoolId = req.user?.schoolId || req.body.schoolId;
    if (!schoolId) return sendResponse(res, 400, 'School context required', null);

    const alumni = await Alumni.findOneAndUpdate(
      { _id: new Types.ObjectId(req.params.id), schoolId: new Types.ObjectId(schoolId as string), isDeleted: false },
      { $set: req.body },
      { new: true }
    );

    if (!alumni) return sendResponse(res, 404, 'Alumni record not found', null);
    return sendResponse(res, 200, 'Alumni record updated successfully', alumni);
  } catch (error: any) {
    return sendResponse(res, 500, 'Failed to update alumni record', { error: error.message });
  }
}
