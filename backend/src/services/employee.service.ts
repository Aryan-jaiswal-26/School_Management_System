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
import { PerformanceReview } from '../models/PerformanceReview.js';
import { Class } from '../models/Class.js';
import { Section } from '../models/Section.js';
import { Subject } from '../models/Subject.js';

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
    const employee = await Employee.findOne({ _id: id, schoolId, isDeleted: false })
      .populate('userId', '-password')
      .populate('subjects')
      .populate('classAssignment')
      .populate('sectionAssignment');

    if (!employee) {
      throw new ApiError(404, 'Employee not found');
    }

    const employeeObj: any = employee.toObject();
    employeeObj.user = employeeObj.userId;
    delete employeeObj.userId;

    // Fetch attendance summary
    const attendanceRecords = await EmployeeAttendance.find({ schoolId, employeeId: employee._id });
    let presentDays = 0;
    let absentDays = 0;
    let leaveDays = 0;
    let halfDayDays = 0;
    let lateDays = 0;

    attendanceRecords.forEach(r => {
      if (r.status === 'PRESENT') presentDays++;
      else if (r.status === 'ABSENT') absentDays++;
      else if (r.status === 'ON_LEAVE') leaveDays++;
      else if (r.status === 'HALF_DAY') halfDayDays++;
      else if (r.status === 'LATE') lateDays++;
    });

    const totalDays = presentDays + absentDays + leaveDays + halfDayDays + lateDays;
    const presentEquivalent = presentDays + lateDays + (halfDayDays * 0.5) + leaveDays;
    const attendancePercent = totalDays > 0 ? Math.round((presentEquivalent / totalDays) * 100) : 100;

    // Fetch leaves summary and history
    const leaveRequests = await LeaveRequest.find({ schoolId, employeeId: employee._id }).sort({ createdAt: -1 });
    const totalLeavesApproved = leaveRequests.filter(l => l.status === 'APPROVED').length;
    const pendingLeaves = leaveRequests.filter(l => l.status === 'PENDING').length;
    const rejectedLeaves = leaveRequests.filter(l => l.status === 'REJECTED').length;

    // Fetch salary history
    const salaryRecords = await SalaryRecord.find({ schoolId, employeeId: employee._id }).sort({ year: -1, month: -1 });
    const lastSalaryGenerated = salaryRecords.length > 0 ? salaryRecords[0] : null;

    // Fetch performance rating
    const performanceReviews = await PerformanceReview.find({ schoolId, teacherId: employeeObj.user?._id || employeeObj.user, status: 'PUBLISHED' }).sort({ reviewDate: -1 });
    const averageRating = performanceReviews.length > 0
      ? Math.round((performanceReviews.reduce((sum, r) => sum + r.rating, 0) / performanceReviews.length) * 10) / 10
      : 0;

    return {
      ...employeeObj,
      stats: {
        attendancePercent,
        presentDays: presentDays + lateDays,
        absentDays,
        leaveDays,
        halfDayDays,
        totalDays,
        totalLeavesApproved,
        pendingLeaves,
        rejectedLeaves,
        currentSalary: employee.basicSalary || 0,
        lastSalaryGenerated,
        averageRating
      },
      leaveHistory: leaveRequests,
      salaryHistory: salaryRecords,
      performanceReviews,
      attendanceHistory: attendanceRecords.sort((a, b) => b.date.getTime() - a.date.getTime())
    };
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
     
     const result = await EmployeeAttendance.bulkWrite(operations);

     // Recalculate statistics for each employee in the records
     for (const record of data.records) {
       const empId = record.employeeId;
       const allRecords = await EmployeeAttendance.find({ schoolId, employeeId: empId });
       
       let presentCount = 0;
       let absentCount = 0;
       let lateCount = 0;
       let halfDayCount = 0;
       let leaveCount = 0;
       let newestDate: Date | null = null;
       
       for (const r of allRecords) {
          if (r.status === 'PRESENT') presentCount++;
          else if (r.status === 'ABSENT') absentCount++;
          else if (r.status === 'LATE') lateCount++;
          else if (r.status === 'HALF_DAY') halfDayCount++;
          else if (r.status === 'ON_LEAVE') leaveCount++;
          
          if (!newestDate || r.date.getTime() > newestDate.getTime()) {
             newestDate = r.date;
          }
       }
       
       const totalDays = presentCount + absentCount + lateCount + halfDayCount + leaveCount;
       const presentEquivalent = presentCount + lateCount + (halfDayCount * 0.5) + leaveCount;
       const attendancePercent = totalDays > 0 ? Math.round((presentEquivalent / totalDays) * 100) : 100;
       
       await Employee.findOneAndUpdate(
          { _id: empId, schoolId },
          { 
             $set: { 
                attendancePercent,
                ...(newestDate ? { lastAttendanceDate: newestDate } : {})
             }
          }
       );
     }

     return result;
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

     if (status.toUpperCase() === 'APPROVED') {
       const emp = await Employee.findById(leave.employeeId);
       if (emp) {
         emp.employmentStatus = 'ON_LEAVE';
         await emp.save();
         
         const start = new Date(leave.startDate);
         const end = new Date(leave.endDate);
         const attendanceOps = [];
         
         for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
           attendanceOps.push({
             updateOne: {
               filter: {
                 schoolId,
                 employeeId: leave.employeeId,
                 date: new Date(d)
               },
               update: {
                 $set: {
                   status: 'ON_LEAVE',
                   recordedBy: new Types.ObjectId(approvedBy)
                 }
               },
               upsert: true
             }
           });
         }
         
         if (attendanceOps.length > 0) {
           await EmployeeAttendance.bulkWrite(attendanceOps);
         }
         
         // Recalculate attendance stats
         const allRecords = await EmployeeAttendance.find({ schoolId, employeeId: leave.employeeId });
         let presentCount = 0;
         let absentCount = 0;
         let lateCount = 0;
         let halfDayCount = 0;
         let leaveCount = 0;
         let newestDate: Date | null = null;
         
         for (const r of allRecords) {
            if (r.status === 'PRESENT') presentCount++;
            else if (r.status === 'ABSENT') absentCount++;
            else if (r.status === 'LATE') lateCount++;
            else if (r.status === 'HALF_DAY') halfDayCount++;
            else if (r.status === 'ON_LEAVE') leaveCount++;
            
            if (!newestDate || r.date.getTime() > newestDate.getTime()) {
               newestDate = r.date;
            }
         }
         
         const totalDays = presentCount + absentCount + lateCount + halfDayCount + leaveCount;
         const presentEquivalent = presentCount + lateCount + (halfDayCount * 0.5) + leaveCount;
         const attendancePercent = totalDays > 0 ? Math.round((presentEquivalent / totalDays) * 100) : 100;
         
         emp.attendancePercent = attendancePercent;
         if (newestDate) emp.lastAttendanceDate = newestDate;
         await emp.save();
       }
     }

     return leave;
  }

  static async generateSalary(schoolId: string, data: any) {
     const employee = await Employee.findOne({ _id: data.employeeId, schoolId, isDeleted: false });
     if (!employee) throw new ApiError(404, 'Employee not found');

     const existing = await SalaryRecord.findOne({ schoolId, employeeId: data.employeeId, month: data.month, year: data.year });
     if (existing) throw new ApiError(409, 'Salary already generated for this month');

     const basicPay = employee.basicSalary || 0;
     
     // Retrieve attendance records for this month & year
     const startDate = new Date(data.year, data.month - 1, 1);
     const endDate = new Date(data.year, data.month, 0, 23, 59, 59, 999);
     
     const attendanceRecords = await EmployeeAttendance.find({
        schoolId,
        employeeId: data.employeeId,
        date: { $gte: startDate, $lte: endDate }
     });
     
     let absentDays = 0;
     let halfDayDays = 0;
     attendanceRecords.forEach(r => {
        if (r.status === 'ABSENT') absentDays++;
        else if (r.status === 'HALF_DAY') halfDayDays++;
     });
     
     const daysInMonth = new Date(data.year, data.month, 0).getDate();
     const dailyRate = basicPay / daysInMonth;
     
     const absentDeduction = absentDays * dailyRate;
     const halfDayDeduction = halfDayDays * 0.5 * dailyRate;
     const attendanceDeductions = Math.round((absentDeduction + halfDayDeduction) * 100) / 100;
     
     const allowances = data.allowances || 0;
     const manualDeductions = data.deductions || 0;
     const totalDeductions = attendanceDeductions + manualDeductions;
     const netSalary = Math.max(0, Math.round((basicPay + allowances - totalDeductions) * 100) / 100);

     const salary = new SalaryRecord({
        schoolId,
        employeeId: data.employeeId,
        month: data.month,
        year: data.year,
        basicPay,
        allowances,
        deductions: totalDeductions,
        netSalary,
        status: 'DRAFT'
     });

     return salary.save();
  }

  static async getDashboardStats(schoolId: string): Promise<any> {
    const totalStaff = await Employee.countDocuments({ schoolId, isDeleted: false });
    
    // Check daily attendance marked for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayAttendance = await EmployeeAttendance.find({
      schoolId,
      date: { $gte: todayStart, $lte: todayEnd }
    });
    
    let presentToday = 0;
    let absentToday = 0;
    todayAttendance.forEach((att) => {
      if (att.status === 'PRESENT' || att.status === 'LATE' || att.status === 'HALF_DAY') {
        presentToday++;
      } else if (att.status === 'ABSENT') {
        absentToday++;
      }
    });
    
    // On Leave is active employees whose long-term employmentStatus is 'ON_LEAVE'
    const onLeave = await Employee.countDocuments({ schoolId, employmentStatus: 'ON_LEAVE', isDeleted: false });
    
    // Monthly Payroll is sum of basicSalary of active staff
    const payrollResult = await Employee.aggregate([
      { $match: { schoolId: new Types.ObjectId(schoolId), isDeleted: false, isActive: true } },
      { $group: { _id: null, total: { $sum: '$basicSalary' } } }
    ]);
    const monthlyPayroll = payrollResult.length > 0 ? payrollResult[0].total : 0;
    
    const pendingLeaveRequests = await LeaveRequest.countDocuments({ schoolId, status: 'PENDING' });
    
    return {
      totalStaff,
      presentToday,
      absentToday,
      onLeave,
      monthlyPayroll,
      pendingLeaveRequests
    };
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
