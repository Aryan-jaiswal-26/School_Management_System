import { Types } from 'mongoose';
import { Exam } from '../models/Exam.js';
import { Result } from '../models/Result.js';
import { ApiError } from '../utils/api-error.js';

function calculateGrade(marksObtained: number, maxMarks: number, gradingScheme?: any): string {
  const percentage = maxMarks > 0 ? (marksObtained / maxMarks) * 100 : 0;
  const scheme = gradingScheme || {};
  const aThreshold = scheme.aThreshold ?? 90;
  const bThreshold = scheme.bThreshold ?? 80;
  const cThreshold = scheme.cThreshold ?? 70;
  const dThreshold = scheme.dThreshold ?? 60;

  if (percentage >= aThreshold) return 'A+';
  if (percentage >= bThreshold) return 'A';
  if (percentage >= cThreshold) return 'B';
  if (percentage >= dThreshold) return 'C';
  if (percentage >= (scheme.passMark ?? 40)) return 'D';
  return 'F';
}

function gradeToGPA(grade: string): number {
  switch(grade) {
    case 'A+': return 4.0;
    case 'A': return 3.7;
    case 'B': return 3.0;
    case 'C': return 2.0;
    case 'D': return 1.0;
    default: return 0.0;
  }
}

export class ExamService {
  static async createExam(schoolId: string, data: any) {
    const exam = new Exam({
      ...data,
      schoolId,
      gradingScheme: data.gradingScheme || {
        aThreshold: 90,
        bThreshold: 80,
        cThreshold: 70,
        dThreshold: 60,
        passMark: 40,
      },
    });
    return exam.save();
  }

  static async updateExamStatus(schoolId: string, examId: string, status: string) {
    const exam = await Exam.findOneAndUpdate(
      { _id: examId, schoolId },
      { $set: { status } },
      { new: true }
    );
    if (!exam) throw new ApiError(404, 'Exam not found');
    return exam;
  }

  static async listExams(schoolId: string, classId?: string) {
    const match: any = { schoolId: new Types.ObjectId(schoolId) };
    if (classId) match.classId = new Types.ObjectId(classId);
    return Exam.find(match).sort({ startDate: -1 });
  }

  static async publishResults(schoolId: string, examId: string) {
    const exam = await Exam.findOne({ _id: examId, schoolId });
    if (!exam) throw new ApiError(404, 'Exam not found');

    const resultCount = await Result.countDocuments({ schoolId: new Types.ObjectId(schoolId), examId: new Types.ObjectId(examId) });
    if (resultCount === 0) throw new ApiError(400, 'No marks have been entered for this exam yet');

    exam.status = 'PUBLISHED';
    exam.publishedAt = new Date();
    await exam.save();

    return { examId, status: 'PUBLISHED', publishedAt: exam.publishedAt, resultCount };
  }

  static async bulkEnterMarks(schoolId: string, examId: string, data: any) {
    const exam = await Exam.findOne({ _id: examId, schoolId });
    if (!exam) throw new ApiError(404, 'Exam not found');

    if (exam.status === 'PUBLISHED') {
      throw new ApiError(400, 'Cannot modify marks for a published exam');
    }

    const operations = data.records.map((record: any) => {
      const grade = calculateGrade(record.marksObtained, record.maxMarks, exam.gradingScheme);
      
      return {
        updateOne: {
          filter: { 
            schoolId: new Types.ObjectId(schoolId), 
            examId: new Types.ObjectId(examId), 
            studentId: new Types.ObjectId(record.studentId),
            subjectId: new Types.ObjectId(data.subjectId)
          },
          update: { 
            $set: { 
              marksObtained: record.marksObtained,
              maxMarks: record.maxMarks,
              grade,
              remarks: record.remarks
            } 
          },
          upsert: true
        }
      };
    });
    
    return Result.bulkWrite(operations);
  }

