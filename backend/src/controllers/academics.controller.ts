import type { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../utils/response.js';
import { Result } from '../models/Result.js';
import { Subject } from '../models/Subject.js';
import { Exam } from '../models/Exam.js';
import { Class } from '../models/Class.js';
import { Section } from '../models/Section.js';
import { Student } from '../models/Student.js';
import { User } from '../models/User.js';
import { Syllabus } from '../models/Syllabus.js';
import { Timetable } from '../models/Timetable.js';
import { AdmissionLead } from '../models/AdmissionLead.js';
import { Types } from 'mongoose';
import { AcademicsService } from '../services/academics.service.js';

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

async function getOrCreateSubject(
  schoolId: Types.ObjectId,
  subjectName: string,
  userId: Types.ObjectId
) {
  let subjectDoc = await Subject.findOne({ schoolId, name: subjectName });
  if (!subjectDoc) {
    subjectDoc = new Subject({
      schoolId,
      name: subjectName,
      code: subjectName.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 10),
      type: 'CORE',
      createdBy: userId,
      updatedBy: userId
    });
    await subjectDoc.save();
  }
  return subjectDoc;
}

async function getOrCreateExam(
  schoolId: Types.ObjectId,
  termName: string,
  classId: Types.ObjectId,
  userId: Types.ObjectId
) {
  let examDoc = await Exam.findOne({ schoolId, name: termName, classId });
  if (!examDoc) {
    examDoc = new Exam({
      schoolId,
      name: termName,
      classId,
      startDate: new Date(),
      endDate: new Date(),
      status: 'PUBLISHED',
      createdBy: userId,
      updatedBy: userId
    });
    await examDoc.save();
  }
  return examDoc;
}

