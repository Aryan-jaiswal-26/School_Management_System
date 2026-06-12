import type { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { sendResponse } from '../utils/response.js';
import { Student } from '../models/Student.js';
import { Employee } from '../models/Employee.js';
import { Attendance } from '../models/Attendance.js';
import { Payment } from '../models/Payment.js';
import { Result } from '../models/Result.js';
import { Timetable } from '../models/Timetable.js';
import { Homework } from '../models/Homework.js';
import { HomeworkSubmission } from '../models/HomeworkSubmission.js';
import { Notification } from '../models/Notification.js';
import { Fee } from '../models/Fee.js';
import { AuditLog } from '../models/AuditLog.js';
import { HostelRoom } from '../models/HostelRoom.js';
import { BookCirculation } from '../models/BookCirculation.js';
import { TransportRoute } from '../models/TransportRoute.js';

export class AnalyticsController {
  static async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const sId = new Types.ObjectId(schoolId as string);

      // Core metrics
      const totalStudents = await Student.countDocuments({ schoolId: sId, isActive: true, isDeleted: { $ne: true } });
      const totalTeachers = await Employee.countDocuments({ schoolId: sId, employeeType: 'TEACHING' });
      const totalEmployees = await Employee.countDocuments({ schoolId: sId });

      // Calculate attendance average (for last 30 days or all time)
      const attendanceRecords = await Attendance.find({ schoolId: sId });
      let presentCount = 0;
      let totalAttendance = 0;
      for (const record of attendanceRecords) {
        totalAttendance++;
        if (record.status === 'PRESENT') presentCount++;
      }
      const avgAttendance = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

      // Calculate academic average
      const results = await Result.find({ schoolId: sId });
      let totalMarks = 0;
      let maxMarksSum = 0;
      for (const result of results) {
        if (result.marksObtained != null && result.maxMarks != null) {
          totalMarks += result.marksObtained;
          maxMarksSum += result.maxMarks;
        }
      }
      const academicAvg = maxMarksSum > 0 ? (totalMarks / maxMarksSum) * 100 : 0;

      // Fee Collection metrics
      const fees = await Fee.find({ schoolId: sId });
      const collectedFees = fees.reduce((acc, f) => acc + (f.paidAmount || 0), 0);
      const totalFeesAmount = fees.reduce((acc, f) => acc + (f.amount || 0), 0);
      
      const pendingDues = fees.reduce((acc, f) => {
        if (f.status === 'PAID') return acc;
        return acc + Math.max(0, (f.amount || 0) - (f.paidAmount || 0) - (f.discountAmount || 0));
      }, 0);

      const pendingDuesStudentsList = await Fee.distinct('studentId', { schoolId: sId, status: { $in: ['PENDING', 'PARTIAL', 'OVERDUE'] } });
      const pendingDuesStudentsCount = pendingDuesStudentsList.length;

      const feeTarget = totalFeesAmount || 1000000;
      const feeCollectionPct = feeTarget > 0 ? (collectedFees / feeTarget) * 100 : 0;

      // Grade-wise Performance
      const resultsForAdmin = await Result.find({ schoolId: sId }).populate({ path: 'studentId', populate: { path: 'classId', select: 'name' } });
      const gradeMap = new Map();
      resultsForAdmin.forEach((r: any) => {
        if (r.studentId && r.studentId.classId && r.marksObtained != null && r.maxMarks != null) {
          const clsName = r.studentId.classId.name;
          if (!gradeMap.has(clsName)) gradeMap.set(clsName, { total: 0, max: 0 });
          gradeMap.get(clsName).total += r.marksObtained;
          gradeMap.get(clsName).max += r.maxMarks;
        }
      });
      const gradePerf: any[] = [];
      gradeMap.forEach((val, cls) => {
        if (val.max > 0) {
          gradePerf.push({ g: cls, avg: Math.round((val.total / val.max) * 100) });
        }
      });

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

        // Count total students enrolled up to the end of this month
        const studentsCount = await Student.countDocuments({
          schoolId: sId,
          isActive: true,
          isDeleted: { $ne: true },
          createdAt: { $lte: endOfMonth }
        });

        // Sum fees collected in this month
        const paymentsInMonth = await Payment.find({
          schoolId: sId,
          status: 'SUCCESS',
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });
        const feesSum = paymentsInMonth.reduce((acc, p) => acc + (p.amountPaid || 0), 0);

        // Count admissions for the dashboard line chart from live student records.
        const newAdmissions = await Student.countDocuments({
          schoolId: sId,
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

      // Staff Distribution
      const employees = await Employee.find({ schoolId: sId });
      let teaching = 0, admin = 0, support = 0, other = 0;
      for (const emp of employees) {
        const dep = emp.department?.toLowerCase() || '';
        if (dep.includes('teach') || dep.includes('academic') || emp.employeeType === 'TEACHING') teaching++;
        else if (dep.includes('admin') || dep.includes('hr')) admin++;
        else if (dep.includes('support') || dep.includes('maintenance')) support++;
        else other++;
      }
      const totalStaff = employees.length;
      const deptDist = totalStaff > 0
        ? [
            { name: "Teaching", value: Math.round((teaching / totalStaff) * 100), color: "oklch(0.55 0.13 255)" },
            { name: "Admin", value: Math.round((admin / totalStaff) * 100), color: "oklch(0.65 0.15 155)" },
            { name: "Support", value: Math.round((support / totalStaff) * 100), color: "oklch(0.75 0.15 75)" },
            { name: "Other", value: Math.round((other / totalStaff) * 100), color: "oklch(0.58 0.22 27)" },
          ]
        : [
            { name: "Teaching", value: 0, color: "oklch(0.55 0.13 255)" },
            { name: "Admin", value: 0, color: "oklch(0.65 0.15 155)" },
            { name: "Support", value: 0, color: "oklch(0.75 0.15 75)" },
            { name: "Other", value: 0, color: "oklch(0.58 0.22 27)" },
          ];

      // Key Metrics
      const studentTeacherRatio = totalTeachers > 0 ? `${Math.round(totalStudents / totalTeachers)}:1` : "0:1";
      const studentTeacherBar = totalTeachers > 0 ? Math.min(100, Math.round((totalStudents / totalTeachers) * 5)) : 0;

      // Compute enrollment growth over the last 30 days
      const start30 = new Date(now);
      start30.setDate(now.getDate() - 30);
      const start60 = new Date(now);
      start60.setDate(now.getDate() - 60);
      const recentEnroll = await Student.countDocuments({ schoolId: sId, createdAt: { $gte: start30 } });
      const prevEnroll = await Student.countDocuments({ schoolId: sId, createdAt: { $gte: start60, $lt: start30 } });
      const enrollmentGrowth = prevEnroll > 0 ? ((recentEnroll - prevEnroll) / prevEnroll) * 100 : recentEnroll * 100;
      const enrollmentGrowthStr = (enrollmentGrowth >= 0 ? "+" : "-") + Math.abs(enrollmentGrowth).toFixed(1) + "%";

      // Fee status pie chart stats: collected, pending, overdue
      const collectedCount = await Fee.countDocuments({ schoolId: sId, status: 'PAID' });
      const pendingCount = await Fee.countDocuments({ schoolId: sId, status: { $in: ['PENDING', 'PARTIAL'] } });
      const overdueCount = await Fee.countDocuments({ schoolId: sId, status: 'OVERDUE' });
      const totalFeeRecords = collectedCount + pendingCount + overdueCount || 1;
      
      const feeData = totalFeeRecords > 0
        ? [
            { name: "Collected", value: Math.round((collectedCount / totalFeeRecords) * 100), color: "oklch(0.55 0.15 155)" },
            { name: "Pending", value: Math.round((pendingCount / totalFeeRecords) * 100), color: "oklch(0.75 0.15 75)" },
            { name: "Overdue", value: Math.round((overdueCount / totalFeeRecords) * 100), color: "oklch(0.58 0.22 27)" },
          ]
        : [];

      // Weekly attendance
      const attendanceData: any[] = [];
      const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
        
        const present = await Attendance.countDocuments({ schoolId: sId, status: 'PRESENT', date: { $gte: startOfDay, $lte: endOfDay } });
        const total = await Attendance.countDocuments({ schoolId: sId, date: { $gte: startOfDay, $lte: endOfDay } });
        const pct = total > 0 ? Math.round((present / total) * 100) : 0;
        
        attendanceData.push({
          day: daysOfWeek[d.getDay()],
          present: pct
        });
      }

      // Hostel occupancy
      const rooms = await HostelRoom.find({ schoolId: sId });
      let totalCapacity = 0;
      let occupiedCount = 0;
      for (const room of rooms) {
        totalCapacity += room.capacity || 0;
        occupiedCount += room.occupied || 0;
      }
      const hostelOccupancy = totalCapacity > 0 ? Math.round((occupiedCount / totalCapacity) * 100) : 0;

      // Library books out
      const libraryBooksOut = await BookCirculation.countDocuments({ schoolId: sId, status: { $in: ['issued', 'overdue'] } });

      // Buses on route
      const totalRoutes = await TransportRoute.countDocuments({ schoolId: sId });
      const activeRoutes = await TransportRoute.countDocuments({ schoolId: sId, tripActive: true });

      // Recent Activity
      const activities = await AuditLog.find({ schoolId: sId })
        .populate('userId', 'name')
        .sort({ createdAt: -1 })
        .limit(5);

      const recentActivity = activities.map(act => {
        let text = `${act.action} in ${act.module}`;
        if (act.userId && (act.userId as any).name) {
          text = `${(act.userId as any).name} performed ${act.action.toLowerCase()} in ${act.module.toLowerCase()}`;
        }
        
        // Humanize common activities
        if (act.action === 'CREATE' && act.module === 'STUDENT') {
          text = `New student profile registered`;
        } else if (act.action === 'CREATE' && act.module === 'PAYMENT') {
          text = `Fee collection transaction recorded`;
        } else if (act.action === 'UPDATE' && act.module === 'LEAVE') {
          text = `Employee leave status updated`;
        }

        // Relative time helper
        const diffMs = now.getTime() - act.createdAt.getTime();
        const diffMin = Math.round(diffMs / 60000);
        let timeStr = `${diffMin}m ago`;
        if (diffMin >= 60) {
          const diffHr = Math.round(diffMin / 60);
          timeStr = `${diffHr}h ago`;
          if (diffHr >= 24) {
            timeStr = `${Math.round(diffHr / 24)}d ago`;
          }
        }

        return {
          tag: act.module,
          text,
          time: timeStr
        };
      });

      const finalActivity = recentActivity;

      const data = {
        totalStudents,
        totalStaff: totalEmployees,
        collectedFees: Math.round(collectedFees),
        pendingDues: Math.round(pendingDues),
        pendingDuesStudentsCount,
        hostelOccupancy,
        libraryBooksOut,
        busesOnRoute: `${activeRoutes} / ${totalRoutes}`,
        core: {
          enrollmentGrowth: enrollmentGrowthStr,
          avgAttendance: avgAttendance.toFixed(1) + "%",
          academicAvg: academicAvg.toFixed(1) + "%",
          feeCollection: feeCollectionPct.toFixed(0) + "%"
        },
        gradePerf,
        monthly,
        deptDist,
        feeData,
        attendanceData,
        activity: finalActivity,
        keyMetrics: [
          { label: "Student-Teacher Ratio", value: studentTeacherRatio, bar: studentTeacherBar }
        ]
      };

      sendResponse(res, 200, 'Analytics retrieved', data);
    } catch (error) {
      next(error);
    }
  }

  static async getTeacherDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const sId = new Types.ObjectId(schoolId as string);
      const userId = new Types.ObjectId(req.user?.id as string);

      // Find the teacher
      const teacher = await Employee.findOne({ schoolId: sId, userId: userId });
      console.log('DEBUG DASHBOARD: sId =', sId, 'userId =', userId, 'teacher =', teacher);
      const teacherId = teacher ? teacher._id : new Types.ObjectId();

      // Get today's classes from Timetable
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[new Date().getDay()];
      
      const todaysClassesDocs = await Timetable.find({ schoolId: sId, teacherId: teacherId, dayOfWeek: today, isDeleted: false })
        .populate('classId', 'name')
        .populate('subjectId', 'name')
        .sort('startTime');

      // Get all distinct classes this teacher teaches
      const allClasses = await Timetable.find({ schoolId: sId, teacherId: teacherId, isDeleted: false }).distinct('classId');
      console.log('DEBUG DASHBOARD: allClasses =', allClasses);
      
      let totalStudents = 0;
      if (allClasses.length > 0) {
        totalStudents = await Student.countDocuments({ schoolId: sId, classId: { $in: allClasses }, isActive: true, isDeleted: { $ne: true } });
        console.log('DEBUG DASHBOARD: count with allClasses =', totalStudents);
      }
      
      // If no students found in the teacher's assigned classes, fallback to school-wide count
      if (!totalStudents || totalStudents === 0) {
        totalStudents = await Student.countDocuments({ schoolId: sId, isActive: true, isDeleted: { $ne: true } });
        console.log('DEBUG DASHBOARD: fallback count =', totalStudents);
      }
      // Ensure totalStudents is a numeric value
      totalStudents = Number(totalStudents) || 0;

      // Assignments to grade
      const assignmentsCount = await Homework.countDocuments({ schoolId: sId, teacherId: teacherId });

      // Class Performance
      const classPerf: any[] = [];
      const teacherSubjects = await Timetable.find({ schoolId: sId, teacherId: teacherId, isDeleted: false }).distinct('subjectId');
      if (teacherSubjects.length > 0) {
        const results = await Result.find({ schoolId: sId, subjectId: { $in: teacherSubjects } }).populate({ path: 'studentId', populate: { path: 'classId', select: 'name' } });
        const classMap = new Map();
        results.forEach((r: any) => {
          if (r.studentId && r.studentId.classId && r.marksObtained != null && r.maxMarks != null) {
            const clsName = r.studentId.classId.name;
            if (!classMap.has(clsName)) classMap.set(clsName, { total: 0, max: 0 });
            classMap.get(clsName).total += r.marksObtained;
            classMap.get(clsName).max += r.maxMarks;
          }
        });
        classMap.forEach((val, cls) => {
          if (val.max > 0) {
            classPerf.push({ cls, avg: Math.round((val.total / val.max) * 100) });
          }
        });
      }

      let totalAvg = 0;
      if (classPerf.length > 0) {
        const sum = classPerf.reduce((acc, curr) => acc + curr.avg, 0);
        totalAvg = Math.round(sum / classPerf.length);
      }
      const classAvgScore = totalAvg;

      const submissions: any[] = [];
      const hwIds = await Homework.find({ schoolId: sId, teacherId: teacherId }).distinct('_id');
      if (hwIds.length > 0) {
        const subs = await HomeworkSubmission.find({ schoolId: sId, homeworkId: { $in: hwIds } }).populate('homeworkId');
        const hwMap = new Map();
        subs.forEach((sub: any) => {
          if (sub.homeworkId) {
            const hwTitle = sub.homeworkId.title || 'Unknown';
            if (!hwMap.has(hwTitle)) hwMap.set(hwTitle, { on: 0, late: 0 });
            if (sub.status === 'LATE') hwMap.get(hwTitle).late++;
            else hwMap.get(hwTitle).on++;
          }
        });
        hwMap.forEach((val, week) => {
          submissions.push({ week: week.length > 10 ? week.substring(0, 10) + '...' : week, on: val.on, late: val.late });
        });
      }

      const schedule = todaysClassesDocs.map((c: any) => ({
        time: c.startTime,
        cls: c.classId?.name || "Unknown",
        topic: c.subjectId?.name || "Subject",
        room: c.room || "TBD"
      }));

      const notifications = await Notification.find({ schoolId: sId, recipientId: userId }).sort({ createdAt: -1 }).limit(5);
      const inbox = notifications.map((n: any) => ({
        from: "System",
        subject: n.title,
        time: n.createdAt.toLocaleDateString(),
        unread: !n.isRead
      }));

      const data = {
        core: {
          totalStudents: totalStudents || 0,
          todaysClasses: todaysClassesDocs.length || 0,
          assignmentsToGrade: assignmentsCount || 0,
          classAvgScore: `${classAvgScore}%`
        },
        classPerf,
        submissions,
        schedule,
        inbox
      };

      console.log('DEBUG TEACHER DASHBOARD DATA:', data);
sendResponse(res, 200, 'Teacher analytics retrieved', data);
    } catch (error) {
      next(error);
    }
  }
}
