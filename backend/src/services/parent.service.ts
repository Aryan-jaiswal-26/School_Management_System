import { Types } from 'mongoose';
import { Parent } from '../models/Parent.js';
import { Student } from '../models/Student.js';
import { User } from '../models/User.js';
import { Attendance } from '../models/Attendance.js';
import { Fee } from '../models/Fee.js';
import { Payment } from '../models/Payment.js';
import { TransportRoute } from '../models/TransportRoute.js';
import { TransportTripLog } from '../models/TransportTripLog.js';
import { Timetable } from '../models/Timetable.js';
import { Exam } from '../models/Exam.js';
import { Result } from '../models/Result.js';
import { Homework } from '../models/Homework.js';
import { HomeworkSubmission } from '../models/HomeworkSubmission.js';
import { Announcement } from '../models/Announcement.js';
import { MessMenu, RFIDTransaction, RFIDWallet } from '../models/Canteen.js';
import { StudentLeaveRequest } from '../models/StudentLeaveRequest.js';
import { ParentPreference } from '../models/ParentPreference.js';
import { ParentCommunityPost } from '../models/ParentCommunityPost.js';
import { ParentFeedback } from '../models/ParentFeedback.js';
import { StudentMedicalProfile, ClinicVisitLog } from '../models/HealthManagement.js';

// â”€â”€â”€ Helper: resolve parent â†’ children â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function getParentAndChildren(userId: string) {
  const parent = await Parent.findOne({ userId: new Types.ObjectId(userId) });
  if (!parent) throw new Error('Parent profile not found');

  const students = await Student.find({
    parentIds: parent._id,
    isActive: true,
    isDeleted: { $ne: true },
  })
    .populate('userId', 'firstName lastName email profilePicture')
    .populate('classId', 'name')
    .populate('sectionId', 'name');

  return { parent, students };
}

function formatStudentName(student: any): string {
  return student?.userId ? `${student.userId.firstName} ${student.userId.lastName}` : 'Student';
}

