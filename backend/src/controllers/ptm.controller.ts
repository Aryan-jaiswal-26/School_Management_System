import { Request, Response } from 'express';
import { PTM } from '../models/PTM.js';
import { Employee } from '../models/Employee.js';
import { ApiError } from '../utils/api-error.js';
import { sendResponse } from '../utils/response.js';

export class PTMController {
  static async createMeeting(req: Request, res: Response) {
    const schoolId = req.user?.schoolId || req.body.schoolId;
    
    if (req.user?.role === 'TEACHER') {
      const employee = await Employee.findOne({
        userId: req.user.id,
        schoolId,
        isDeleted: { $ne: true }
      }).select('classAssignment');

      if (!employee) {
        throw new ApiError(403, 'Teacher profile not found');
      }

      const assignedClasses = employee.classAssignment || [];
      const isAssigned = assignedClasses.some((id) => id.toString() === req.body.classId?.toString());

      if (!isAssigned) {
        throw new ApiError(403, 'Access denied: You cannot create a PTM for a class you are not assigned to');
      }
    }

    // Auto generate slots based on start/end time and duration
    const { startTime, endTime, slotDurationMinutes, ...rest } = req.body;
    const slots: any[] = [];
    
    let current = new Date(`1970-01-01T${startTime}:00Z`).getTime();
    const end = new Date(`1970-01-01T${endTime}:00Z`).getTime();
    
    while (current < end) {
      const slotTime = new Date(current).toISOString().substr(11, 5);
      slots.push({ time: slotTime, status: 'AVAILABLE' });
      current += slotDurationMinutes * 60000;
    }

    const ptm = new PTM({
      ...rest,
      schoolId,
      startTime,
      endTime,
      slotDurationMinutes,
      slots,
      teacherId: req.user?.id || req.body.teacherId
    });

    await ptm.save();
    return sendResponse(res, 201, 'PTM created', ptm);
  }

  static async getMeetings(req: Request, res: Response) {
    const schoolId = req.user?.schoolId;
    const match: any = { schoolId };

    if (req.user?.role === 'TEACHER') {
      match.teacherId = req.user.id;
    }

    const ptms = await PTM.find(match)
      .populate('teacherId', 'firstName lastName')
      .populate('classId', 'name')
      .populate('slots.studentId', 'user')
      .populate('slots.parentId', 'firstName lastName')
      .sort({ date: 1 });
    return sendResponse(res, 200, 'PTMs retrieved', ptms);
  }

  static async bookSlot(req: Request, res: Response) {
    const { ptmId, slotId, studentId } = req.body;
    const parentId = req.user?.id;

    const ptm: any = await PTM.findById(ptmId);
    if (!ptm) return sendResponse(res, 404, 'PTM not found', null);

    const slot = ptm.slots.id(slotId);
    if (!slot) return sendResponse(res, 404, 'Slot not found', null);
    if (slot.status !== 'AVAILABLE') return sendResponse(res, 400, 'Slot not available', null);

    slot.status = 'BOOKED';
    slot.parentId = parentId as any;
    slot.studentId = studentId;
    
    await ptm.save();
    return sendResponse(res, 200, 'Slot booked successfully', ptm);
  }
}
