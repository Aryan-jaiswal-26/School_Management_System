import { Types } from 'mongoose';
import { Attendance } from '../models/Attendance.js';
import { EmployeeAttendance } from '../models/EmployeeAttendance.js';

export class AttendanceService {
  static async markStudentAttendanceBulk(schoolId: string, recordedBy: string, data: any) {
    const date = new Date(data.date);
    // Normalize date to midnight
    date.setUTCHours(0, 0, 0, 0);

    const operations = data.records.map((record: any) => ({
      updateOne: {
        filter: { 
          schoolId: new Types.ObjectId(schoolId), 
          branchId: new Types.ObjectId(data.branchId),
          studentId: new Types.ObjectId(record.studentId), 
          date 
        },
        update: { 
          $set: { 
            branchId: new Types.ObjectId(data.branchId),
            classId: new Types.ObjectId(data.classId),
            sectionId: new Types.ObjectId(data.sectionId),
            status: record.status,
            remarks: record.remarks,
            recordedBy: new Types.ObjectId(recordedBy)
          } 
        },
        upsert: true
      }
    }));
    
    return Attendance.bulkWrite(operations);
  }

    /**
     * Returns the attendance status for a given student on the current day.
     * Returns null if no record exists for today.
     */
    static async getTodayAttendanceStatus(schoolId: string, studentId: string) {
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCHours(23, 59, 59, 999);
      const record = await Attendance.findOne({
        schoolId: new Types.ObjectId(schoolId),
        studentId: new Types.ObjectId(studentId),
        date: { $gte: startOfDay, $lte: endOfDay }
      }).select('status');
      return record ? record.status : null;
    }

    static async getDailyStudentStats(schoolId: string, query: any) {
    const match: any = { schoolId: new Types.ObjectId(schoolId) };
    
    if (query.date) {
      const startOfDay = new Date(query.date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCHours(23, 59, 59, 999);
      match.date = { $gte: startOfDay, $lte: endOfDay };
    }
    if (query.classId) match.classId = new Types.ObjectId(query.classId);
    if (query.sectionId) match.sectionId = new Types.ObjectId(query.sectionId);

    const stats = await Attendance.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const result = { PRESENT: 0, ABSENT: 0, LATE: 0, HALF_DAY: 0, total: 0 };
    stats.forEach(s => {
      if (s._id in result) {
        (result as any)[s._id] = s.count;
        result.total += s.count;
      }
    });

    return result;
  }

  static async getMonthlyStudentStats(schoolId: string, studentId: string, month: number, year: number) {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const stats = await Attendance.aggregate([
      { 
        $match: { 
          schoolId: new Types.ObjectId(schoolId),
          studentId: new Types.ObjectId(studentId),
          date: { $gte: startDate, $lte: endDate }
        } 
      },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const result = { PRESENT: 0, ABSENT: 0, LATE: 0, HALF_DAY: 0, total: 0 };
    stats.forEach(s => {
      if (s._id in result) {
        (result as any)[s._id] = s.count;
        result.total += s.count;
      }
    });

    return {
      month,
      year,
      stats
    };
  }

  static async getDailyEmployeeStats(schoolId: string, query: any) {
    const match: any = { 'attendance.schoolId': new Types.ObjectId(schoolId) };
    
    if (query.date) {
      const startOfDay = new Date(query.date);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCHours(23, 59, 59, 999);
      match['attendance.date'] = { $gte: startOfDay, $lte: endOfDay };
    }
    
    if (query.employeeType) match.employeeType = query.employeeType;

    // Join with Employee table to filter by employeeType if needed
    const stats = await EmployeeAttendance.aggregate([
      { $match: { schoolId: new Types.ObjectId(schoolId) } },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      { 
        $project: {
          status: 1,
          date: 1,
          employeeType: '$employee.employeeType',
          schoolId: 1
        }
      },
      // Re-map fields back to attendance prefix for match
      {
         $addFields: {
            attendance: '$$ROOT'
         }
      },
      { $match: match },
      { $group: { _id: '$attendance.status', count: { $sum: 1 } } }
    ]);

    const result = { PRESENT: 0, ABSENT: 0, ON_LEAVE: 0, LATE: 0, HALF_DAY: 0, total: 0 };
    stats.forEach(s => {
      if (s._id in result) {
        (result as any)[s._id] = s.count;
        result.total += s.count;
      }
    });

    return result;
  }

  static async getMonthlyEmployeeStats(schoolId: string, employeeId: string, month: number, year: number) {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const stats = await EmployeeAttendance.aggregate([
      { 
        $match: { 
          schoolId: new Types.ObjectId(schoolId),
          employeeId: new Types.ObjectId(employeeId),
          date: { $gte: startDate, $lte: endDate }
        } 
      },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const result = { PRESENT: 0, ABSENT: 0, ON_LEAVE: 0, LATE: 0, HALF_DAY: 0, total: 0 };
    stats.forEach(s => {
      if (s._id in result) {
        (result as any)[s._id] = s.count;
        result.total += s.count;
      }
    });

    return {
      month,
      year,
      stats: result
    };
  }
}