export class AcademicsController {
  static async recordGrade(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const userId = req.user?.id || "000000000000000000000001";
      const { student_id, student_name, subject, grade, section, score, max_score, term, remarks } = req.body;

      const sId = new Types.ObjectId(schoolId as string);
      const uId = new Types.ObjectId(userId as string);

      const { classId, sectionId } = await getOrCreateClassAndSection(sId, grade, section, uId);
      const subjectDoc = await getOrCreateSubject(sId, subject, uId);
      const examDoc = await getOrCreateExam(sId, term, classId, uId);

      const scoreValue = typeof score === 'string' ? Number(score) : score;
      const maxScoreValue = typeof max_score === 'string' ? Number(max_score) : (max_score || 100);

      // Determine letter grade
      let letterGrade = 'B';
      if (maxScoreValue > 0) {
        const pct = (scoreValue / maxScoreValue) * 100;
        if (pct >= 90) letterGrade = 'A';
        else if (pct >= 80) letterGrade = 'B';
        else if (pct >= 70) letterGrade = 'C';
        else if (pct >= 60) letterGrade = 'D';
        else letterGrade = 'F';
      }

      const resultRecord = await Result.findOneAndUpdate(
        {
          schoolId: sId,
          examId: examDoc._id,
          studentId: new Types.ObjectId(student_id as string),
          subjectId: subjectDoc._id
        },
        {
          $set: {
            marksObtained: scoreValue,
            maxMarks: maxScoreValue,
            grade: letterGrade,
            remarks: remarks || "",
            createdBy: uId,
            updatedBy: uId
          }
        },
        { new: true, upsert: true }
      );

      sendResponse(res, 201, 'Grade recorded successfully', {
        id: resultRecord._id,
        student_id,
        student_name,
        subject,
        grade,
        section,
        score: scoreValue,
        max_score: maxScoreValue,
        term,
        remarks: remarks || "",
        created_at: resultRecord.createdAt,
        updated_at: resultRecord.updatedAt
      });
    } catch (error) {
      next(error);
    }
  }

  static async recordGradeBulk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const userId = req.user?.id || "000000000000000000000001";
      const grades = req.body;

      if (!Array.isArray(grades)) {
        res.status(400).json({ success: false, message: 'Invalid payload: expected an array' });
        return;
      }

      const sId = new Types.ObjectId(schoolId as string);
      const uId = new Types.ObjectId(userId as string);
      const results = [];

      for (const item of grades) {
        const { student_id, student_name, subject, grade, section, score, max_score, term, remarks } = item;

        const { classId } = await getOrCreateClassAndSection(sId, grade, section, uId);
        const subjectDoc = await getOrCreateSubject(sId, subject, uId);
        const examDoc = await getOrCreateExam(sId, term, classId, uId);

        const scoreValue = typeof score === 'string' ? Number(score) : score;
        const maxScoreValue = typeof max_score === 'string' ? Number(max_score) : (max_score || 100);

        let letterGrade = 'B';
        if (maxScoreValue > 0) {
          const pct = (scoreValue / maxScoreValue) * 100;
          if (pct >= 90) letterGrade = 'A';
          else if (pct >= 80) letterGrade = 'B';
          else if (pct >= 70) letterGrade = 'C';
          else if (pct >= 60) letterGrade = 'D';
          else letterGrade = 'F';
        }

        const resultRecord = await Result.findOneAndUpdate(
          {
            schoolId: sId,
            examId: examDoc._id,
            studentId: new Types.ObjectId(student_id as string),
            subjectId: subjectDoc._id
          },
          {
            $set: {
              marksObtained: scoreValue,
              maxMarks: maxScoreValue,
              grade: letterGrade,
              remarks: remarks || "",
              createdBy: uId,
              updatedBy: uId
            }
          },
          { new: true, upsert: true }
        );

        results.push({
          id: resultRecord._id,
          student_id,
          student_name,
          subject,
          grade,
          section,
          score: scoreValue,
          max_score: maxScoreValue,
          term,
          remarks: remarks || "",
          created_at: resultRecord.createdAt,
          updated_at: resultRecord.updatedAt
        });
      }

      sendResponse(res, 201, 'Bulk grades recorded successfully', results);
    } catch (error) {
      next(error);
    }
  }

  static async getStudentGrades(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const studentId = req.params.studentId;

      const records = await Result.find({
        schoolId: new Types.ObjectId(schoolId as string),
        studentId: new Types.ObjectId(studentId as string)
      });

      const formatted = [];
      for (const rec of records) {
        let student = await Student.findById(rec.studentId);
        if (!student) {
          student = await Student.findOne({ userId: rec.studentId });
        }
        const studentUser = student ? await User.findById(student.userId) : await User.findById(rec.studentId);
        const subjectDoc = await Subject.findById(rec.subjectId);
        const examDoc = await Exam.findById(rec.examId);

        let className = "10";
        let secName = "A";
        if (examDoc) {
          const classDoc = await Class.findById(examDoc.classId);
          if (classDoc) {
            className = classDoc.name.replace('Grade ', '');
            // Find a section under this class for secName
            const sectionDoc = await Section.findOne({ schoolId: rec.schoolId, classId: classDoc._id });
            if (sectionDoc) {
              secName = sectionDoc.name;
            }
          }
        }

        formatted.push({
          id: rec._id,
          student_id: rec.studentId.toString(),
          student_name: studentUser ? `${studentUser.firstName} ${studentUser.lastName}`.trim() : "Unknown Student",
          subject: subjectDoc ? subjectDoc.name : "Unknown Subject",
          grade: className,
          section: secName,
          score: rec.marksObtained,
          max_score: rec.maxMarks,
          remarks: rec.remarks || "",
          term: examDoc ? examDoc.name : "Term 1",
          created_at: rec.createdAt,
          updated_at: rec.updatedAt
        });
      }

      sendResponse(res, 200, 'Student grades retrieved', formatted);
    } catch (error) {
      next(error);
    }
  }

  static async getGradesByTerm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { term, grade } = req.query;

      const match: any = { schoolId: new Types.ObjectId(schoolId as string) };

      if (term) {
        const examDocs = await Exam.find({ schoolId: match.schoolId, name: term as string });
        if (examDocs.length > 0) {
          match.examId = { $in: examDocs.map(e => e._id) };
        }
      }

      const records = await Result.find(match);

      const formatted = [];
      for (const rec of records) {
        let student = await Student.findById(rec.studentId);
        if (!student) {
          student = await Student.findOne({ userId: rec.studentId });
        }
        const studentUser = student ? await User.findById(student.userId) : await User.findById(rec.studentId);
        const subjectDoc = await Subject.findById(rec.subjectId);
        const examDoc = await Exam.findById(rec.examId);

        let className = "10";
        let secName = "A";
        if (examDoc) {
          const classDoc = await Class.findById(examDoc.classId);
          if (classDoc) {
            className = classDoc.name.replace('Grade ', '');
            const sectionDoc = await Section.findOne({ schoolId: rec.schoolId, classId: classDoc._id });
            if (sectionDoc) {
              secName = sectionDoc.name;
            }
          }
        }

        // Filter by grade string if passed
        if (grade && className !== (grade as string)) {
          continue;
        }

        formatted.push({
          id: rec._id,
          student_id: rec.studentId.toString(),
          student_name: studentUser ? `${studentUser.firstName} ${studentUser.lastName}`.trim() : "Unknown Student",
          subject: subjectDoc ? subjectDoc.name : "Unknown Subject",
          grade: className,
          section: secName,
          score: rec.marksObtained,
          max_score: rec.maxMarks,
          remarks: rec.remarks || "",
          term: examDoc ? examDoc.name : (term as string || "Term 1"),
          created_at: rec.createdAt,
          updated_at: rec.updatedAt
        });
      }

      sendResponse(res, 200, 'Grades by term retrieved', formatted);
    } catch (error) {
      next(error);
    }
  }



  static async listSubjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const subjects = await Subject.find({ schoolId }).populate('classId', 'name');
      sendResponse(res, 200, 'Subjects retrieved', subjects);
    } catch (error) {
      next(error);
    }
  }

  static async listSyllabus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const syllabus = await Syllabus.find({ schoolId }).populate('subjectId classId');
      sendResponse(res, 200, 'Syllabus retrieved', syllabus);
    } catch (error) {
      next(error);
    }
  }

  static async listLeads(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const leads = await AdmissionLead.find({ schoolId });
      sendResponse(res, 200, 'Leads retrieved', leads);
    } catch (error) {
      next(error);
    }
  }

  static async createLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const lead = new AdmissionLead({ ...req.body, schoolId });
      await lead.save();
      sendResponse(res, 201, 'Lead created', lead);
    } catch (error) {
      next(error);
    }
  }

  static async updateLead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const lead = await AdmissionLead.findOneAndUpdate(
        { _id: req.params.id, schoolId },
        { $set: req.body },
        { new: true }
      );
      sendResponse(res, 200, 'Lead updated', lead);
    } catch (error) {
      next(error);
    }
  }

  static async listTimetable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const query: any = { schoolId, isDeleted: false };
      if (req.user?.role === 'STUDENT') {
        const student = await Student.findOne({ userId: new Types.ObjectId(req.user.id), schoolId: new Types.ObjectId(schoolId as string) });
        if (student) {
          query.classId = student.classId;
          if (student.sectionId) {
            query.sectionId = student.sectionId;
          }
        }
      }
      const timetable = await Timetable.find(query)
        .populate('subjectId classId teacherId');
      sendResponse(res, 200, 'Timetable retrieved', timetable);
    } catch (error) {
      next(error);
    }
  }

  static async createTimetable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const timetable = await AcademicsService.createTimetable(schoolId, req.body, req.user?.id);
      sendResponse(res, 201, 'Timetable scheduled', timetable);
    } catch (error) {
      next(error);
    }
  }

  // --- Classes ---
  static async listClasses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { page, limit, search, branchId } = req.query as any;
      const allowedBranchIds = req.user?.role === 'SUPER_ADMIN' ? undefined : req.user?.allowedBranchIds;
      const result = await AcademicsService.listClasses(schoolId, Number(page) || 1, Number(limit) || 10, search as string, branchId as string, allowedBranchIds);
      sendResponse(res, 200, 'Classes retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  static async createClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const cls = await AcademicsService.createClass(schoolId, req.body, req.user?.id);
      sendResponse(res, 201, 'Class created successfully', cls);
    } catch (error) {
      next(error);
    }
  }

  static async updateClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const cls = await AcademicsService.updateClass(schoolId, String(req.params.id), req.body, req.user?.id);
      sendResponse(res, 200, 'Class updated successfully', cls);
    } catch (error) {
      next(error);
    }
  }

  static async deleteClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      await AcademicsService.deleteClass(schoolId, String(req.params.id));
      sendResponse(res, 204, 'Class deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // --- Sections ---
  static async listSections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { page, limit, search, classId, branchId } = req.query as any;
      const allowedBranchIds = req.user?.role === 'SUPER_ADMIN' ? undefined : req.user?.allowedBranchIds;
      const result = await AcademicsService.listSections(
        schoolId,
        Number(page) || 1,
        Number(limit) || 10,
        search as string,
        classId as string,
        branchId as string,
        allowedBranchIds,
      );
      sendResponse(res, 200, 'Sections retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  static async createSection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const section = await AcademicsService.createSection(schoolId, req.body, req.user?.id);
      sendResponse(res, 201, 'Section created successfully', section);
    } catch (error) {
      next(error);
    }
  }

  static async updateSection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const section = await AcademicsService.updateSection(schoolId, String(req.params.id), req.body, req.user?.id);
      sendResponse(res, 200, 'Section updated successfully', section);
    } catch (error) {
      next(error);
    }
  }

  static async deleteSection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      await AcademicsService.deleteSection(schoolId, String(req.params.id));
      sendResponse(res, 204, 'Section deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // --- Subjects ---
  static async listSubjectsPaged(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { page, limit, search, type } = req.query as any;
      const result = await AcademicsService.listSubjects(
        schoolId,
        Number(page) || 1,
        Number(limit) || 10,
        search as string,
        type as string,
      );
      sendResponse(res, 200, 'Subjects retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  static async createSubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const subject = await AcademicsService.createSubject(schoolId, req.body, req.user?.id);
      sendResponse(res, 201, 'Subject created successfully', subject);
    } catch (error) {
      next(error);
    }
  }

  static async updateSubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const subject = await AcademicsService.updateSubject(schoolId, String(req.params.id), req.body, req.user?.id);
      sendResponse(res, 200, 'Subject updated successfully', subject);
    } catch (error) {
      next(error);
    }
  }

  static async deleteSubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      await AcademicsService.deleteSubject(schoolId, String(req.params.id));
      sendResponse(res, 204, 'Subject deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // --- Timetable CRUD ---
  static async listTimetablePaged(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const { page, limit, classId, sectionId, subjectId, teacherId, dayOfWeek } = req.query as any;
      const result = await AcademicsService.listTimetables(schoolId, Number(page) || 1, Number(limit) || 10, {
        classId: classId as string,
        sectionId: sectionId as string,
        subjectId: subjectId as string,
        teacherId: teacherId as string,
        dayOfWeek: dayOfWeek as string,
      });
      sendResponse(res, 200, 'Timetable retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  static async updateTimetable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      const timetable = await AcademicsService.updateTimetable(schoolId, String(req.params.id), req.body, req.user?.id);
      sendResponse(res, 200, 'Timetable updated successfully', timetable);
    } catch (error) {
      next(error);
    }
  }

  static async deleteTimetable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = req.user?.schoolId || "000000000000000000000001";
      await AcademicsService.deleteTimetable(schoolId, String(req.params.id));
      sendResponse(res, 204, 'Timetable deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
