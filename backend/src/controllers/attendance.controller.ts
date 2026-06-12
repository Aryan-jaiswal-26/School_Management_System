import type { Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../services/attendance.service.js';
import { sendResponse } from '../utils/response.js';
import { Attendance } from '../models/Attendance.js';
import { Class } from '../models/Class.js';
import { Section } from '../models/Section.js';
import { Student } from '../models/Student.js';
import { User } from '../models/User.js';
import { Types } from 'mongoose';

// Utility helper to get/create class and section
async function getOrCreateClassAndSection(
  schoolId: string | Types.ObjectId,
  gradeName: string,
  sectionName: string,
  userId: string | Types.ObjectId
): Promise<{ classId: Types.ObjectId; sectionId: Types.ObjectId }> {
  const actualSchoolId = schoolId ? new Types.ObjectId(schoolId as string) : new Types.ObjectId("000000000000000000000001");
  const actualUserId = userId ? new Types.ObjectId(userId as string) : new Types.ObjectId("000000000000000000000001");

  let className = gradeName;
  if (!className.toLowerCase().startsWith('grade')) {
    className = `Grade ${className}`;
  }

  let classDoc = await Class.findOne({ schoolId: actualSchoolId, name: className });
  if (!classDoc) {
    classDoc = await Class.findOne({ schoolId: actualSchoolId, name: gradeName });
  }

  if (!classDoc) {
    classDoc = new Class({
      schoolId: actualSchoolId,
      name: className,
      createdBy: actualUserId,
      updatedBy: actualUserId
    });
    await classDoc.save();
  }

  let sectionDoc = await Section.findOne({
    schoolId: actualSchoolId,
    classId: classDoc._id,
    name: sectionName
  });

  if (!sectionDoc) {
    sectionDoc = new Section({
      schoolId: actualSchoolId,
      classId: classDoc._id,
      name: sectionName,
      createdBy: actualUserId,
      updatedBy: actualUserId
    });
    await sectionDoc.save();
  }

  return {
    classId: classDoc._id as Types.ObjectId,
    sectionId: sectionDoc._id as Types.ObjectId
  };
}

export class AttendanceController {
  static async recordAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const userId = req.user?.id || "000000000000000000000001";
      const { session_date, grade, section, student_id, student_name, status, remarks } = req.body;

      const { classId, sectionId } = await getOrCreateClassAndSection(schoolId, grade, section, userId);

      // Map status to backend enums. 'LEAVE' maps to 'HALF_DAY'. All other statuses keep uppercase.
      const backendStatus = status.toUpperCase() === 'LEAVE' ? 'HALF_DAY' : status.toUpperCase();

      const attendanceRecord = await Attendance.findOneAndUpdate(
        {
          schoolId: new Types.ObjectId(schoolId as string),
          studentId: new Types.ObjectId(student_id as string),
          date: new Date(session_date)
        },
        {
          $set: {
            classId,
            sectionId,
            status: backendStatus,
            remarks: remarks || "",
            recordedBy: new Types.ObjectId(userId as string)
          }
        },
        { new: true, upsert: true }
      );

      sendResponse(res, 201, 'Attendance recorded successfully', {
        id: attendanceRecord._id,
        session_date,
        grade,
        section,
        student_id,
        student_name,
        status: backendStatus.toLowerCase(),
        marked_by_name: req.user?.fullName || "System",
        marked_by_id: userId,
        created_at: attendanceRecord.createdAt
      });
    } catch (error) {
      next(error);
    }
  }

  static async recordAttendanceBulk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const userId = req.user?.id || "000000000000000000000001";
      const records = req.body;

      if (!Array.isArray(records)) {
        res.status(400).json({ success: false, message: 'Invalid payload: expected an array' });
        return;
      }

      const results = [];
      for (const rec of records) {
        const { session_date, grade, section, student_id, student_name, status, remarks } = rec;
        const { classId, sectionId } = await getOrCreateClassAndSection(schoolId, grade, section, userId);
        const backendStatus = status.toUpperCase() === 'LEAVE' ? 'HALF_DAY' : status.toUpperCase();
        const attendanceRecord = await Attendance.findOneAndUpdate(
          {
            schoolId: new Types.ObjectId(schoolId as string),
            studentId: new Types.ObjectId(student_id as string),
            date: new Date(session_date)
          },
          {
            $set: {
              classId,
              sectionId,
              status: backendStatus,
              remarks: remarks || "",
              recordedBy: new Types.ObjectId(userId as string)
            }
          },
          { new: true, upsert: true }
        );
        results.push({
          id: attendanceRecord._id,
          session_date,
          grade,
          section,
          student_id,
          student_name,
          status: backendStatus.toLowerCase(),
          marked_by_name: req.user?.fullName || "System",
          marked_by_id: userId,
          created_at: attendanceRecord.createdAt
        });
      }
      sendResponse(res, 201, 'Bulk attendance recorded successfully', results);
    } catch (error) {
      next(error);
    }
  }

  static async getAttendanceRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { date, grade, section } = req.query;

      const match: any = { schoolId: new Types.ObjectId(schoolId as string) };
      if (date) {
        const queryDate = new Date(date as string);
        queryDate.setUTCHours(0, 0, 0, 0);
        match.date = queryDate;
      }

      if (grade) {
        let className = grade as string;
        if (!className.toLowerCase().startsWith('grade')) {
          className = `Grade ${className}`;
        }
        const classDoc = await Class.findOne({ schoolId: new Types.ObjectId(schoolId as string), name: className });
        if (classDoc) match.classId = classDoc._id;
      }

      if (section) {
        const classDocMatch = match.classId ? { classId: match.classId } : {};
        const sectionDoc = await Section.findOne({
          schoolId: new Types.ObjectId(schoolId as string),
          ...classDocMatch,
          name: section as string
        });
        if (sectionDoc) match.sectionId = sectionDoc._id;
      }

      const records = await Attendance.find(match);

      const formattedRecords = [];
      for (const rec of records) {
        const student = await Student.findOne({ userId: rec.studentId });
        const studentUser = student ? await User.findById(student.userId) : await User.findById(rec.studentId);
        const marker = await User.findById(rec.recordedBy);

        const classDoc = await Class.findById(rec.classId);
        const sectionDoc = await Section.findById(rec.sectionId);

        formattedRecords.push({
          id: rec._id,
          session_date: rec.date.toISOString().split('T')[0],
          grade: classDoc ? classDoc.name.replace('Grade ', '') : (grade as string || "10"),
          section: sectionDoc ? sectionDoc.name : (section as string || "A"),
          student_id: rec.studentId.toString(),
          student_name: studentUser ? `${studentUser.firstName} ${studentUser.lastName}`.trim() : "Unknown Student",
          status: rec.status.toLowerCase() === 'half_day' ? 'leave' : rec.status.toLowerCase(),
          marked_by_name: marker ? `${marker.firstName} ${marker.lastName}`.trim() : "System",
          marked_by_id: rec.recordedBy.toString(),
          remarks: rec.remarks || "",
          created_at: rec.createdAt
        });
      }

      sendResponse(res, 200, 'Attendance records retrieved', formattedRecords);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentAttendanceHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const studentId = req.params.studentId;
      const limit = Number(req.query.limit) || 30;

      const records = await Attendance.find({
        schoolId: new Types.ObjectId(schoolId as string),
        studentId: new Types.ObjectId(studentId as string)
      })
      .sort({ date: -1 })
      .limit(limit);

      const formattedRecords = [];
      for (const rec of records) {
        const student = await Student.findOne({ userId: rec.studentId });
        const studentUser = student ? await User.findById(student.userId) : await User.findById(rec.studentId);
        const marker = await User.findById(rec.recordedBy);
        const classDoc = await Class.findById(rec.classId);
        const sectionDoc = await Section.findById(rec.sectionId);

        formattedRecords.push({
          id: rec._id,
          session_date: rec.date.toISOString().split('T')[0],
          grade: classDoc ? classDoc.name.replace('Grade ', '') : "10",
          section: sectionDoc ? sectionDoc.name : "A",
          student_id: rec.studentId.toString(),
          student_name: studentUser ? `${studentUser.firstName} ${studentUser.lastName}`.trim() : "Unknown Student",
          status: rec.status.toLowerCase() === 'half_day' ? 'leave' : rec.status.toLowerCase(),
          marked_by_name: marker ? `${marker.firstName} ${marker.lastName}`.trim() : "System",
          marked_by_id: rec.recordedBy.toString(),
          remarks: rec.remarks || "",
          created_at: rec.createdAt
        });
      }

      sendResponse(res, 200, 'Student attendance history retrieved', formattedRecords);
    } catch (error) {
      next(error);
    }
  }

  static async markStudentAttendanceBulk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const userId = req.user?.id as string;
      const result = await AttendanceService.markStudentAttendanceBulk(schoolId, userId, req.body);
      sendResponse(res, 200, 'Student attendance marked successfully', result);
    } catch (error) {
      next(error);
    }
  }

  static async getDailyStudentStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const stats = await AttendanceService.getDailyStudentStats(schoolId, req.query);
      sendResponse(res, 200, 'Daily student attendance stats retrieved', stats);
    } catch (error) {
      next(error);
    }
  }

  static async getMonthlyStudentStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const studentId = req.params.studentId as string;
      const { month, year } = req.query as any;
      const stats = await AttendanceService.getMonthlyStudentStats(
        schoolId, 
        studentId, 
        Number(month), 
        Number(year)
      );
      sendResponse(res, 200, 'Monthly student attendance stats retrieved', stats);
    } catch (error) {
      next(error);
    }
  }

  static async getDailyEmployeeStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const stats = await AttendanceService.getDailyEmployeeStats(schoolId, req.query);
      sendResponse(res, 200, 'Daily employee attendance stats retrieved', stats);
    } catch (error) {
      next(error);
    }
  }

  static async getMonthlyEmployeeStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId as string;
      const employeeId = req.params.employeeId as string;
      const { month, year } = req.query as any;
      const stats = await AttendanceService.getMonthlyEmployeeStats(
        schoolId, 
        employeeId, 
        Number(month), 
        Number(year)
      );
      sendResponse(res, 200, 'Monthly employee attendance stats retrieved', stats);
    } catch (error) {
      next(error);
    }
  }
}
