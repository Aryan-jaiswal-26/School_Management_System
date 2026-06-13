import mongoose, { Types } from 'mongoose';
import { Student, IStudent } from '../models/Student.js';
import { User } from '../models/User.js';
import { Parent } from '../models/Parent.js';
import { StudentDocument } from '../models/StudentDocument.js';
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

export class StudentService {
  static async admitStudent(schoolIdStr: string, data: any): Promise<IStudent> {
    const schoolId = await resolveSchoolId(schoolIdStr);
    return runInTransaction(async (session) => {
      // 1. Check existing admission number
      const existing = await Student.findOne({ schoolId, admissionNumber: data.admissionNumber, isDeleted: false }).session(session || null);
      if (existing) {
        throw new ApiError(409, 'Admission number already exists in this school');
      }

      // 1.5 Check for duplicate student (firstName, lastName, dob)
      if (data.firstName && data.lastName && data.dob) {
        // First find matching users
        const users = await User.find({
          schoolId,
          firstName: { $regex: new RegExp(`^${data.firstName}$`, 'i') },
          lastName: { $regex: new RegExp(`^${data.lastName}$`, 'i') }
        }).session(session || null);

        if (users.length > 0) {
          const userIds = users.map((u: any) => u._id);
          const duplicate = await Student.findOne({
            schoolId,
            userId: { $in: userIds },
            dob: data.dob,
            isDeleted: false
          }).session(session || null);

          if (duplicate) {
            throw new ApiError(409, 'A student with the same name and date of birth already exists in this school');
          }
        }
      }

      // 2. Create Student User if requested
      let userId: Types.ObjectId | null = null;
      if (data.studentUser) {
        const userExists = await User.findOne({ email: data.studentUser.email }).session(session || null);
        if (userExists) throw new ApiError(409, 'Student email already in use');

        const passwordHash = await hashPassword(data.studentUser.password);
        const newUser = new User({
          schoolId,
          branchId: data.branchId ? new Types.ObjectId(data.branchId) : undefined,
          email: data.studentUser.email,
          passwordHash,
          firstName: data.studentUser.firstName,
          lastName: data.studentUser.lastName,
          role: 'STUDENT',
          isActive: true
        });
        await newUser.save({ session });
        userId = newUser._id;
      }

      if (!userId) {
          // Auto‑create a minimal user if email is provided
          if (!data.email) {
            throw new ApiError(400, 'Student email is required to create a user');
          }
          const dummyPassword = await hashPassword('TempPass123!');
          const dummyUser = new User({
            schoolId,
            branchId: data.branchId ? new Types.ObjectId(data.branchId) : undefined,
            email: data.email,
            passwordHash: dummyPassword,
            firstName: data.firstName || 'First',
            lastName: data.lastName || 'Last',
            role: 'STUDENT',
            isActive: true,
          });
          await dummyUser.save({ session });
          userId = dummyUser._id;
        }

      // 3. Process Parents
      const parentIds: Types.ObjectId[] = [];
      if (data.parentIds && data.parentIds.length > 0) {
        parentIds.push(...data.parentIds.map((id: string) => new Types.ObjectId(id)));
      }

      if (data.newParents && data.newParents.length > 0) {
        for (const p of data.newParents) {
          let parentUser = await User.findOne({ email: p.email }).session(session || null);
          let parentUserId: Types.ObjectId;
          if (!parentUser) {
            const passwordHash = await hashPassword(p.password || 'ParentPass123!');
            parentUser = new User({
              schoolId,
              email: p.email,
              passwordHash,
              firstName: p.firstName,
              lastName: p.lastName,
              role: 'PARENT',
              isActive: true
            });
            await parentUser.save({ session });
          }
          parentUserId = parentUser._id;

          let parentDoc = await Parent.findOne({ schoolId, userId: parentUserId }).session(session || null);
          if (!parentDoc) {
            parentDoc = new Parent({
              schoolId,
              userId: parentUserId,
              contactPrimary: p.phone,
              occupation: p.occupation,
              address: data.address
            });
            await parentDoc.save({ session });
          }
          parentIds.push(parentDoc._id);
        }
      }

      // Handle Class and Section creation automatically if string is provided
      let classId = data.classId;
      if (!classId && data.grade) {
         let classDoc = await mongoose.model('Class').findOne({ schoolId, name: data.grade }).session(session || null);
         if (!classDoc) {
            classDoc = new (mongoose.model('Class'))({ schoolId, name: data.grade });
            await classDoc.save({ session });
         }
         classId = classDoc._id;
      }

      let sectionId = data.sectionId;
      if (!sectionId && data.section) {
         let sectionDoc = await mongoose.model('Section').findOne({ schoolId, classId, name: data.section }).session(session || null);
         if (!sectionDoc) {
            sectionDoc = new (mongoose.model('Section'))({ schoolId, classId, name: data.section });
            await sectionDoc.save({ session });
         }
         sectionId = sectionDoc._id;
      }

      // 4. Create Student
      const student = new Student({
        schoolId,
        branchId: data.branchId ? new Types.ObjectId(data.branchId) : undefined,
        userId,
        admissionNumber: data.admissionNumber,
        rollNumber: data.rollNumber,
        classId,
        sectionId,
        parentIds: [...new Set(parentIds)], // Ensure unique parent IDs
        dob: data.dob,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        address: data.address,
        emergencyContact: data.emergencyContact
      });

      await student.save({ session });
      return student;
    });
  }

