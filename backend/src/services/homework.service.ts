import { Homework } from '../models/Homework.js';
import { HomeworkSubmission } from '../models/HomeworkSubmission.js';
import { StudyMaterial } from '../models/StudyMaterial.js';
import { ApiError } from '../utils/api-error.js';
import { uploadToStorage } from '../utils/cloudinary.js';
import { Class } from '../models/Class.js';
import { Section } from '../models/Section.js';
import { Subject } from '../models/Subject.js';
import { Types } from 'mongoose';
import { Student } from '../models/Student.js';
import { User } from '../models/User.js';

export class HomeworkService {
  static async resolveClassAndSubject(sId: Types.ObjectId, uId: Types.ObjectId, data: any) {
    let classId = data.classId;
    let sectionId = data.sectionId;
    let subjectId = data.subjectId;

    if (!classId && data.className && data.sectionName) {
      let className = data.className;
      if (!className.toLowerCase().startsWith('grade')) {
        className = `Grade ${className}`;
      }

      let classDoc = await Class.findOne({ schoolId: sId, name: className });
      if (!classDoc) classDoc = await Class.findOne({ schoolId: sId, name: data.className });
      if (!classDoc) {
        classDoc = new Class({ schoolId: sId, name: className, createdBy: uId, updatedBy: uId });
        await classDoc.save();
      }
      classId = classDoc._id;

      let sectionDoc = await Section.findOne({ schoolId: sId, classId: classDoc._id, name: data.sectionName });
      if (!sectionDoc) {
        sectionDoc = new Section({ schoolId: sId, classId: classDoc._id, name: data.sectionName, createdBy: uId, updatedBy: uId });
        await sectionDoc.save();
      }
      sectionId = sectionDoc._id;
    } else if (!classId || !sectionId) {
      let classDoc = await Class.findOne({ schoolId: sId });
      if (!classDoc) {
        classDoc = new Class({ schoolId: sId, name: 'Grade 10', createdBy: uId, updatedBy: uId });
        await classDoc.save();
      }
      classId = classDoc._id;

      let sectionDoc = await Section.findOne({ schoolId: sId, classId: classDoc._id });
      if (!sectionDoc) {
        sectionDoc = new Section({ schoolId: sId, classId: classDoc._id, name: 'A', createdBy: uId, updatedBy: uId });
        await sectionDoc.save();
      }
      sectionId = sectionDoc._id;
    }

    if (!subjectId && data.subjectName) {
      let subjectDoc = await Subject.findOne({ schoolId: sId, name: data.subjectName });
      if (!subjectDoc) {
        subjectDoc = new Subject({ schoolId: sId, name: data.subjectName, code: data.subjectName.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 10), type: 'CORE', createdBy: uId, updatedBy: uId });
        await subjectDoc.save();
      }
      subjectId = subjectDoc._id;
    } else if (!subjectId) {
      let subjectDoc = await Subject.findOne({ schoolId: sId });
      if (!subjectDoc) {
        subjectDoc = new Subject({ schoolId: sId, name: 'Mathematics', code: 'MATH', type: 'CORE', createdBy: uId, updatedBy: uId });
        await subjectDoc.save();
      }
      subjectId = subjectDoc._id;
    }