function safePercent(numerator: number, denominator: number): string {
  if (!denominator) return '0%';
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export class ParentService {
  // â”€â”€â”€ DASHBOARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  static async getDashboardData(userId: string) {
    const { parent, students } = await getParentAndChildren(userId);
    const parentUser = await User.findById(userId).select('firstName lastName');

    if (!students.length) {
      return {
        parentName: parentUser ? `${parentUser.firstName} ${parentUser.lastName}` : 'Parent',
        children: {},
      };
    }

    const childrenData = await Promise.all(
      students.map(async (student: any) => {
        const studentId = student._id;

        // Attendance %
        const attendanceRecords = await Attendance.find({ studentId }).sort({ date: -1 }).limit(90);
        const total = attendanceRecords.length;
        const present = attendanceRecords.filter((record) => ['PRESENT', 'LATE'].includes(record.status)).length;
        const attendance = safePercent(present, total);
        const monthlyAttendance = Array.from(
          attendanceRecords.reduce((map, record: any) => {
            const key = new Date(record.date || record.createdAt).toLocaleString('en-US', { month: 'short', year: 'numeric' });
            if (!map.has(key)) {
              map.set(key, { label: key, present: 0, total: 0 });
            }
            const bucket = map.get(key)!;
            bucket.total += 1;
            if (['PRESENT', 'LATE'].includes(record.status)) {
              bucket.present += 1;
            }
            return map;
          }, new Map<string, { label: string; present: number; total: number }>()),
        ).map(([_, value]) => ({
          ...value,
          percentage: safePercent(value.present, value.total),
        }));

        // Average score
        const results = await Result.find({ studentId });
        let totalMarks = 0, maxMarks = 0;
        results.forEach((r: any) => {
          if (r.marksObtained != null && r.maxMarks != null) {
            totalMarks += r.marksObtained;
            maxMarks += r.maxMarks;
          }
        });
        const avgScore = maxMarks > 0 ? `${Math.round((totalMarks / maxMarks) * 100)}%` : 'â€”';

        const publishedExams = await Exam.find({
          classId: student.classId,
          status: { $in: ['UPCOMING', 'ONGOING', 'COMPLETED', 'PUBLISHED'] },
        })
          .sort({ startDate: 1 })
          .limit(8);

        const examSchedule = publishedExams.map((exam: any) => ({
          id: exam._id.toString(),
          name: exam.name,
          startDate: exam.startDate,
          endDate: exam.endDate,
          subject: exam.subject || '',
          room: exam.room || 'â€”',
          status: exam.status,
        }));

        const submissions = await HomeworkSubmission.find({ studentId }).select('homeworkId status marks remarks submittedAt');
        const submissionMap = new Map(submissions.map((submission: any) => [submission.homeworkId.toString(), submission]));

        // Fee due
        const fees = await Fee.find({ studentId, status: { $ne: 'PAID' } });
        const totalDue = fees.reduce((s: number, f: any) => s + ((f.amount || 0) - (f.paidAmount || 0)), 0);

        // Today's timetable
        const timetable = await Timetable.find({
          classId: student.classId,
          sectionId: student.sectionId,
          isDeleted: false,
        })
          .populate('subjectId', 'name')
          .populate('teacherId', 'firstName lastName')
          .limit(6);

        const todayClasses = timetable.map((t: any) => ({
          time: `${t.startTime || 'â€”'} - ${t.endTime || 'â€”'}`,
          subject: t.subjectId?.name || 'Subject',
          room: t.roomId || 'Classroom',
          teacher: t.teacherId ? `${t.teacherId.firstName} ${t.teacherId.lastName}` : 'Teacher',
        }));

        // Upcoming homework
        const homeworks = await Homework.find({
          classId: student.classId,
          sectionId: student.sectionId,
          dueDate: { $gte: new Date() },
        })
          .populate('subjectId', 'name')
          .limit(3);

        const upcomingHomeworks = homeworks.map((hw: any) => ({
          subject: hw.subjectId?.name || 'Subject',
          title: hw.title,
          due: new Date(hw.dueDate).toLocaleDateString(),
          status: submissionMap.has(hw._id.toString()) ? submissionMap.get(hw._id.toString())?.status : 'PENDING',
          submittedAt: submissionMap.get(hw._id.toString())?.submittedAt,
        }));

        const gradeInfo =
          student.classId && student.sectionId
            ? `Grade ${(student.classId as any).name} · ${(student.sectionId as any).name}`
            : 'Grade N/A';

        // Transport route status
        const transportRoute = await TransportRoute.findOne({ schoolId: student.schoolId });
        let busTime = 'Not assigned';
        if (transportRoute) {
          if (transportRoute.tripActive) {
            busTime = 'In transit';
          } else {
            busTime = 'Scheduled';
          }
        }

        // Canteen & Meal Menu
        const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const menu = await MessMenu.findOne({ schoolId: student.schoolId, day });
        const medicalProfile = await StudentMedicalProfile.findOne({ studentId });
        const restriction = (medicalProfile?.restrictedFoods && medicalProfile.restrictedFoods.length > 0)
          ? medicalProfile.restrictedFoods.join(', ')
          : 'None';
        const canteenMenu = {
          lunch: menu?.lunch || 'Check canteen board',
          restriction
        };

        // Health Record
        const lastVisitLog = await ClinicVisitLog.findOne({ studentId }).sort({ visitDate: -1 });
        let lastVisit = 'No recent infirmary visits';
        if (lastVisitLog) {
          const dateStr = new Date(lastVisitLog.visitDate).toLocaleDateString();
          lastVisit = `${dateStr} - ${lastVisitLog.symptoms}${lastVisitLog.diagnosis ? ` (${lastVisitLog.diagnosis})` : ''}`;
        }
        const healthRecord = {
          blood: medicalProfile?.bloodGroup || student.bloodGroup || '—',
          allergy: (medicalProfile?.allergies && medicalProfile.allergies.length > 0)
            ? medicalProfile.allergies.join(', ')
            : '—',
          lastVisit,
        };

        return {
          id: studentId.toString(),
          name: student.userId
            ? `${(student.userId as any).firstName} ${(student.userId as any).lastName}`
            : 'Student',
          grade: gradeInfo,
          className: (student.classId as any)?.name || '',
          rollNo: student.rollNumber || student.admissionNumber,
          attendance,
          avgScore,
          feeDue: totalDue > 0 ? `₹${totalDue.toLocaleString()}` : '₹0',
          busTime,
          todayClasses,
          homeworks: upcomingHomeworks,
          attendanceMonthly: monthlyAttendance,
          examSchedule,
          resultsSummary: results.slice(0, 5).map((result: any) => ({
            subject: result.subjectId?.name || 'Subject',
            exam: result.examId?.name || result.examId?.term || 'Assessment',
            marksObtained: result.marksObtained,
            maxMarks: result.maxMarks,
            percentage: result.maxMarks ? `${Math.round((result.marksObtained / result.maxMarks) * 100)}%` : '—',
          })),
          certificates: [
            attendance === '100%' ? 'Perfect Attendance' : null,
            avgScore !== '—' && Number(avgScore.replace('%', '')) >= 85 ? 'Academic Excellence' : null,
          ].filter(Boolean),
          behaviorRecords: [],
          canteenMenu,
          healthRecord,
        };
      })
    );

    // Key children by their _id string so frontend can use real IDs
    const children: Record<string, any> = {};
    childrenData.forEach((c) => { children[c.id] = c; });

    return {
      parentName: parentUser ? `${parentUser.firstName} ${parentUser.lastName}` : 'Parent',
      children,
    };
  }

  // â”€â”€â”€ PARENT PROFILE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  static async getProfile(userId: string) {
    const parent = await Parent.findOne({ userId: new Types.ObjectId(userId) });
    const user = await User.findById(userId).select('firstName lastName email phone profilePicture');
    const children = await Student.find({
      parentIds: parent?._id,
      isActive: true,
      isDeleted: { $ne: true },
    }).populate('userId', 'firstName lastName');
    return { parent, user, children };
  }

  // â”€â”€â”€ CHILD: ACADEMICS (CGPA, rank, class info) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  static async getChildContacts(userId: string, studentId: string) {
    const { parent } = await getParentAndChildren(userId);
    const student = await Student.findOne({ _id: studentId, parentIds: parent._id })
      .populate('classId', 'name')
      .populate('sectionId', 'name');
    if (!student) throw new Error('Student not found or not linked to this parent');

    const submissions = await HomeworkSubmission.find({ studentId: student._id }).select('homeworkId status marks remarks submittedAt');
    const submissionMap = new Map(submissions.map((submission: any) => [submission.homeworkId.toString(), submission]));

    const timetable = await Timetable.find({
      classId: student.classId,
      sectionId: student.sectionId,
      isDeleted: false,
    })
      .populate('teacherId', 'firstName lastName email phone profilePicture role')
      .populate('subjectId', 'name')
      .limit(10);

    const contacts = new Map<string, any>();
    timetable.forEach((entry: any) => {
      const teacher = entry.teacherId;
      if (!teacher?._id) return;
      contacts.set(teacher._id.toString(), {
        id: teacher._id.toString(),
        teacherId: teacher._id.toString(),
        teacherName: `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'Teacher',
        email: teacher.email || '',
        phone: teacher.phone || '',
        profilePicture: teacher.profilePicture || '',
        subject: entry.subjectId?.name || 'Subject',
        className: `${(student.classId as any)?.name || ''} ${(student.sectionId as any)?.name || ''}`.trim(),
      });
    });

    return Array.from(contacts.values());
  }

  static async submitChildLeave(userId: string, studentId: string, data: any) {
    const { parent } = await getParentAndChildren(userId);
    const student = await Student.findOne({ _id: studentId, parentIds: parent._id });
    if (!student) throw new Error('Student not found or not linked to this parent');

    const submissions = await HomeworkSubmission.find({ studentId: student._id }).select('homeworkId status marks remarks submittedAt');
    const submissionMap = new Map(submissions.map((submission: any) => [submission.homeworkId.toString(), submission]));

    return StudentLeaveRequest.create({
      schoolId: student.schoolId,
      parentId: parent._id,
      studentId: student._id,
      leaveType: data.leaveType || 'PERSONAL',
      startDate: new Date(data.startDate || data.from || new Date()),
      endDate: new Date(data.endDate || data.to || data.startDate || new Date()),
      reason: data.reason || 'Parent requested leave',
      attachmentUrl: data.attachmentUrl,
      createdBy: new Types.ObjectId(userId),
      updatedBy: new Types.ObjectId(userId),
    });
  }

  static async listChildLeaves(userId: string, studentId?: string) {
    const { parent, students } = await getParentAndChildren(userId);
    const studentIds = studentId ? [new Types.ObjectId(studentId)] : students.map((student: any) => student._id);
    return StudentLeaveRequest.find({
      parentId: parent._id,
      studentId: { $in: studentIds },
    }).sort({ createdAt: -1 });
  }

  static async getChildCanteen(userId: string, studentId?: string) {
    const { parent, students } = await getParentAndChildren(userId);
    const resolvedStudentId = studentId ? new Types.ObjectId(studentId) : students[0]?._id;
    if (!resolvedStudentId) {
      return null;
    }

    const isChild = students.some((s) => s._id.toString() === resolvedStudentId.toString());
    if (!isChild) {
      throw new Error('Unauthorized child access');
    }

    const studentObj = students.find((s) => s._id.toString() === resolvedStudentId.toString());

    let wallet = await RFIDWallet.findOne({ studentId: resolvedStudentId });
    if (!wallet) {
      const studentName = studentObj ? formatStudentName(studentObj) : 'Student';
      wallet = await RFIDWallet.create({
        schoolId: parent.schoolId,
        studentId: resolvedStudentId,
        studentName,
        grade: studentObj?.rollNumber || studentObj?.admissionNumber || 'N/A',
        balance: 100.0,
        rfidTag: `RFID-${resolvedStudentId.toString().slice(-6).toUpperCase()}`,
        status: 'Active',
        lowBalanceThreshold: 10,
        createdBy: new Types.ObjectId("000000000000000000000001"),
      });
    }

    const transactions = await RFIDTransaction.find({ rfidTag: wallet.rfidTag }).sort({ timestamp: -1 }).limit(30);

    const day = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const menu = await MessMenu.findOne({ schoolId: parent.schoolId, day });

    return {
      id: wallet._id.toString(),
      studentId: resolvedStudentId.toString(),
      studentName: wallet.studentName,
      grade: wallet.grade,
      balance: wallet.balance,
      status: wallet.status,
      lowBalanceThreshold: wallet.lowBalanceThreshold ?? 10,
      menu: menu ? { breakfast: menu.breakfast, lunch: menu.lunch, snacks: menu.snacks, dinner: menu.dinner } : null,
      transactions: transactions.map(t => ({
        id: t._id.toString(),
        item: t.item,
        type: t.type,
        amount: t.amount,
        timestamp: t.timestamp,
        paymentMethod: t.paymentMethod,
        balanceAfter: t.balanceAfter
      })),
    };
  }

  static async getChildNotificationPreferences(userId: string) {
    const { parent } = await getParentAndChildren(userId);
    let preferences = await ParentPreference.findOne({ parentId: parent._id, userId: new Types.ObjectId(userId) });
    if (!preferences) {
      preferences = await ParentPreference.create({
        schoolId: parent.schoolId,
        parentId: parent._id,
        userId: new Types.ObjectId(userId),
        busAlerts: true,
        examGrades: true,
        feeReminders: true,
        attendance: true,
        newsletters: false,
        preferredLanguages: ['en'],
        channels: ['push', 'email'],
        createdBy: new Types.ObjectId(userId),
        updatedBy: new Types.ObjectId(userId),
      });
    }
    return preferences;
  }

  static async updateChildNotificationPreferences(userId: string, payload: any) {
    const { parent } = await getParentAndChildren(userId);
    return ParentPreference.findOneAndUpdate(
      { parentId: parent._id, userId: new Types.ObjectId(userId) },
      {
        $set: {
          busAlerts: payload.busAlerts ?? true,
          examGrades: payload.examGrades ?? true,
          feeReminders: payload.feeReminders ?? true,
          attendance: payload.attendance ?? true,
          newsletters: payload.newsletters ?? false,
          preferredLanguages: payload.preferredLanguages || ['en'],
          channels: payload.channels || ['push', 'email'],
          updatedBy: new Types.ObjectId(userId),
        },
      },
      { new: true, upsert: true },
    );
  }

  static async listCommunityPosts(userId: string) {
    const { parent } = await getParentAndChildren(userId);
    return ParentCommunityPost.find({ schoolId: parent.schoolId }).sort({ createdAt: -1 }).limit(40);
  }

  static async createCommunityPost(userId: string, payload: any) {
    const { parent } = await getParentAndChildren(userId);
    return ParentCommunityPost.create({
      schoolId: parent.schoolId,
      parentId: parent._id,
      userId: new Types.ObjectId(userId),
      title: payload.title,
      body: payload.body,
      category: payload.category || 'GENERAL',
      anonymous: Boolean(payload.anonymous),
      createdBy: new Types.ObjectId(userId),
      updatedBy: new Types.ObjectId(userId),
    });
  }

  static async submitFeedback(userId: string, payload: any) {
    const { parent } = await getParentAndChildren(userId);
    return ParentFeedback.create({
      schoolId: parent.schoolId,
      parentId: parent._id,
      userId: new Types.ObjectId(userId),
      target: payload.target || 'School',
      rating: Number(payload.rating || 5),
      feedback: payload.feedback || '',
      anonymous: Boolean(payload.anonymous),
      category: payload.category || 'GENERAL',
      createdBy: new Types.ObjectId(userId),
      updatedBy: new Types.ObjectId(userId),
    });
  }

  static async listFeedback(userId: string) {
    const { parent } = await getParentAndChildren(userId);
    return ParentFeedback.find({ schoolId: parent.schoolId }).sort({ createdAt: -1 }).limit(40);
  }

  static async getChildAcademics(userId: string, studentId: string) {
    const { parent } = await getParentAndChildren(userId);
    const student = await Student.findOne({ _id: studentId, parentIds: parent._id })
      .populate('userId', 'firstName lastName')
      .populate('classId', 'name')
      .populate('sectionId', 'name');
    if (!student) throw new Error('Student not found or not linked to this parent');

    const submissions = await HomeworkSubmission.find({ studentId: student._id }).select('homeworkId status marks remarks submittedAt');
    const submissionMap = new Map(submissions.map((submission: any) => [submission.homeworkId.toString(), submission]));

    const results = await Result.find({ studentId: student._id })
      .populate('examId', 'name term')
      .populate('subjectId', 'name');

    let totalMarks = 0, maxMarks = 0;
    results.forEach((r: any) => {
      if (r.marksObtained != null && r.maxMarks != null) {
        totalMarks += r.marksObtained;
        maxMarks += r.maxMarks;
      }
    });
    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
    const cgpa = (percentage / 10).toFixed(1);

    return {
      studentId: student._id,
      studentName: student.userId
        ? `${(student.userId as any).firstName} ${(student.userId as any).lastName}`
        : 'Student',
      grade: `${(student.classId as any)?.name || ''} Â· ${(student.sectionId as any)?.name || ''}`,
      cgpa,
      percentage: `${Math.round(percentage)}%`,
      rank: 'â€”',
      results,
    };
  }

  // â”€â”€â”€ CHILD: HOMEWORK DIARY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  static async getChildHomework(userId: string, studentId: string) {
    const { parent } = await getParentAndChildren(userId);
    const student = await Student.findOne({ _id: studentId, parentIds: parent._id });
    if (!student) throw new Error('Student not found or not linked to this parent');

    const submissions = await HomeworkSubmission.find({ studentId: student._id }).select('homeworkId status marks remarks submittedAt');
    const submissionMap = new Map(submissions.map((submission: any) => [submission.homeworkId.toString(), submission]));

    const homeworks = await Homework.find({
      classId: student.classId,
      sectionId: student.sectionId,
    })
      .populate('subjectId', 'name')
      .populate('teacherId', 'firstName lastName')
      .sort({ dueDate: -1 })
      .limit(20);

    return homeworks.map((hw: any) => ({
      _id: hw._id,
      subject: hw.subjectId?.name || 'Subject',
      subjectName: hw.subjectId?.name || 'Subject',
      title: hw.title,
      description: hw.description,
      dueDate: hw.dueDate,
      assigned: hw.createdAt ? new Date(hw.createdAt).toLocaleDateString() : 'â€”',
      teacher: hw.teacherId ? `${hw.teacherId.firstName} ${hw.teacherId.lastName}` : 'â€”',
      teacherName: hw.teacherId ? `${hw.teacherId.firstName} ${hw.teacherId.lastName}` : 'â€”',
      grade: submissionMap.get(hw._id.toString())?.marks ?? null,
      status: submissionMap.get(hw._id.toString())?.status || 'PENDING',
      feedback: submissionMap.get(hw._id.toString())?.remarks || null,
      submittedAt: submissionMap.get(hw._id.toString())?.submittedAt || null,
    }));
  }

  // â”€â”€â”€ CHILD: REPORT CARDS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  static async getChildReportCards(userId: string, studentId: string) {
    const { parent } = await getParentAndChildren(userId);
    const student = await Student.findOne({ _id: studentId, parentIds: parent._id })
      .populate('userId', 'firstName lastName')
      .populate('classId', 'name')
      .populate('sectionId', 'name');
    if (!student) throw new Error('Student not found or not linked to this parent');

    const submissions = await HomeworkSubmission.find({ studentId: student._id }).select('homeworkId status marks remarks submittedAt');
    const submissionMap = new Map(submissions.map((submission: any) => [submission.homeworkId.toString(), submission]));

    // Group results by exam term
    const results = await Result.find({ studentId: student._id })
      .populate('examId', 'name term date')
      .populate('subjectId', 'name')
      .sort({ createdAt: -1 });

    const byExam: Record<string, any> = {};
    results.forEach((r: any) => {
      const examKey = r.examId?._id?.toString() || 'general';
      if (!byExam[examKey]) {
        byExam[examKey] = {
          _id: examKey,
          term: r.examId?.name || r.examId?.term || 'Assessment',
          examName: r.examId?.name || 'Assessment',
          date: r.examId?.date || r.createdAt,
          grades: {},
          totalMarks: 0,
          maxTotal: 0,
        };
      }
      if (r.subjectId?.name) {
        byExam[examKey].grades[r.subjectId.name] = `${r.marksObtained}/${r.maxMarks}`;
        byExam[examKey].totalMarks += r.marksObtained || 0;
        byExam[examKey].maxTotal += r.maxMarks || 0;
      }
    });

    return Object.values(byExam).map((rc: any) => ({
      ...rc,
      cgpa:
        rc.maxTotal > 0
          ? ((rc.totalMarks / rc.maxTotal) * 10).toFixed(1)
          : 'â€”',
      summary: `${(student.userId as any)?.firstName}'s performance across subjects.`,
    }));
  }

  // â”€â”€â”€ CHILD: ATTENDANCE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  static async getChildAttendance(userId: string, studentId: string) {
    const { parent } = await getParentAndChildren(userId);
    const student = await Student.findOne({ _id: studentId, parentIds: parent._id });
    if (!student) throw new Error('Student not found or not linked to this parent');

    const submissions = await HomeworkSubmission.find({ studentId: student._id }).select('homeworkId status marks remarks submittedAt');
    const submissionMap = new Map(submissions.map((submission: any) => [submission.homeworkId.toString(), submission]));

    const records = await Attendance.find({ studentId: student._id })
      .sort({ date: -1 })
      .limit(60);

    const total = records.length;
    const present = records.filter((r) => ['PRESENT', 'LATE'].includes(r.status)).length;
    const monthly = Array.from(
      records.reduce((map, record: any) => {
        const key = new Date(record.date || record.createdAt).toLocaleString('en-US', { month: 'short', year: 'numeric' });
        if (!map.has(key)) {
          map.set(key, { label: key, present: 0, total: 0 });
        }
        const bucket = map.get(key)!;
        bucket.total += 1;
        if (['PRESENT', 'LATE'].includes(record.status)) {
          bucket.present += 1;
        }
        return map;
      }, new Map<string, { label: string; present: number; total: number }>()),
    ).map(([_, value]) => ({
      ...value,
      percentage: safePercent(value.present, value.total),
    }));

    return {
      records,
      summary: {
        total,
        present,
        absent: records.filter((r) => r.status === 'ABSENT').length,
        late: records.filter((r) => r.status === 'LATE').length,
        percentage: total > 0 ? `${Math.round((present / total) * 100)}%` : '0%',
      },
      monthly,
    };
  }

  // â”€â”€â”€ CHILD: TRANSPORT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  static async getChildTransport(userId: string, studentId: string) {
    const { parent } = await getParentAndChildren(userId);
    const student = await Student.findOne({ _id: studentId, parentIds: parent._id })
      .populate('classId', 'name')
      .populate('sectionId', 'name');
    if (!student) throw new Error('Student not found or not linked to this parent');

    // Find transport route that contains this student's school
    const route = await TransportRoute.findOne({ schoolId: student.schoolId });
    if (!route) return null;

    const stop = route.stops?.[0];
    const tripHistory = await TransportTripLog.find({ schoolId: student.schoolId, routeId: route._id }).sort({ startedAt: -1 }).limit(10);
    const driverUser = route.driverProfileId ? await User.findById(route.driverProfileId).select('profilePicture') : null;
    return {
      routeId: route._id.toString(),
      routeNo: route.routeNo,
      route: route.routeNo,
      busNo: route.busNo,
      driverName: route.driverName,
      driver: route.driverName,
      driverPhone: route.driverPhone,
      phone: route.driverPhone,
      driverPhoto: driverUser?.profilePicture || null,
      stopName: stop?.name || 'â€”',
      stopTime: stop?.time || 'â€”',
      pickupStop: stop?.name || 'â€”',
      pickupTime: stop?.time || 'â€”',
      tripActive: route.tripActive,
      currentLat: route.currentLat,
      currentLng: route.currentLng,
      stops: route.stops.map((s) => ({ name: s.name, time: s.time, lat: s.lat, lng: s.lng })),
      tripHistory: tripHistory.map((trip: any) => ({
        id: trip._id.toString(),
        startedAt: trip.startedAt,
        endedAt: trip.endedAt,
        status: trip.status,
        routeNo: trip.routeNo,
        busNo: trip.busNo,
        lastLat: trip.lastLat,
        lastLng: trip.lastLng,
      })),
    };
  }

  // â”€â”€â”€ CHILD: PTM MEETINGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  static async getPtmMeetings(userId: string, studentId: string) {
    // PTM meetings are not yet a separate model; return empty array for now
    // When a PTM model is added, query it here
    return [];
  }

  static async createPtmMeeting(userId: string, studentId: string, data: any) {
    // Placeholder â€” insert into PTM model when created
    return {
      _id: new Types.ObjectId().toString(),
      teacherName: data.teacher,
      subject: data.subject,
      dateTime: data.dateTime,
      type: data.type || 'Video Call',
      status: 'scheduled',
      createdAt: new Date(),
    };
  }

  // â”€â”€â”€ FEES (parent-scoped) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  static async getChildFees(userId: string, studentId?: string) {
    const { parent, students } = await getParentAndChildren(userId);
    const studentIds = studentId
      ? [new Types.ObjectId(studentId)]
      : students.map((s: any) => s._id);

    return Fee.find({ studentId: { $in: studentIds } }).sort({ dueDate: 1 });
  }

  static async getChildPayments(userId: string, studentId?: string) {
    const { parent, students } = await getParentAndChildren(userId);
    const studentIds = studentId
      ? [new Types.ObjectId(studentId)]
      : students.map((s: any) => s._id);

    return Payment.find({ studentId: { $in: studentIds } }).sort({ createdAt: -1 });
  }

}




