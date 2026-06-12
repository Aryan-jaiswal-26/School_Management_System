import { Request, Response } from 'express';
import { DisciplineRecord } from '../models/DisciplineRecord.js';
import { sendResponse } from '../utils/response.js';
import { Types } from 'mongoose';

export async function createRecord(req: Request, res: Response) {
  const schoolId = req.user?.schoolId || req.body.schoolId;
  const reportedBy = (req.user as any)?.id || (req.user as any)?._id;
  
  const record = await DisciplineRecord.create({
    ...req.body,
    schoolId,
    reportedBy,
    createdBy: reportedBy
  });
  
  return sendResponse(res, 201, 'Discipline record created', record);
}
export async function getAllRecords(req: Request, res: Response) {
  const schoolId = req.user?.schoolId || req.query.schoolId;
  
  const records = await DisciplineRecord.find({ schoolId: new Types.ObjectId(schoolId as string) })
    .populate('reportedBy', 'firstName lastName')
    .sort({ incidentDate: -1 });
    
  return sendResponse(res, 200, 'All records retrieved', records);
}

export async function getStudentRecords(req: Request, res: Response) {
  const { studentId } = req.params;
  const schoolId = req.user?.schoolId || req.query.schoolId;
  
  const records = await DisciplineRecord.find({ 
    schoolId: new Types.ObjectId(schoolId as string), 
    studentId: new Types.ObjectId(studentId as string) 
  })
    .populate('reportedBy', 'firstName lastName')
    .sort({ incidentDate: -1 });
    
  return sendResponse(res, 200, 'Records retrieved', records);
}

export async function updateRecord(req: Request, res: Response) {
  const { id } = req.params;
  const schoolId = req.user?.schoolId || req.body.schoolId;
  
  const record = await DisciplineRecord.findOneAndUpdate(
    { _id: new Types.ObjectId(id as string), schoolId: new Types.ObjectId(schoolId as string) },
    { ...req.body, updatedBy: (req.user as any)?.id || (req.user as any)?._id },
    { new: true }
  );
  
  if (!record) {
    return sendResponse(res, 404, 'Record not found', null);
  }
  
  return sendResponse(res, 200, 'Record updated', record);
}
