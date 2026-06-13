import { Request, Response } from 'express';
import { DisciplineRecord } from '../models/DisciplineRecord.js';
import { Student } from '../models/Student.js';
import { Employee } from '../models/Employee.js';
import { ApiError } from '../utils/api-error.js';
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
  const schoolId = (req.user?.schoolId || req.query.schoolId || '').toString();
  const match: any = { schoolId: new Types.ObjectId(schoolId) };

  if (req.user?.role === 'TEACHER') {
    const employee = await Employee.findOne({
      userId: new Types.ObjectId((req.user as any).id),
      schoolId: new Types.ObjectId(schoolId),
      isDeleted: { $ne: true }
    }).select('classAssignment');

    if (!employee) {
      throw new ApiError(403, 'Teacher profile not found');
    }

    const assignedClasses = employee.classAssignment || [];

    // Find all students in these classes
    const students = await Student.find({
      schoolId: new Types.ObjectId(schoolId),
      classId: { $in: assignedClasses },
      isDeleted: false
    }).select('_id');

    const studentIds = students.map(s => s._id);

    match.studentId = { $in: studentIds };
  }
  
  const records = await DisciplineRecord.find(match)
    .populate('reportedBy', 'firstName lastName')
    .sort({ incidentDate: -1 });
    
  return sendResponse(res, 200, 'All records retrieved', records);
}

export async function getStudentRecords(req: Request, res: Response) {
  const { studentId } = req.params;
  const schoolId = (req.user?.schoolId || req.query.schoolId || '').toString();

  if (req.user?.role === 'TEACHER') {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new ApiError(404, 'Student not found');
    }

    const employee = await Employee.findOne({
      userId: new Types.ObjectId((req.user as any).id),
      schoolId: new Types.ObjectId(schoolId),
      isDeleted: { $ne: true }
    }).select('classAssignment');

    if (!employee) {
      throw new ApiError(403, 'Teacher profile not found');
    }

    const assignedClasses = employee.classAssignment || [];
    const isAssigned = assignedClasses.some(id => id.toString() === student.classId?.toString());

    if (!isAssigned) {
      throw new ApiError(403, 'Access denied: Student is not in your assigned class');
    }
  }
  
  const records = await DisciplineRecord.find({ 
    schoolId: new Types.ObjectId(schoolId), 
    studentId: new Types.ObjectId(studentId) 
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
