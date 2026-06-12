import { School, ISchool } from '../models/School.js';
import { AcademicYear, IAcademicYear } from '../models/AcademicYear.js';
import { Semester, ISemester } from '../models/Semester.js';
import { Branch, IBranch } from '../models/Branch.js';
import { ApiError } from '../utils/api-error.js';
import { Subscription } from '../models/Subscription.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { Invoice } from '../models/Invoice.js';
import { Types } from 'mongoose';

interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class SchoolService {
  // --- Schools ---
  
  static async createSchool(data: Partial<ISchool>): Promise<ISchool> {
    const existing = await School.findOne({ code: data.code, isDeleted: false });
    if (existing) {
      throw new ApiError(409, 'School with this code already exists');
    }
    const school = new School(data);
    return school.save();
  }

  static async updateSchool(id: string, data: Partial<ISchool>): Promise<ISchool> {
    const school = await School.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!school) throw new ApiError(404, 'School not found');
    return school;
  }

  static async getSchoolById(id: string): Promise<ISchool> {
    const school = await School.findOne({ _id: id, isDeleted: false });
    if (!school) throw new ApiError(404, 'School not found');
    return school;
  }

  static async listSchools(page: number, limit: number, search?: string, isActive?: boolean): Promise<PaginationResult<ISchool>> {
    const query: any = { isDeleted: false };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    const total = await School.countDocuments(query);
    const data = await School.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ name: 1 });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  static async deleteSchool(id: string): Promise<void> {
    const school = await School.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );
    if (!school) throw new ApiError(404, 'School not found');
  }

  // --- Academic Years ---

  static async createAcademicYear(data: Partial<IAcademicYear>): Promise<IAcademicYear> {
    if (data.isCurrent && data.schoolId) {
      await AcademicYear.updateMany(
        { schoolId: data.schoolId, isDeleted: false },
        { $set: { isCurrent: false } }
      );
    }
    const ay = new AcademicYear(data);
    return ay.save();
  }

  static async updateAcademicYear(id: string, data: Partial<IAcademicYear>): Promise<IAcademicYear> {
    if (data.isCurrent) {
      const ay = await AcademicYear.findById(id);
      if (ay) {
        await AcademicYear.updateMany(
          { schoolId: ay.schoolId, _id: { $ne: id }, isDeleted: false },
          { $set: { isCurrent: false } }
        );
      }
    }
    const ay = await AcademicYear.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!ay) throw new ApiError(404, 'Academic Year not found');
    return ay;
  }

  static async listAcademicYears(schoolId: string, page: number, limit: number, search?: string, isActive?: boolean): Promise<PaginationResult<IAcademicYear>> {
    const query: any = { schoolId, isDeleted: false };
    if (search) query.name = { $regex: search, $options: 'i' };
    if (isActive !== undefined) query.isActive = isActive;

    const total = await AcademicYear.countDocuments(query);
    const data = await AcademicYear.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ startDate: -1 });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async deleteAcademicYear(id: string): Promise<void> {
    const ay = await AcademicYear.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );
    if (!ay) throw new ApiError(404, 'Academic Year not found');
  }

  // --- Semesters ---

  static async createSemester(data: Partial<ISemester>): Promise<ISemester> {
    const semester = new Semester(data);
    return semester.save();
  }

  static async updateSemester(id: string, data: Partial<ISemester>): Promise<ISemester> {
    const semester = await Semester.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!semester) throw new ApiError(404, 'Semester not found');
    return semester;
  }

  static async listSemesters(schoolId: string, page: number, limit: number, search?: string, isActive?: boolean, academicYearId?: string): Promise<PaginationResult<ISemester>> {
    const query: any = { schoolId, isDeleted: false };
    if (search) query.name = { $regex: search, $options: 'i' };
    if (isActive !== undefined) query.isActive = isActive;
    if (academicYearId) query.academicYearId = academicYearId;

    const total = await Semester.countDocuments(query);
    const data = await Semester.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ startDate: 1 });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async deleteSemester(id: string): Promise<void> {
    const sem = await Semester.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );
    if (!sem) throw new ApiError(404, 'Semester not found');
  }

  // --- Branches ---

  static async createBranch(data: Partial<IBranch>): Promise<IBranch> {
    const existing = await Branch.findOne({ schoolId: data.schoolId, code: data.code, isDeleted: false });
    if (existing) {
      throw new ApiError(409, 'Branch with this code already exists in this school');
    }
    const branch = new Branch(data);
    return branch.save();
  }

  static async updateBranch(id: string, data: Partial<IBranch>): Promise<IBranch> {
    const branch = await Branch.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!branch) throw new ApiError(404, 'Branch not found');
    return branch;
  }

  static async listBranches(schoolId: string, page: number, limit: number, search?: string, isActive?: boolean): Promise<PaginationResult<IBranch>> {
    const query: any = { schoolId, isDeleted: false };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    if (isActive !== undefined) query.isActive = isActive;

    const total = await Branch.countDocuments(query);
    const data = await Branch.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ name: 1 });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async deleteBranch(id: string): Promise<void> {
    const branch = await Branch.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );
    if (!branch) throw new ApiError(404, 'Branch not found');
  }

  static async subscribeSchool(
    schoolId: string, 
    planCode: string, 
    durationMonths: number, 
    amount: number, 
    paymentMethod: string,
    transactionId?: string
  ): Promise<any> {
    const school = await School.findOne({ _id: schoolId, isDeleted: false });
    if (!school) throw new ApiError(404, 'School not found');

    // Find the subscription plan
    // Try to find by code first
    let plan = await SubscriptionPlan.findOne({ code: planCode.toUpperCase() });
    
    // Fallback if not found by code
    if (!plan) {
      plan = await SubscriptionPlan.findOne();
    }

    // If still not found, create a default plan
    if (!plan) {
      plan = await SubscriptionPlan.create({
        name: planCode === 'paid' ? 'Paid Plan' : 'Free Plan',
        code: planCode === 'paid' ? 'STANDARD' : 'BASIC',
        price: planCode === 'paid' ? 1299 : 0,
        billingCycle: 'MONTHLY',
        features: ['LMS', 'ATTENDANCE', 'GRADEBOOK'],
        limits: {
          maxStudents: planCode === 'paid' ? 500 : 50,
          maxTeachers: planCode === 'paid' ? 50 : 5,
          maxStorageBytes: (planCode === 'paid' ? 50 : 1) * 1024 * 1024 * 1024
        }
      });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // Update or create subscription
    const subscription = await Subscription.findOneAndUpdate(
      { schoolId },
      {
        schoolId,
        planId: plan._id,
        status: 'ACTIVE',
        startDate,
        endDate,
        trialEndsAt: plan.code === 'FREE_TRIAL' ? endDate : undefined
      },
      { upsert: true, new: true }
    );

    // Generate Invoice Number
    const invoiceNumber = transactionId || `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // Create Invoice
    const invoice = await Invoice.create({
      schoolId,
      subscriptionId: subscription._id,
      invoiceNumber,
      amount,
      taxAmount: amount * 0.18,
      totalAmount: amount * 1.18,
      currency: 'INR',
      status: 'PAID', // Let's record it as PAID since they paid in the wizard
      dueDate: new Date(),
      paidAt: new Date(),
      paymentMethod: paymentMethod.toUpperCase(),
      paymentGatewayRef: transactionId || `TXN-${Date.now()}`,
      billingDetails: {
        schoolName: school.name,
        email: school.contactEmail || 'billing@school.com',
      },
      lineItems: [
        {
          description: `${plan.name} - ${durationMonths} Month(s) Subscription`,
          quantity: 1,
          unitPrice: amount,
          amount
        }
      ]
    });

    return { subscription, invoice };
  }

  static async getSchoolSubscription(schoolId: string): Promise<any> {
    const sub = await Subscription.findOne({ schoolId }).populate('planId');
    if (!sub) {
      // Find or create default FREE_TRIAL plan
      let defaultPlan = await SubscriptionPlan.findOne({ code: 'FREE_TRIAL' });
      if (!defaultPlan) {
        defaultPlan = await SubscriptionPlan.findOne();
      }
      if (!defaultPlan) {
        defaultPlan = await SubscriptionPlan.create({
          name: 'Free Trial',
          code: 'FREE_TRIAL',
          price: 0,
          billingCycle: 'MONTHLY',
          features: ['LMS', 'ATTENDANCE', 'GRADEBOOK'],
          limits: { 
            maxStudents: 50, 
            maxTeachers: 5, 
            maxStorageBytes: 1 * 1024 * 1024 * 1024 
          }
        });
      }
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      
      return Subscription.create({
        schoolId: new Types.ObjectId(schoolId),
        planId: defaultPlan._id,
        status: 'TRIALING',
        startDate,
        endDate,
        trialEndsAt: endDate
      });
    }
    return sub;
  }

  static async getSchoolInvoices(schoolId: string): Promise<any> {
    return Invoice.find({ schoolId }).sort({ createdAt: -1 });
  }
}