    return { classId: new Types.ObjectId(classId as string), sectionId: new Types.ObjectId(sectionId as string), subjectId: new Types.ObjectId(subjectId as string) };
  }

  static async createHomework(schoolId: string, teacherId: string, data: any) {
    const sId = new Types.ObjectId(schoolId);
    const uId = new Types.ObjectId(teacherId);

    const { classId, sectionId, subjectId } = await this.resolveClassAndSubject(sId, uId, data);

    const parsedDueDate = new Date(data.dueDate);

    const homework = await Homework.create({
      schoolId: sId,
      teacherId: uId,
      classId,
      sectionId,
      subjectId,
      title: data.title,
      description: data.description,
      dueDate: parsedDueDate,
      maxScore: Number(data.maxScore) || 100,
      attachments: data.attachments || [],
      createdBy: uId,
      updatedBy: uId
    });

    return homework;
  }

  static async listHomework(schoolId: string, classId?: string, subjectId?: string) {
    const filter: any = { schoolId };
    if (classId) filter.classId = classId;
    if (subjectId) filter.subjectId = subjectId;
    
    const homeworks = await Homework.find(filter).populate('subjectId').sort({ dueDate: 1 });
    const results = [];

    for (const hw of homeworks) {
      const submissions = await HomeworkSubmission.find({ homeworkId: hw._id });
      const formattedSubmissions = [];

      for (const sub of submissions) {
        const student = await Student.findById(sub.studentId);
        let studentName = "Unknown Student";
        if (student) {
          const userDoc = await User.findById(student.userId);
          if (userDoc) {
            studentName = `${userDoc.firstName} ${userDoc.lastName}`.trim();
          }
        }
        formattedSubmissions.push({
          id: sub._id.toString(),
          studentId: sub.studentId.toString(),
          studentName,
          submittedAt: sub.submittedAt,
          status: sub.status,
          fileUrl: sub.fileUrl,
          fileName: sub.fileName,
          remarks: sub.remarks,
          marks: sub.marks,
          score: sub.marks
        });
      }

      results.push({
        id: hw._id.toString(),
        _id: hw._id.toString(),
        title: hw.title,
        description: hw.description,
        dueDate: hw.dueDate,
        subject: hw.subjectId ? (hw.subjectId as any).name : "Unknown",
        subjectId: hw.subjectId ? (hw.subjectId as any)._id : null,
        submissions: formattedSubmissions,
        maxScore: hw.maxScore || 100
      });
    }

    return results;
  }

  static async submitHomework(schoolId: string, studentId: string, homeworkId: string, file: Express.Multer.File | undefined, remarks?: string) {
    const homework = await Homework.findOne({ _id: homeworkId, schoolId });
    if (!homework) throw new ApiError(404, 'Homework not found');

    const isLate = new Date() > homework.dueDate;
    const uploadResult = file ? await uploadToStorage(file, 'homework-submissions') : null;

    // Resolve User ID to Student Document ID
    let finalStudentId = studentId;
    const student = await Student.findOne({ userId: studentId });
    if (student) {
      finalStudentId = student._id.toString();
    }

    const submission = await HomeworkSubmission.findOneAndUpdate(
      {
        schoolId: new Types.ObjectId(schoolId),
        homeworkId: new Types.ObjectId(homeworkId),
        studentId: new Types.ObjectId(finalStudentId)
      },
      {
        $set: {
          status: isLate ? 'LATE' : 'SUBMITTED',
          fileUrl: uploadResult?.url || "",
          fileName: uploadResult?.fileName || file?.originalname || "Submitted File",
          remarks: remarks || "",
          submittedAt: new Date()
        }
      },
      { new: true, upsert: true }
    );

    return { ...submission.toObject(), isLate };
  }

  static async listSubmissions(schoolId: string, homeworkId: string) {
    return HomeworkSubmission.find({ schoolId, homeworkId }).sort({ submittedAt: -1 });
  }

  static async gradeSubmission(schoolId: string, homeworkId: string, submissionId: string, score: number, feedback: string) {
    const submission = await HomeworkSubmission.findOneAndUpdate(
      { _id: submissionId, schoolId, homeworkId },
      { status: 'REVIEWED', marks: score, remarks: feedback },
      { new: true }
    );
    if (!submission) throw new ApiError(404, 'Submission not found');
    return submission;
  }

  static async uploadStudyMaterial(schoolId: string, teacherId: string, data: any, file?: Express.Multer.File) {
    const sId = new Types.ObjectId(schoolId);
    const uId = new Types.ObjectId(teacherId);
    const { classId, subjectId } = await this.resolveClassAndSubject(sId, uId, data);
    const uploadResult = file ? await uploadToStorage(file, 'study-materials') : null;
    return StudyMaterial.create({
      ...data,
      schoolId: sId,
      teacherId: uId,
      classId,
      subjectId,
      fileUrl: uploadResult?.url || 'https://example.com/placeholder',
      fileName: uploadResult?.fileName || 'Link/Video',
      category: data.category || 'NOTES',
    });
  }

  static async listStudyMaterials(schoolId: string, classId?: string, subjectId?: string) {
    const filter: any = { schoolId };
    if (classId) filter.classId = classId;
    if (subjectId) filter.subjectId = subjectId;
    return StudyMaterial.find(filter).sort({ uploadedAt: -1 });
  }

  static async getSyllabusTracking(schoolId: string, classId?: string) {
    const filter: any = { schoolId };
    if (classId) filter.classId = classId;

    return StudyMaterial.find(filter)
      .populate('subjectId')
      .sort({ uploadedAt: -1 });
  }
}