  static async getStudentProfile(schoolId: string, studentId: string): Promise<any> {
    const student = await Student.aggregate([
      { $match: { _id: new Types.ObjectId(studentId), schoolId: new Types.ObjectId(schoolId), isDeleted: false } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'classes',
          localField: 'classId',
          foreignField: '_id',
          as: 'classDetails'
        }
      },
      { $unwind: { path: '$classDetails', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'sections',
          localField: 'sectionId',
          foreignField: '_id',
          as: 'sectionDetails'
        }
      },
      { $unwind: { path: '$sectionDetails', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'parents',
          localField: 'parentIds',
          foreignField: '_id',
          as: 'parents'
        }
      },
      {
         $lookup: {
            from: 'users',
            localField: 'parents.userId',
            foreignField: '_id',
            as: 'parentUsers'
         }
      },
      {
         $project: {
            'user.password': 0,
            'parentUsers.password': 0
         }
      }
    ]);

    if (!student || student.length === 0) {
      throw new ApiError(404, 'Student not found');
    }

    return student[0];
  }

  static async listStudents(schoolId: string, query: any): Promise<PaginationResult<any>> {
    const { page, limit, search, isActive, classId, sectionId, tcStatus, isDeleted } = query;
    const isDeletedBool = isDeleted === true || isDeleted === 'true';
    const match: any = { schoolId: new Types.ObjectId(schoolId), isDeleted: isDeletedBool };

    if (isActive !== undefined) match.isActive = isActive;
    if (tcStatus) match.tcStatus = tcStatus;
    if (classId) {
      if (typeof classId === 'object' && classId.$in) {
        match.classId = { $in: classId.$in.map((id: any) => new Types.ObjectId(id)) };
      } else {
        match.classId = new Types.ObjectId(classId as string);
      }
    }
    if (sectionId) {
      if (typeof sectionId === 'object' && sectionId.$in) {
        match.sectionId = { $in: sectionId.$in.map((id: any) => new Types.ObjectId(id)) };
      } else {
        match.sectionId = new Types.ObjectId(sectionId as string);
      }
    }

    if (query.branchId) {
      match.branchId = new Types.ObjectId(query.branchId as string);
    } else if (query.allowedBranchIds && query.allowedBranchIds.length > 0) {
      match.branchId = { $in: query.allowedBranchIds.map((id: any) => new Types.ObjectId(id)) };
    }

    if (search) {
       // Search by admission number or roll number locally, 
       // but typically we'd need a lookup or user text index to search by user name.
       match.$or = [
          { admissionNumber: { $regex: search, $options: 'i' } },
          { rollNumber: { $regex: search, $options: 'i' } }
       ];
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
      {
        $lookup: {
          from: 'classes',
          localField: 'classId',
          foreignField: '_id',
          as: 'classDetails'
        }
      },
      { $unwind: { path: '$classDetails', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'sections',
          localField: 'sectionId',
          foreignField: '_id',
          as: 'sectionDetails'
        }
      },
      { $unwind: { path: '$sectionDetails', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'parents',
          localField: 'parentIds',
          foreignField: '_id',
          as: 'parents'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'parents.userId',
          foreignField: '_id',
          as: 'parentUsers'
        }
      },
      { $project: { 'user.password': 0 } },
      { $sort: { 'user.firstName': 1, 'user.lastName': 1 } }
    ];

    const totalPipeline = [{ $match: match }, { $count: 'count' }];
    const totalResult = await Student.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].count : 0;

    pipeline.push({ $skip: skip } as any);
    pipeline.push({ $limit: limit } as any);

    const data = await Student.aggregate(pipeline as any);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async updateStudent(schoolId: string, id: string, data: any): Promise<IStudent> {
    const updatePayload: Record<string, unknown> = { ...data };
    if (data.parentIds) {
      updatePayload.parentIds = [...new Set(data.parentIds.map((parentId: string) => new Types.ObjectId(parentId)))];
    }
    const student = await Student.findOneAndUpdate(
      { _id: id, schoolId, isDeleted: false },
      { $set: updatePayload },
      { new: true, runValidators: true }
    );
    if (!student) throw new ApiError(404, 'Student not found');
    return student;
  }

  static async assignClassAndSection(schoolId: string, id: string, classId: string, sectionId: string): Promise<IStudent> {
    const student = await Student.findOneAndUpdate(
      { _id: id, schoolId, isDeleted: false },
      { $set: { classId, sectionId } },
      { new: true, runValidators: true }
    );
    if (!student) throw new ApiError(404, 'Student not found');
    return student;
  }

  static async uploadDocument(schoolId: string, studentId: string, documentType: string, file: Express.Multer.File) {
    const student = await Student.findOne({ _id: studentId, schoolId, isDeleted: false });
    if (!student) throw new ApiError(404, 'Student not found');

    const fileUrl = `/uploads/${file.filename}`; // Or full URL

    const document = new StudentDocument({
      schoolId,
      studentId,
      documentType,
      fileUrl,
      originalName: file.originalname
    });

    return document.save();
  }

  static async listDocuments(schoolId: string, studentId: string) {
     return StudentDocument.find({ schoolId, studentId, isDeleted: false }).sort({ uploadedAt: -1 });
  }

  static async issueTransferCertificate(schoolId: string, id: string, data: any): Promise<IStudent> {
    const student = await Student.findOneAndUpdate(
      { _id: id, schoolId, isDeleted: false },
      { 
        $set: { 
          tcStatus: 'ISSUED', 
          tcIssueDate: data.tcIssueDate || new Date(),
          isActive: false // Deactivate student upon TC issue
        } 
      },
      { new: true, runValidators: true }
    );
    if (!student) throw new ApiError(404, 'Student not found');
    return student;
  }

  static async deleteStudent(schoolId: string, id: string): Promise<any> {
    const student = await Student.findOneAndUpdate(
      { _id: id, schoolId, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    );
    if (!student) throw new ApiError(404, 'Student not found');
    return student;
  }

  static async restoreStudent(schoolId: string, id: string): Promise<any> {
    const student = await Student.findOneAndUpdate(
      { _id: id, schoolId, isDeleted: true },
      { $set: { isDeleted: false } },
      { new: true }
    );
    if (!student) throw new ApiError(404, 'Student not found or not deleted');
    return student;
  }
}
