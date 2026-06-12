import type { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { Types } from 'mongoose';

async function getOrCreateEmployee(schoolId: Types.ObjectId, userId: Types.ObjectId) {
  let emp = await Employee.findOne({ schoolId, userId });
  if (!emp) {
    emp = new Employee({
      schoolId,
      userId,
      employeeId: `EMP_${userId.toString().slice(-6).toUpperCase()}`,
      employeeType: 'TEACHING',
      designation: 'Faculty',
      joiningDate: new Date(),
      createdBy: userId,
      updatedBy: userId
    });
    await emp.save();
  }
  return emp;
}

function getDisplayLeaveType(backendType: string): string {
  switch (backendType) {
    case 'SICK':
      return 'Sick Leave';
    case 'CASUAL':
      return 'Casual Leave';
    case 'EARNED':
      return 'Duty Leave';
    case 'MATERNITY':
      return 'Maternity/Paternity Leave';
    default:
      return 'Other Leave';
  }
}

export class HRController {
  static async createLeaveRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const userId = req.user?.id || "000000000000000000000001";
      const { staff_id, staff_name, leave_type, leaveType, start_date, startDate, end_date, endDate, reason } = req.body;

      const sId = new Types.ObjectId(schoolId as string);
      const targetUserId = staff_id ? new Types.ObjectId(staff_id) : new Types.ObjectId(userId as string);

      const employee = await getOrCreateEmployee(sId, targetUserId);

      const lType = leave_type || leaveType || 'CASUAL';
      let backendType: any = lType.toUpperCase().replace(' LEAVE', '').replace('/PATERNITY', '').trim();
      if (backendType === 'DUTY') backendType = 'EARNED';
      if (backendType === 'MATERNITY') backendType = 'MATERNITY';
      if (backendType === 'UNPAID') backendType = 'OTHER';

      const validEnums = ['SICK', 'CASUAL', 'EARNED', 'MATERNITY', 'OTHER'];
      if (!validEnums.includes(backendType)) {
        backendType = 'OTHER';
      }

      const sDate = start_date || startDate;
      const eDate = end_date || endDate;

      // Validate date strings before parsing
      if (!sDate || !eDate) {
        res.status(400).json({ success: false, message: 'Start date and end date are required' });
        return;
      }

      const parsedStartDate = new Date(sDate);
      const parsedEndDate = new Date(eDate);

      if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
        res.status(400).json({ success: false, message: 'Invalid start date or end date format' });
        return;
      }

      const leave = new LeaveRequest({
        schoolId: sId,
        employeeId: employee._id,
        leaveType: backendType,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        reason: reason || '',
        status: 'PENDING',
        createdBy: new Types.ObjectId(userId as string),
        updatedBy: new Types.ObjectId(userId as string)
      });

      await leave.save();

      const userDoc = await User.findById(targetUserId);
      const displayType = getDisplayLeaveType(backendType);

      sendResponse(res, 201, 'Leave request created successfully', {
        id: leave._id.toString(),
        _id: leave._id.toString(),
        staff_id: targetUserId.toString(),
        staffId: targetUserId.toString(),
        staff_name: staff_name || (userDoc ? `${userDoc.firstName} ${userDoc.lastName}`.trim() : "Staff"),
        staffName: staff_name || (userDoc ? `${userDoc.firstName} ${userDoc.lastName}`.trim() : "Staff"),
        leave_type: backendType.toLowerCase(),
        leaveType: displayType,
        type: displayType,
        start_date: sDate,
        startDate: leave.startDate.toISOString(),
        from: leave.startDate.toISOString(),
        end_date: eDate,
        endDate: leave.endDate.toISOString(),
        to: leave.endDate.toISOString(),
        reason: leave.reason,
        status: leave.status.toLowerCase(),
        approved_by: null,
        approvedBy: null,
        created_at: leave.createdAt,
        createdAt: leave.createdAt.toISOString(),
        appliedOn: leave.createdAt.toISOString(),
        updated_at: leave.updatedAt,
        updatedAt: leave.updatedAt.toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLeaveRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { staffId, status } = req.query;

      const sId = new Types.ObjectId(schoolId as string);
      const match: any = { schoolId: sId };

      if (status && typeof status === 'string') {
        match.status = status.toUpperCase();
      }

      if (staffId && typeof staffId === 'string') {
        const employee = await Employee.findOne({ schoolId: sId, userId: new Types.ObjectId(staffId) });
        if (employee) {
          match.employeeId = employee._id;
        } else {
          sendResponse(res, 200, 'Leave requests retrieved', []);
          return;
        }
      }

      const leaves = await LeaveRequest.find(match).sort({ createdAt: -1 });

      const formatted = [];
      for (const leave of leaves) {
        const emp = await Employee.findById(leave.employeeId);
        const userDoc = emp ? await User.findById(emp.userId) : null;
        const approverDoc = leave.approvedBy ? await User.findById(leave.approvedBy) : null;

        const displayType = getDisplayLeaveType(leave.leaveType);

        // Safely parse potentially invalid/unparseable legacy dates
        const startISO = !isNaN(leave.startDate?.getTime()) ? leave.startDate.toISOString() : new Date().toISOString();
        const endISO = !isNaN(leave.endDate?.getTime()) ? leave.endDate.toISOString() : new Date().toISOString();
        const createdISO = !isNaN(leave.createdAt?.getTime()) ? leave.createdAt.toISOString() : new Date().toISOString();
        const updatedISO = !isNaN(leave.updatedAt?.getTime()) ? leave.updatedAt.toISOString() : new Date().toISOString();

        formatted.push({
          id: leave._id.toString(),
          _id: leave._id.toString(),
          staff_id: emp ? emp.userId.toString() : "",
          staffId: emp ? emp.userId.toString() : "",
          staff_name: userDoc ? `${userDoc.firstName} ${userDoc.lastName}`.trim() : "Unknown Staff",
          staffName: userDoc ? `${userDoc.firstName} ${userDoc.lastName}`.trim() : "Unknown Staff",
          leave_type: leave.leaveType.toLowerCase(),
          leaveType: displayType,
          type: displayType,
          start_date: startISO.split('T')[0],
          startDate: startISO,
          from: startISO,
          end_date: endISO.split('T')[0],
          endDate: endISO,
          to: endISO,
          reason: leave.reason,
          status: leave.status.toLowerCase(),
          approved_by: approverDoc ? `${approverDoc.firstName} ${approverDoc.lastName}`.trim() : null,
          approvedBy: approverDoc ? `${approverDoc.firstName} ${approverDoc.lastName}`.trim() : null,
          created_at: leave.createdAt,
          createdAt: createdISO,
          appliedOn: createdISO,
          updated_at: leave.updatedAt,
          updatedAt: updatedISO
        });
      }

      sendResponse(res, 200, 'Leave requests retrieved', formatted);
    } catch (error) {
      next(error);
    }
  }

  static async approveLeaveRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const userId = req.user?.id || "000000000000000000000001";
      const { id } = req.params;
      const { approvedBy } = req.body;

      const sId = new Types.ObjectId(schoolId as string);
      const leave = await LeaveRequest.findOne({ schoolId: sId, _id: new Types.ObjectId(id as string) });

      if (!leave) {
        res.status(404).json({ success: false, message: 'Leave request not found' });
        return;
      }

      leave.status = 'APPROVED';
      leave.approvedBy = new Types.ObjectId(userId as string);
      await leave.save();

      const emp = await Employee.findById(leave.employeeId);
      const userDoc = emp ? await User.findById(emp.userId) : null;
      const approverDoc = await User.findById(leave.approvedBy);

      const displayType = getDisplayLeaveType(leave.leaveType);
      const startISO = !isNaN(leave.startDate?.getTime()) ? leave.startDate.toISOString() : new Date().toISOString();
      const endISO = !isNaN(leave.endDate?.getTime()) ? leave.endDate.toISOString() : new Date().toISOString();
      const createdISO = !isNaN(leave.createdAt?.getTime()) ? leave.createdAt.toISOString() : new Date().toISOString();
      const updatedISO = !isNaN(leave.updatedAt?.getTime()) ? leave.updatedAt.toISOString() : new Date().toISOString();

      sendResponse(res, 200, 'Leave request approved successfully', {
        id: leave._id.toString(),
        _id: leave._id.toString(),
        staff_id: emp ? emp.userId.toString() : "",
        staffId: emp ? emp.userId.toString() : "",
        staff_name: userDoc ? `${userDoc.firstName} ${userDoc.lastName}`.trim() : "Unknown Staff",
        staffName: userDoc ? `${userDoc.firstName} ${userDoc.lastName}`.trim() : "Unknown Staff",
        leave_type: leave.leaveType.toLowerCase(),
        leaveType: displayType,
        type: displayType,
        start_date: startISO.split('T')[0],
        startDate: startISO,
        from: startISO,
        end_date: endISO.split('T')[0],
        endDate: endISO,
        to: endISO,
        reason: leave.reason,
        status: leave.status.toLowerCase(),
        approved_by: approverDoc ? `${approverDoc.firstName} ${approverDoc.lastName}`.trim() : approvedBy || "Admin",
        approvedBy: approverDoc ? `${approverDoc.firstName} ${approverDoc.lastName}`.trim() : approvedBy || "Admin",
        created_at: leave.createdAt,
        createdAt: createdISO,
        appliedOn: createdISO,
        updated_at: leave.updatedAt,
        updatedAt: updatedISO
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateLeaveStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const userId = req.user?.id || "000000000000000000000001";
      const { id } = req.params;
      const { status, rejectionReason } = req.body;

      const sId = new Types.ObjectId(schoolId as string);
      const leave = await LeaveRequest.findOne({ schoolId: sId, _id: new Types.ObjectId(id as string) });

      if (!leave) {
        res.status(404).json({ success: false, message: 'Leave request not found' });
        return;
      }

      const upperStatus = (status || 'PENDING').toUpperCase();
      if (upperStatus === 'APPROVED') {
        leave.status = 'APPROVED';
        leave.approvedBy = new Types.ObjectId(userId as string);
      } else if (upperStatus === 'REJECTED') {
        leave.status = 'REJECTED';
        leave.rejectionReason = rejectionReason || '';
      } else {
        leave.status = 'PENDING';
      }

      await leave.save();

      const emp = await Employee.findById(leave.employeeId);
      const userDoc = emp ? await User.findById(emp.userId) : null;
      const approverDoc = leave.approvedBy ? await User.findById(leave.approvedBy) : null;

      const displayType = getDisplayLeaveType(leave.leaveType);
      const startISO = !isNaN(leave.startDate?.getTime()) ? leave.startDate.toISOString() : new Date().toISOString();
      const endISO = !isNaN(leave.endDate?.getTime()) ? leave.endDate.toISOString() : new Date().toISOString();
      const createdISO = !isNaN(leave.createdAt?.getTime()) ? leave.createdAt.toISOString() : new Date().toISOString();
      const updatedISO = !isNaN(leave.updatedAt?.getTime()) ? leave.updatedAt.toISOString() : new Date().toISOString();

      sendResponse(res, 200, 'Leave request updated successfully', {
        id: leave._id.toString(),
        _id: leave._id.toString(),
        staff_id: emp ? emp.userId.toString() : "",
        staffId: emp ? emp.userId.toString() : "",
        staff_name: userDoc ? `${userDoc.firstName} ${userDoc.lastName}`.trim() : "Unknown Staff",
        staffName: userDoc ? `${userDoc.firstName} ${userDoc.lastName}`.trim() : "Unknown Staff",
        leave_type: leave.leaveType.toLowerCase(),
        leaveType: displayType,
        type: displayType,
        start_date: startISO.split('T')[0],
        startDate: startISO,
        from: startISO,
        end_date: endISO.split('T')[0],
        endDate: endISO,
        to: endISO,
        reason: leave.reason,
        status: leave.status.toLowerCase(),
        approved_by: approverDoc ? `${approverDoc.firstName} ${approverDoc.lastName}`.trim() : null,
        approvedBy: approverDoc ? `${approverDoc.firstName} ${approverDoc.lastName}`.trim() : null,
        created_at: leave.createdAt,
        createdAt: createdISO,
        appliedOn: createdISO,
        updated_at: leave.updatedAt,
        updatedAt: updatedISO
      });
    } catch (error) {
      next(error);
    }
  }
}
