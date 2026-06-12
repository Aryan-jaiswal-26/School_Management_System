import { Branch } from '../models/Branch';
import { ApiError } from '../utils/api-error.js';
import { Types } from 'mongoose';

export const createBranch = async (data: {
  schoolId: Types.ObjectId;
  name: string;
  code: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
}) => {
  const branch = new Branch(data);
  return await branch.save();
};

export const getBranchById = async (id: Types.ObjectId) => {
  return await Branch.findById(id).exec();
};

export const listBranches = async (query: {
  schoolId: string | Types.ObjectId;
  page: number;
  limit: number;
  search?: string;
  allowedBranchIds?: Types.ObjectId[];
}) => {
  const { schoolId, page, limit, search, allowedBranchIds } = query;
  const match: any = {
    schoolId: new Types.ObjectId(schoolId),
    isDeleted: { $ne: true },
  };

  if (allowedBranchIds) {
    match._id = { $in: allowedBranchIds };
  }

  if (search) {
    match.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const total = await Branch.countDocuments(match);
  const data = await Branch.find(match)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit)
    .exec();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const updateBranch = async (id: Types.ObjectId, updates: Partial<any>) => {
  return await Branch.findByIdAndUpdate(id, updates, { new: true }).exec();
};

export const deleteBranch = async (id: Types.ObjectId) => {
  // Soft delete: set isDeleted flag
  return await Branch.findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() }, { new: true }).exec();
};

export const assignEntity = async (entityType: string, entityId: string, branchId: Types.ObjectId) => {
  const validTypes = ['student', 'teacher', 'staff', 'class', 'section'];
  if (!validTypes.includes(entityType)) {
    throw new ApiError(400, `Invalid entity type ${entityType}`);
  }
  const modelMap: Record<string, any> = {
    student: (await import('../models/Student.js')).default,
    teacher: (await import('../models/Employee.js')).default,
    staff: (await import('../models/Employee.js')).default,
    class: (await import('../models/Class.js')).default,
    section: (await import('../models/Section.js')).default,
  };
  const Model = modelMap[entityType];
  const doc = await Model.findByIdAndUpdate(entityId, { branchId }, { new: true }).exec();
  if (!doc) {
    throw new ApiError(404, `${entityType} not found`);
  }
  return doc;
};
