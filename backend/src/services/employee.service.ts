import mongoose, { Types } from 'mongoose';
import { Employee, IEmployee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { EmployeeAttendance } from '../models/EmployeeAttendance.js';
import { LeaveRequest } from '../models/LeaveRequest.js';
import { SalaryRecord } from '../models/SalaryRecord.js';
import { EmployeeDocument } from '../models/EmployeeDocument.js';
import { ApiError } from '../utils/api-error.js';
import { runInTransaction } from '../utils/transaction.js';
import { hashPassword } from '../utils/password.js';
import { resolveSchoolId } from '../utils/school.js';

interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class EmployeeService {
  static async hireEmployee(schoolIdStr: string, data: any): Promise<IEmployee> {
    const schoolId = await resolveSchoolId(schoolIdStr);
    return runInTransaction(async (session) => {
      const employeeId = (data.employeeId || `EMP-${Date.now()}`).trim();
      const existing = await Employee.findOne({ schoolId, employeeId, isDeleted: false }).session(session || null);
      if (existing) {
        throw new ApiError(409, 'Employee ID already exists');
      }

      const userExists = await User.findOne({ email: data.user.email }).session(session || null);
      if (userExists) throw new ApiError(409, 'Email already in use');

      const passwordHash = await hashPassword(data.user.password);
      const newUser = new User({
        schoolId,
        branchId: data.branchId ? new Types.ObjectId(data.branchId) : undefined,
        email: data.user.email,
        passwordHash,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: data.user.role,
        isActive: true
      });
      await newUser.save({ session });

      const employee = new Employee({
        schoolId,
        branchId: data.branchId ? new Types.ObjectId(data.branchId) : undefined,
        userId: newUser._id,
        employeeId,
        employeeType: data.employeeType,
        designation: data.designation,
        qualification: data.qualification,
        joiningDate: data.joiningDate || new Date(),
        basicSalary: data.basicSalary,
        subjects: data.subjects,
        department: data.department,
        profilePhoto: data.profilePhoto,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        mobileNumber: data.mobileNumber,
        alternateMobileNumber: data.alternateMobileNumber,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        bloodGroup: data.bloodGroup,
        experience: data.experience,
        aadhaarNumber: data.aadhaarNumber,
        panNumber: data.panNumber,
        resumeUrl: data.resumeUrl,
        employmentStatus: data.employmentStatus || 'ACTIVE',
        employmentType: data.employmentType,
        workingStartDate: data.workingStartDate,
        workingEndDate: data.workingEndDate,
        contractDuration: data.contractDuration,
        shiftTiming: data.shiftTiming,
        classAssignment: data.classAssignment,
        sectionAssignment: data.sectionAssignment,
        streamAssignment: data.streamAssignment,
        isClassTeacher: Boolean(data.isClassTeacher),
        employeeIdAuto: !data.employeeId,
      });

      await employee.save({ session });
      return employee;
    });
  }

  static async getEmployeeProfile(schoolId: string, id: string): Promise<any> {
    const employee = await Employee.aggregate([
      { $match: { _id: new Types.ObjectId(id), schoolId: new Types.ObjectId(schoolId), isDeleted: false } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $project: { 'user.password': 0 } }
    ]);

    if (!employee || employee.length === 0) {
      throw new ApiError(404, 'Employee not found');
    }

    return employee[0];
  }

  static async listEmployees(schoolId: string, query: any): Promise<PaginationResult<any>> {
    const { page, limit, search, isActive, employeeType, department } = query;
    const match: any = { schoolId: new Types.ObjectId(schoolId), isDeleted: false };

    if (isActive !== undefined) match.isActive = isActive;
    if (employeeType) match.employeeType = employeeType;
    if (department) match.department = department;

    if (query.branchId) {
      match.branchId = new Types.ObjectId(query.branchId as string);
    } else if (query.allowedBranchIds && query.allowedBranchIds.length > 0) {
      match.branchId = { $in: query.allowedBranchIds.map((id: any) => new Types.ObjectId(id)) };
    }
    if (search) {
       match.employeeId = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      { $project: { 'user.password': 0 } },
      { $sort: { 'user.firstName': 1 } }
    ];

    const totalPipeline = [{ $match: match }, { $count: 'count' }];
    const totalResult = await Employee.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].count : 0;

    pipeline.push({ $skip: skip } as any);
    pipeline.push({ $limit: limit } as any);

    const data = await Employee.aggregate(pipeline as any);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async updateEmployee(schoolId: string, id: string, data: any): Promise<IEmployee> {
    const employee = await Employee.findOneAndUpdate(
      { _id: id, schoolId, isDeleted: false },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!employee) throw new ApiError(404, 'Employee not found');
    return employee;
  }

  static async markAttendance(schoolId: string, recordedBy: string, data: any) {
     const operations = data.records.map((record: any) => ({
        updateOne: {
           filter: { 
              schoolId, 
              employeeId: record.employeeId, 
              date: new Date(data.date) 
           },
           update: { 
              $set: { 
                 status: record.status,
                 checkInTime: record.checkInTime,
                 checkOutTime: record.checkOutTime,
                 remarks: record.remarks,
                 recordedBy
              } 
           },
           upsert: true
        }
     }));
     
     return EmployeeAttendance.bulkWrite(operations);
  }

  static async requestLeave(schoolId: string, userId: string, data: any) {
     const employee = await Employee.findOne({ userId, schoolId, isDeleted: false });
     if (!employee) throw new ApiError(404, 'Employee profile not found for user');

     const leave = new LeaveRequest({
        schoolId,
        employeeId: employee._id,
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason
     });
     return leave.save();
  }

  static async reviewLeave(schoolId: string, leaveId: string, approvedBy: string, status: string, rejectionReason?: string) {
     const leave = await LeaveRequest.findOneAndUpdate(
        { _id: leaveId, schoolId },
        { $set: { status, approvedBy, rejectionReason } },
        { new: true }
     );
     if (!leave) throw new ApiError(404, 'Leave request not found');
     return leave;
  }

  static async generateSalary(schoolId: string, data: any) {
     const employee = await Employee.findOne({ _id: data.employeeId, schoolId, isDeleted: false });
     if (!employee) throw new ApiError(404, 'Employee not found');

     const existing = await SalaryRecord.findOne({ schoolId, employeeId: data.employeeId, month: data.month, year: data.year });
     if (existing) throw new ApiError(409, 'Salary already generated for this month');

     const basicPay = employee.basicSalary || 0;
     const allowances = data.allowances || 0;
     const deductions = data.deductions || 0;
     const netSalary = basicPay + allowances - deductions;

     const salary = new SalaryRecord({
        schoolId,
        employeeId: data.employeeId,
        month: data.month,
        year: data.year,
        basicPay,
        allowances,
        deductions,
        netSalary
     });

     return salary.save();
  }

  static async uploadDocument(schoolId: string, employeeId: string, documentType: string, file: Express.Multer.File) {
    const employee = await Employee.findOne({ _id: employeeId, schoolId, isDeleted: false });
    if (!employee) throw new ApiError(404, 'Employee not found');

    const fileUrl = `/uploads/${file.filename}`;

    const document = new EmployeeDocument({
      schoolId,
      employeeId,
      documentType,
      fileUrl,
      originalName: file.originalname
    });

    return document.save();
  }
}
