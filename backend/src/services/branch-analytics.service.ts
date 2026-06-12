import { Types } from 'mongoose';
import { Student } from '../models/Student.js';
import { Employee } from '../models/Employee.js';
import { Class } from '../models/Class.js';
import { Attendance } from '../models/Attendance.js';
import { Fee } from '../models/Fee.js';
import { Result } from '../models/Result.js';

export class BranchAnalyticsService {
  static async getBranchDashboardStats(schoolId: string, branchId: string) {
    const sId = new Types.ObjectId(schoolId);
    const bId = new Types.ObjectId(branchId);

    // Core metrics
    const totalStudents = await Student.countDocuments({ schoolId: sId, branchId: bId, isActive: true, isDeleted: { $ne: true } });
    const totalTeachers = await Employee.countDocuments({ schoolId: sId, branchId: bId, employeeType: 'TEACHING', isActive: true, isDeleted: { $ne: true } });
    const totalEmployees = await Employee.countDocuments({ schoolId: sId, branchId: bId, isActive: true, isDeleted: { $ne: true } });
    const totalClasses = await Class.countDocuments({ schoolId: sId, branchId: bId, isDeleted: { $ne: true } });

    // Calculate attendance average
    const attendanceRecords = await Attendance.find({ schoolId: sId, branchId: bId });
    let presentCount = 0;
    let totalAttendance = 0;
    for (const record of attendanceRecords) {
      totalAttendance++;
      if (record.status === 'PRESENT') presentCount++;
    }
    const avgAttendance = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

    // Calculate academic average
    // Safe query: check if Result schema has branchId, otherwise filter by results with students belonging to this branch.
    // Let's filter by student's branchId if results don't have it directly.
    const results = await Result.find({ schoolId: sId }).populate({
      path: 'studentId',
      match: { branchId: bId }
    });
    
    let totalMarks = 0;
    let maxMarksSum = 0;
    for (const result of results) {
      if (result.studentId && result.marksObtained != null && result.maxMarks != null) {
        totalMarks += result.marksObtained;
        maxMarksSum += result.maxMarks;
      }
    }
    const academicAvg = maxMarksSum > 0 ? (totalMarks / maxMarksSum) * 100 : 0;

    // Fee Collection metrics
    const fees = await Fee.find({ schoolId: sId, branchId: bId });
    const collectedFees = fees.reduce((acc, f) => acc + (f.paidAmount || 0), 0);
    const totalFeesAmount = fees.reduce((acc, f) => acc + (f.amount || 0), 0);
    
    const pendingDues = fees.reduce((acc, f) => {
      if (f.status === 'PAID') return acc;
      return acc + Math.max(0, (f.amount || 0) - (f.paidAmount || 0) - (f.discountAmount || 0));
    }, 0);

    const pendingDuesStudentsList = await Fee.distinct('studentId', { schoolId: sId, branchId: bId, status: { $in: ['PENDING', 'PARTIAL', 'OVERDUE'] } });
    const pendingDuesStudentsCount = pendingDuesStudentsList.length;

    const feeTarget = totalFeesAmount || 1000000;
    const feeCollectionPct = feeTarget > 0 ? (collectedFees / feeTarget) * 100 : 0;

    // Monthly Trend (Enrollment & Fee Trend) over the last 6 months
    const monthly: any[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const monthName = monthNames[monthIndex];
      const endOfMonth = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
      const startOfMonth = new Date(year, monthIndex, 1, 0, 0, 0, 0);

      // Count total students enrolled in this branch up to the end of this month
      const studentsCount = await Student.countDocuments({
        schoolId: sId,
        branchId: bId,
        isActive: true,
        isDeleted: { $ne: true },
        createdAt: { $lte: endOfMonth }
      });

      // Sum fees collected in this branch in this month
      // Note: Payment model tracks schoolId, let's find payments for fees in this branch
      const paymentsInMonth = await Fee.find({
        schoolId: sId,
        branchId: bId,
        updatedAt: { $gte: startOfMonth, $lte: endOfMonth },
        status: 'PAID'
      });
      const feesSum = paymentsInMonth.reduce((acc, f) => acc + (f.paidAmount || 0), 0);

      // Count admissions
      const newAdmissions = await Student.countDocuments({
        schoolId: sId,
        branchId: bId,
        isActive: true,
        isDeleted: { $ne: true },
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });

      monthly.push({
        month: monthName,
        m: monthName,
        students: studentsCount,
        fees: Math.round(feesSum),
        new: newAdmissions,
        churn: 0
      });
    }

    // Weekly attendance
    const attendanceData: any[] = [];
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      
      const present = await Attendance.countDocuments({ schoolId: sId, branchId: bId, status: 'PRESENT', date: { $gte: startOfDay, $lte: endOfDay } });
      const total = await Attendance.countDocuments({ schoolId: sId, branchId: bId, date: { $gte: startOfDay, $lte: endOfDay } });
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
      
      attendanceData.push({
        day: daysOfWeek[d.getDay()],
        present: pct
      });
    }

    const studentTeacherRatio = totalTeachers > 0 ? `${Math.round(totalStudents / totalTeachers)}:1` : "0:1";
    const studentTeacherBar = totalTeachers > 0 ? Math.min(100, Math.round((totalStudents / totalTeachers) * 5)) : 0;

    return {
      totalStudents,
      totalStaff: totalEmployees,
      totalClasses,
      collectedFees: Math.round(collectedFees),
      pendingDues: Math.round(pendingDues),
      pendingDuesStudentsCount,
      core: {
        enrollmentGrowth: "0.0%",
        avgAttendance: avgAttendance.toFixed(1) + "%",
        academicAvg: academicAvg.toFixed(1) + "%",
        feeCollection: feeCollectionPct.toFixed(0) + "%"
      },
      monthly,
      attendanceData,
      keyMetrics: [
        { label: "Student-Teacher Ratio", value: studentTeacherRatio, bar: studentTeacherBar }
      ]
    };
  }
}
