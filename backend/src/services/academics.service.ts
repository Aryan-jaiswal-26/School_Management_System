import { Types } from "mongoose";
import { ApiError } from "../utils/api-error.js";
import { resolveSchoolId } from "../utils/school.js";
import { Class } from "../models/Class.js";
import { Section } from "../models/Section.js";
import { Subject } from "../models/Subject.js";
import { Timetable } from "../models/Timetable.js";
import { Event } from "../models/Event.js";
import { Employee } from "../models/Employee.js";
import { Student } from "../models/Student.js";

interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function normalizeCode(name: string): string {
  return name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_").replace(/_+/g, "_").slice(0, 20) || "SUBJECT";
}

function toObjectId(value: string | Types.ObjectId): Types.ObjectId {
  return value instanceof Types.ObjectId ? value : new Types.ObjectId(value);
}

export class AcademicsService {
  // --- Classes ---
  static async listClasses(schoolIdInput: string, page: number, limit: number, search?: string, branchId?: string, allowedBranchIds?: any[], allowedClassIds?: any[]): Promise<PaginationResult<any>> {
    const schoolId = await resolveSchoolId(schoolIdInput);
    const query: Record<string, any> = { schoolId };
    if (search) query.name = { $regex: search, $options: "i" };
    if (branchId) {
      query.branchId = new Types.ObjectId(branchId);
    } else if (allowedBranchIds && allowedBranchIds.length > 0) {
      query.branchId = { $in: allowedBranchIds.map((id: any) => new Types.ObjectId(id)) };
    }
    if (allowedClassIds) {
      query._id = { $in: allowedClassIds.map((id: any) => new Types.ObjectId(id)) };
    }

    const total = await Class.countDocuments(query);
    const data = await Class.find(query).sort({ name: 1 }).skip((page - 1) * limit).limit(limit);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async createClass(schoolIdInput: string, input: any, userId?: string): Promise<any> {
    const schoolId = await resolveSchoolId(input.schoolId ?? schoolIdInput);
    const existing = await Class.findOne({ schoolId, name: input.name });
    if (existing) throw new ApiError(409, "Class already exists for this school");

    const cls = await Class.create({
      schoolId,
      branchId: input.branchId ? new Types.ObjectId(input.branchId) : undefined,
      name: input.name,
      description: input.description,
      createdBy: userId,
      updatedBy: userId,
    });

    if (Array.isArray(input.sections) && input.sections.length > 0) {
      for (const secName of input.sections) {
        const trimmed = secName.trim();
        if (trimmed) {
          await Section.create({
            schoolId,
            classId: cls._id,
            name: trimmed,
            createdBy: userId,
            updatedBy: userId,
          });
        }
      }
    }

    return cls;
  }

  static async updateClass(schoolIdInput: string, id: string, input: any, userId?: string): Promise<any> {
    const schoolId = await resolveSchoolId(schoolIdInput);
    const updated = await Class.findOneAndUpdate(
      { _id: id, schoolId },
      { $set: { ...input, updatedBy: userId } },
      { new: true, runValidators: true },
    );
    if (!updated) throw new ApiError(404, "Class not found");
    return updated;
  }

  static async deleteClass(schoolIdInput: string, id: string): Promise<void> {
    const schoolId = await resolveSchoolId(schoolIdInput);
    const [students, sections] = await Promise.all([
      Student.countDocuments({ schoolId, classId: id, isDeleted: { $ne: true } }),
      Section.countDocuments({ schoolId, classId: id }),
    ]);
    if (students > 0 || sections > 0) {
      throw new ApiError(409, "Class cannot be deleted while students or sections exist");
    }

    const deleted = await Class.deleteOne({ _id: id, schoolId });
    if (deleted.deletedCount === 0) throw new ApiError(404, "Class not found");
  }

  // --- Sections ---
  static async listSections(
    schoolIdInput: string,
    page: number,
    limit: number,
    search?: string,
    classId?: any,
    branchId?: string,
    allowedBranchIds?: any[],
    allowedSectionIds?: any[]
  ): Promise<PaginationResult<any>> {
    const schoolId = await resolveSchoolId(schoolIdInput);
    const query: Record<string, any> = { schoolId };
    if (search) query.name = { $regex: search, $options: "i" };
    if (classId) {
      if (typeof classId === 'string') {
        query.classId = new Types.ObjectId(classId);
      } else {
        query.classId = classId;
      }
    }
    if (branchId) {
      query.branchId = new Types.ObjectId(branchId);
    } else if (allowedBranchIds && allowedBranchIds.length > 0) {
      query.branchId = { $in: allowedBranchIds.map((id: any) => new Types.ObjectId(id)) };
    }
    if (allowedSectionIds && allowedSectionIds.length > 0) {
      query._id = { $in: allowedSectionIds.map((id: any) => new Types.ObjectId(id)) };
    }

    const total = await Section.countDocuments(query);
    const data = await Section.find(query).populate("classId", "name").sort({ name: 1 }).skip((page - 1) * limit).limit(limit);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async createSection(schoolIdInput: string, input: any, userId?: string): Promise<any> {
    const schoolId = await resolveSchoolId(input.schoolId ?? schoolIdInput);
    const classId = toObjectId(input.classId);
    const classDoc = await Class.findOne({ _id: classId, schoolId });
    if (!classDoc) throw new ApiError(404, "Class not found for this school");

    const existing = await Section.findOne({ schoolId, classId, name: input.name });
    if (existing) throw new ApiError(409, "Section already exists for this class");

    return Section.create({
      schoolId,
      branchId: input.branchId ? new Types.ObjectId(input.branchId) : undefined,
      classId,
      name: input.name,
      classTeacherId: input.classTeacherId ? toObjectId(input.classTeacherId) : undefined,
      capacity: input.capacity,
      createdBy: userId,
      updatedBy: userId,
    });
  }

  static async updateSection(schoolIdInput: string, id: string, input: any, userId?: string): Promise<any> {
    const schoolId = await resolveSchoolId(schoolIdInput);
    const updatePayload: Record<string, unknown> = { ...input, updatedBy: userId };
    if (input.classId) {
      const classDoc = await Class.findOne({ _id: input.classId, schoolId });
      if (!classDoc) throw new ApiError(404, "Class not found for this school");
    }
    if (input.classTeacherId !== undefined) {
      updatePayload.classTeacherId = input.classTeacherId ? toObjectId(input.classTeacherId) : undefined;
    }
    const updated = await Section.findOneAndUpdate(
      { _id: id, schoolId },
      { $set: updatePayload },
      { new: true, runValidators: true },
    );
    if (!updated) throw new ApiError(404, "Section not found");
    return updated;
  }

  static async deleteSection(schoolIdInput: string, id: string): Promise<void> {
    const schoolId = await resolveSchoolId(schoolIdInput);
    const students = await Student.countDocuments({ schoolId, sectionId: id, isDeleted: { $ne: true } });
    if (students > 0) throw new ApiError(409, "Section cannot be deleted while students exist");

    const deleted = await Section.deleteOne({ _id: id, schoolId });
    if (deleted.deletedCount === 0) throw new ApiError(404, "Section not found");
  }

  // --- Subjects ---
  static async listSubjects(schoolIdInput: string, page: number, limit: number, search?: string, type?: string): Promise<PaginationResult<any>> {
    const schoolId = await resolveSchoolId(schoolIdInput);
    const query: Record<string, unknown> = { schoolId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }
    if (type) query.type = type;

    const total = await Subject.countDocuments(query);
    const data = await Subject.find(query)
      .populate('classId', 'name')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async createSubject(schoolIdInput: string, input: any, userId?: string): Promise<any> {
    const schoolId = await resolveSchoolId(input.schoolId ?? schoolIdInput);
    const code = (input.code || normalizeCode(input.name)).toUpperCase();
    const classId = new Types.ObjectId(input.classId);
    
    // Check if subject with SAME NAME already exists in THIS CLASS (case-insensitive)
    const existing = await Subject.findOne({ 
      schoolId, 
      classId, 
      name: { $regex: `^${input.name}$`, $options: 'i' }
    });
    if (existing) throw new ApiError(409, "Subject already exists in this class");

    try {
      return await Subject.create({
        schoolId,
        classId,
        name: input.name,
        code,
        description: input.description,
        type: input.type || "CORE",
        createdBy: userId,
        updatedBy: userId,
      });
    } catch (error: any) {
      // Handle any database errors
      if (error.code === 11000) {
        throw new ApiError(409, "Subject already exists in this class");
      }
      throw error;
    }
  }

  static async updateSubject(schoolIdInput: string, id: string, input: any, userId?: string): Promise<any> {
    const schoolId = await resolveSchoolId(schoolIdInput);
    const updatePayload: Record<string, unknown> = { ...input, updatedBy: userId };
    if (input.code) updatePayload.code = input.code.toUpperCase();
    const updated = await Subject.findOneAndUpdate(
      { _id: id, schoolId },
      { $set: updatePayload },
      { new: true, runValidators: true },
    );
    if (!updated) throw new ApiError(404, "Subject not found");
    return updated;
  }

  static async deleteSubject(schoolIdInput: string, id: string): Promise<void> {
    const schoolId = await resolveSchoolId(schoolIdInput);
    const deleted = await Subject.deleteOne({ _id: id, schoolId });
    if (deleted.deletedCount === 0) throw new ApiError(404, "Subject not found");
  }

  // --- Timetables ---
  static async listTimetables(schoolIdInput: string, page: number, limit: number, filters: { classId?: string; sectionId?: string; subjectId?: string; teacherId?: string; dayOfWeek?: string }): Promise<PaginationResult<any>> {
    const schoolId = await resolveSchoolId(schoolIdInput);
    const query: Record<string, unknown> = { schoolId, isDeleted: false };
    if (filters.classId) query.classId = filters.classId;
    if (filters.sectionId) query.sectionId = filters.sectionId;
    if (filters.subjectId) query.subjectId = filters.subjectId;
    if (filters.teacherId) query.teacherId = filters.teacherId;
    if (filters.dayOfWeek) query.dayOfWeek = filters.dayOfWeek;

    const total = await Timetable.countDocuments(query);
    const data = await Timetable.find(query)
      .populate("classId", "name")
      .populate("sectionId", "name")
      .populate("subjectId", "name code")
      .populate({ path: "teacherId", populate: { path: "userId", select: "firstName lastName email" } })
      .sort({ dayOfWeek: 1, startTime: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async createTimetable(schoolIdInput: string, input: any, userId?: string): Promise<any> {
    const schoolId = await resolveSchoolId(input.schoolId ?? schoolIdInput);
    const classId = toObjectId(input.classId);
    const sectionId = input.sectionId ? toObjectId(input.sectionId) : undefined;
    const subjectId = toObjectId(input.subjectId);
    const teacherId = toObjectId(input.teacherId);

    const classDoc = await Class.findOne({ _id: classId, schoolId });
    if (!classDoc) throw new ApiError(404, "Class not found");
    if (sectionId) {
      const sectionDoc = await Section.findOne({ _id: sectionId, schoolId, classId });
      if (!sectionDoc) throw new ApiError(404, "Section not found for the selected class");
    }
    const subjectDoc = await Subject.findOne({ _id: subjectId, schoolId });
    if (!subjectDoc) throw new ApiError(404, "Subject not found");
    const teacherDoc = await Employee.findOne({ _id: teacherId, schoolId });
    if (!teacherDoc) throw new ApiError(404, "Teacher not found");

    const clashQuery: Record<string, unknown> = {
      schoolId,
      classId,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
    };
    if (sectionId) clashQuery.sectionId = sectionId;
    const existing = await Timetable.findOne(clashQuery);
    if (existing) throw new ApiError(409, "Timetable slot already exists for this class and time");

    return Timetable.create({
      schoolId,
      classId,
      sectionId,
      subjectId,
      teacherId,
      dayOfWeek: input.dayOfWeek,
      startTime: input.startTime,
      endTime: input.endTime,
      room: input.room,
      createdBy: userId,
      updatedBy: userId,
    });
  }

  static async updateTimetable(schoolIdInput: string, id: string, input: any, userId?: string): Promise<any> {
    const schoolId = await resolveSchoolId(schoolIdInput);
    const updatePayload: Record<string, unknown> = { ...input, updatedBy: userId };
    if (input.classId) {
      const classDoc = await Class.findOne({ _id: input.classId, schoolId });
      if (!classDoc) throw new ApiError(404, "Class not found");
    }
    if (input.sectionId !== undefined) {
      if (input.sectionId) {
        const sectionDoc = await Section.findOne({ _id: input.sectionId, schoolId });
        if (!sectionDoc) throw new ApiError(404, "Section not found");
      }
    }
    if (input.subjectId) {
      const subjectDoc = await Subject.findOne({ _id: input.subjectId, schoolId });
      if (!subjectDoc) throw new ApiError(404, "Subject not found");
    }
    if (input.teacherId) {
      const teacherDoc = await Employee.findOne({ _id: input.teacherId, schoolId });
      if (!teacherDoc) throw new ApiError(404, "Teacher not found");
    }

    const updated = await Timetable.findOneAndUpdate(
      { _id: id, schoolId },
      { $set: updatePayload },
      { new: true, runValidators: true },
    );
    if (!updated) throw new ApiError(404, "Timetable entry not found");
    return updated;
  }

  static async deleteTimetable(schoolIdInput: string, id: string): Promise<void> {
    const schoolId = await resolveSchoolId(schoolIdInput);
    const deleted = await Timetable.deleteOne({ _id: id, schoolId });
    if (deleted.deletedCount === 0) throw new ApiError(404, "Timetable entry not found");
  }
}