  static async generateReportCard(schoolId: string, examId: string, studentId: string, userRole: string) {
    const exam = await Exam.findOne({ _id: examId, schoolId });
    if (!exam) throw new ApiError(404, 'Exam not found');

    // Prevent students/parents from seeing unpublished results
    if ((userRole === 'STUDENT' || userRole === 'PARENT') && exam.status !== 'PUBLISHED') {
       throw new ApiError(403, 'Results for this exam are not published yet');
    }

    const results = await Result.aggregate([
      { 
        $match: { 
          schoolId: new Types.ObjectId(schoolId),
          examId: new Types.ObjectId(examId),
          studentId: new Types.ObjectId(studentId)
        } 
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'subjectId',
          foreignField: '_id',
          as: 'subject'
        }
      },
      { $unwind: '$subject' }
    ]);

    if (results.length === 0) {
      throw new ApiError(404, 'No results found for this student in this exam');
    }

    let totalObtained = 0;
    let totalMax = 0;
    let totalGPA = 0;

    const formattedResults = results.map(r => {
      totalObtained += r.marksObtained;
      totalMax += r.maxMarks;
      totalGPA += gradeToGPA(r.grade);

      return {
        subjectName: r.subject.name,
        subjectCode: r.subject.code,
        marksObtained: r.marksObtained,
        maxMarks: r.maxMarks,
        grade: r.grade,
        remarks: r.remarks
      };
    });

    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    const overallGrade = calculateGrade(totalObtained, totalMax, exam.gradingScheme);
    const averageGPA = formattedResults.length > 0 ? totalGPA / formattedResults.length : 0;

    return {
      examDetails: {
        name: exam.name,
        startDate: exam.startDate,
        endDate: exam.endDate,
        status: exam.status
      },
      overall: {
        totalObtained,
        totalMax,
        percentage: Number(percentage.toFixed(2)),
        overallGrade,
        averageGPA: Number(averageGPA.toFixed(2))
      },
      results: formattedResults
    };
  }

  static async getSubjectAnalytics(schoolId: string, examId: string, subjectId: string) {
    const stats = await Result.aggregate([
      {
        $match: {
          schoolId: new Types.ObjectId(schoolId),
          examId: new Types.ObjectId(examId),
          subjectId: new Types.ObjectId(subjectId)
        }
      },
      {
        $group: {
          _id: null,
          totalStudents: { $sum: 1 },
          highestMarks: { $max: '$marksObtained' },
          lowestMarks: { $min: '$marksObtained' },
          averageMarks: { $avg: '$marksObtained' },
          passCount: {
            $sum: {
              $cond: [{ $gte: ['$marksObtained', 40] }, 1, 0]
            }
          },
          gradeA: { $sum: { $cond: [{ $eq: ['$grade', 'A+'] }, 1, 0] } },
          gradeAStd: { $sum: { $cond: [{ $eq: ['$grade', 'A'] }, 1, 0] } },
          gradeB: { $sum: { $cond: [{ $eq: ['$grade', 'B'] }, 1, 0] } },
          gradeC: { $sum: { $cond: [{ $eq: ['$grade', 'C'] }, 1, 0] } },
          gradeD: { $sum: { $cond: [{ $eq: ['$grade', 'D'] }, 1, 0] } },
          gradeF: { $sum: { $cond: [{ $eq: ['$grade', 'F'] }, 1, 0] } },
        }
      },
      {
        $project: {
          _id: 0,
          totalStudents: 1,
          highestMarks: 1,
          lowestMarks: 1,
          averageMarks: { $round: ['$averageMarks', 2] },
          passRate: {
            $round: [{ $multiply: [{ $divide: ['$passCount', '$totalStudents'] }, 100] }, 2]
          },
          gradeDistribution: {
            APlus: '$gradeA',
            A: '$gradeAStd',
            B: '$gradeB',
            C: '$gradeC',
            D: '$gradeD',
            F: '$gradeF',
          },
        }
      }
    ]);

    return stats.length > 0
      ? stats[0]
      : { totalStudents: 0, highestMarks: 0, lowestMarks: 0, averageMarks: 0, passRate: 0, gradeDistribution: { APlus: 0, A: 0, B: 0, C: 0, D: 0, F: 0 } };
  }
}
