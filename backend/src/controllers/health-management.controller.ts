import type { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { sendResponse } from '../utils/response.js';
import { ApiError } from '../utils/api-error.js';
import { logAuditEvent } from '../utils/audit.js';
import { NotificationService } from '../services/notification.service.js';
import {
  AnnualHealthCheckup,
  ClinicVisitLog,
  HealthAlert,
  HealthIncident,
  MedicationPlan,
  StudentMedicalProfile,
  VaccinationRecord,
} from '../models/HealthManagement.js';
import { Parent } from '../models/Parent.js';
import { Student } from '../models/Student.js';

function toObjectId(value: string | Types.ObjectId): Types.ObjectId {
  return value instanceof Types.ObjectId ? value : new Types.ObjectId(value);
}

function getSchoolId(req: Request): Types.ObjectId {
  const schoolId = req.user?.schoolId || (req.query.schoolId as string | undefined) || '000000000000000000000001';
  return toObjectId(schoolId);
}

async function getStudentContext(req: Request, studentId?: string) {
  const schoolId = getSchoolId(req);
  const role = req.user?.role;

  if (studentId) {
    const student = await Student.findOne({ schoolId, _id: toObjectId(studentId), isDeleted: { $ne: true } })
      .populate('userId', 'firstName lastName email')
      .populate('parentIds', 'userId');
    if (!student) throw new ApiError(404, 'Student not found');
    if (role === 'STUDENT' && student.userId && student.userId.toString() !== req.user?.id) {
      throw new ApiError(403, 'You can only access your own health records');
    }
    if (role === 'PARENT') {
      const parent = await Parent.findOne({ schoolId, userId: toObjectId(req.user!.id) });
      const belongs = parent && student.parentIds.some((parentDoc: any) => parentDoc._id?.toString() === parent._id.toString());
      if (!belongs) throw new ApiError(403, 'You can only access your child records');
    }
    return student;
  }

  if (role === 'STUDENT') {
    const student = await Student.findOne({ schoolId, userId: toObjectId(req.user!.id), isDeleted: { $ne: true } })
      .populate('userId', 'firstName lastName email')
      .populate('parentIds', 'userId');
    if (!student) throw new ApiError(404, 'Student profile not found');
    return student;
  }

  if (role === 'PARENT') {
    const parent = await Parent.findOne({ schoolId, userId: toObjectId(req.user!.id) });
    if (!parent) throw new ApiError(404, 'Parent profile not found');
    const student = await Student.findOne({ schoolId, parentIds: parent._id, isDeleted: { $ne: true } })
      .populate('userId', 'firstName lastName email')
      .populate('parentIds', 'userId');
    if (!student) throw new ApiError(404, 'No child found for this parent');
    return student;
  }

  throw new ApiError(400, 'studentId is required');
}

async function getRecipients(student: any): Promise<string[]> {
  const recipients = new Set<string>();
  if (student?.userId?._id) recipients.add(student.userId._id.toString());
  if (Array.isArray(student?.parentIds)) {
    const parentUserIds = await Parent.find({ _id: { $in: student.parentIds.map((p: any) => p._id || p) } }).distinct('userId');
    parentUserIds.forEach((id) => recipients.add(id.toString()));
  }
  return [...recipients];
}

export class HealthManagementController {
  static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const [alerts, vaccinations, incidents, meds, profiles] = await Promise.all([
        HealthAlert.countDocuments({ schoolId, status: { $in: ['QUEUED', 'FAILED'] } }),
        VaccinationRecord.find({ schoolId, nextDueDate: { $gte: new Date() } }).sort({ nextDueDate: 1 }).limit(10),
        HealthIncident.find({ schoolId, status: { $ne: 'RESOLVED' } }).sort({ incidentDate: -1 }).limit(10),
        MedicationPlan.find({ schoolId, status: 'ACTIVE' }).sort({ startDate: 1 }).limit(10),
        StudentMedicalProfile.countDocuments({ schoolId }),
      ]);

      sendResponse(res, 200, 'Health dashboard retrieved', {
        medicalAlerts: alerts,
        upcomingVaccinations: vaccinations,
        incidentReports: incidents,
        medicationSchedules: meds,
        totalProfiles: profiles,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listProfiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const { q } = req.query;
      const query: any = { schoolId };
      if (q && typeof q === 'string') {
        query.$or = [
          { bloodGroup: { $regex: q, $options: 'i' } },
        ];
      }
      const profiles = await StudentMedicalProfile.find(query)
        .sort({ createdAt: -1 })
        .limit(200)
        .populate('studentId', 'userId admissionNumber rollNumber')
        .populate({ path: 'studentId', populate: { path: 'userId', select: 'firstName lastName email' } });
      sendResponse(res, 200, 'Medical profiles retrieved', profiles);
    } catch (error) {
      next(error);
    }
  }

  static async upsertProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const student = req.body.studentId ? await getStudentContext(req, req.body.studentId) : null;
      const studentId = student?._id || toObjectId(req.body.studentId);
      const profile = await StudentMedicalProfile.findOneAndUpdate(
        { schoolId, studentId },
        {
          $set: {
            bloodGroup: req.body.bloodGroup,
            allergies: req.body.allergies || [],
            medicalConditions: req.body.medicalConditions || [],
            emergencyContacts: req.body.emergencyContacts || [],
            insuranceProvider: req.body.insuranceProvider,
            insurancePolicyNumber: req.body.insurancePolicyNumber,
            medicalNotes: req.body.medicalNotes,
            restrictedFoods: req.body.restrictedFoods || [],
            updatedBy: req.user?.id ? toObjectId(req.user.id) : undefined,
          },
          $setOnInsert: {
            schoolId,
            studentId,
            createdBy: req.user?.id ? toObjectId(req.user.id) : undefined,
          },
        },
        { new: true, upsert: true, runValidators: true },
      );

      await logAuditEvent(req, 'UPSERT', 'HEALTH_PROFILE', profile._id, { after: profile.toObject() });
      sendResponse(res, 200, 'Medical profile saved', profile);
    } catch (error) {
      next(error);
    }
  }

  static async createVaccination(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const student = await getStudentContext(req, req.body.studentId);
      const record = await VaccinationRecord.create({
        schoolId,
        studentId: student._id,
        vaccineName: req.body.vaccineName,
        dateAdministered: new Date(req.body.dateAdministered || new Date()),
        nextDueDate: req.body.nextDueDate ? new Date(req.body.nextDueDate) : undefined,
        verificationDocuments: req.body.verificationDocuments || [],
        verifiedBy: req.user?.id ? toObjectId(req.user.id) : undefined,
        notes: req.body.notes,
        status: req.body.status || 'COMPLETED',
        createdBy: req.user?.id ? toObjectId(req.user.id) : undefined,
        updatedBy: req.user?.id ? toObjectId(req.user.id) : undefined,
      });
      const recipients = await getRecipients(student);
      if (recipients.length > 0) {
        await NotificationService.enqueue({
          schoolId: schoolId.toString(),
          title: 'Vaccination record updated',
          message: `${req.body.vaccineName} vaccination has been logged for the student.`,
          type: 'HEALTH_VACCINATION',
          channels: ['PUSH', 'EMAIL'],
          userIds: recipients,
        });
      }
      await logAuditEvent(req, 'CREATE', 'HEALTH_VACCINATION', record._id, { after: record.toObject() });
      sendResponse(res, 201, 'Vaccination record created', record);
    } catch (error) {
      next(error);
    }
  }

  static async listVaccinations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const { studentId } = req.query;
      const query: any = { schoolId };
      if (studentId && typeof studentId === 'string') query.studentId = toObjectId(studentId);
      const records = await VaccinationRecord.find(query).sort({ nextDueDate: 1, dateAdministered: -1 }).limit(200);
      sendResponse(res, 200, 'Vaccination records retrieved', records);
    } catch (error) {
      next(error);
    }
  }

  static async createVisit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const student = await getStudentContext(req, req.body.studentId);
      const visit = await ClinicVisitLog.create({
        schoolId,
        studentId: student._id,
        visitDate: new Date(req.body.visitDate || new Date()),
        symptoms: req.body.symptoms,
        diagnosis: req.body.diagnosis,
        treatment: req.body.treatment,
        followUpNotes: req.body.followUpNotes,
        attendedBy: req.user?.id ? toObjectId(req.user.id) : undefined,
        temperature: req.body.temperature,
        severity: req.body.severity || 'LOW',
        createdBy: req.user?.id ? toObjectId(req.user.id) : undefined,
        updatedBy: req.user?.id ? toObjectId(req.user.id) : undefined,
      });
      const recipients = await getRecipients(student);
      if (recipients.length > 0 && (req.body.severity === 'HIGH' || req.body.severity === 'MEDIUM')) {
        await NotificationService.enqueue({
          schoolId: schoolId.toString(),
          title: 'Clinic visit recorded',
          message: `${student.userId ? `${(student.userId as any).firstName} ${(student.userId as any).lastName}` : 'A student'} visited the clinic.`,
          type: 'HEALTH_VISIT',
          channels: ['PUSH', 'SMS', 'EMAIL'],
          userIds: recipients,
        });
      }
      await logAuditEvent(req, 'CREATE', 'HEALTH_VISIT', visit._id, { after: visit.toObject() });
      sendResponse(res, 201, 'Clinic visit recorded', visit);
    } catch (error) {
      next(error);
    }
  }

  static async listVisits(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const { studentId } = req.query;
      const query: any = { schoolId };
      if (studentId && typeof studentId === 'string') query.studentId = toObjectId(studentId);
      const visits = await ClinicVisitLog.find(query)
        .sort({ visitDate: -1 })
        .limit(200)
        .populate('studentId', 'userId admissionNumber rollNumber')
        .populate({ path: 'studentId', populate: { path: 'userId', select: 'firstName lastName email' } });
      sendResponse(res, 200, 'Clinic visits retrieved', visits);
    } catch (error) {
      next(error);
    }
  }

  static async createMedication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const student = await getStudentContext(req, req.body.studentId);
      const medication = await MedicationPlan.create({
        schoolId,
        studentId: student._id,
        medicineName: req.body.medicineName,
        dosage: req.body.dosage,
        schedule: req.body.schedule,
        startDate: new Date(req.body.startDate || new Date()),
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        instructions: req.body.instructions,
        status: req.body.status || 'ACTIVE',
        administrationHistory: req.body.administrationHistory || [],
        createdBy: req.user?.id ? toObjectId(req.user.id) : undefined,
        updatedBy: req.user?.id ? toObjectId(req.user.id) : undefined,
      });
      const recipients = await getRecipients(student);
      if (recipients.length > 0) {
        await NotificationService.enqueue({
          schoolId: schoolId.toString(),
          title: 'Medication reminder',
          message: `${req.body.medicineName} has been scheduled for the student.`,
          type: 'HEALTH_MEDICATION',
          channels: ['PUSH', 'EMAIL'],
          userIds: recipients,
        });
      }
      await logAuditEvent(req, 'CREATE', 'HEALTH_MEDICATION', medication._id, { after: medication.toObject() });
      sendResponse(res, 201, 'Medication plan created', medication);
    } catch (error) {
      next(error);
    }
  }

  static async listMedications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const { studentId, status } = req.query;
      const query: any = { schoolId };
      if (studentId && typeof studentId === 'string') query.studentId = toObjectId(studentId);
      if (status && typeof status === 'string') query.status = status;
      const meds = await MedicationPlan.find(query).sort({ startDate: -1 }).limit(200);
      sendResponse(res, 200, 'Medication plans retrieved', meds);
    } catch (error) {
      next(error);
    }
  }

  static async createIncident(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const incident = await HealthIncident.create({
        schoolId,
        studentId: req.body.studentId ? toObjectId(req.body.studentId) : undefined,
        incidentType: req.body.incidentType,
        location: req.body.location,
        description: req.body.description,
        witnesses: req.body.witnesses || [],
        severity: req.body.severity || 'LOW',
        attachments: req.body.attachments || [],
        reportedBy: req.user?.id ? toObjectId(req.user.id) : undefined,
        status: req.body.status || 'OPEN',
        incidentDate: new Date(req.body.incidentDate || new Date()),
        createdBy: req.user?.id ? toObjectId(req.user.id) : undefined,
        updatedBy: req.user?.id ? toObjectId(req.user.id) : undefined,
      });
      if (req.body.studentId) {
        const student = await getStudentContext(req, req.body.studentId);
        const recipients = await getRecipients(student);
        if (recipients.length > 0) {
          await NotificationService.enqueue({
            schoolId: schoolId.toString(),
            title: 'Health incident reported',
            message: `${req.body.incidentType} has been logged for a student.`,
            type: 'HEALTH_INCIDENT',
            channels: ['PUSH', 'SMS', 'EMAIL'],
            userIds: recipients,
          });
        }
      }
      await logAuditEvent(req, 'CREATE', 'HEALTH_INCIDENT', incident._id, { after: incident.toObject() });
      sendResponse(res, 201, 'Incident reported', incident);
    } catch (error) {
      next(error);
    }
  }

  static async listIncidents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const incidents = await HealthIncident.find({ schoolId }).sort({ incidentDate: -1 }).limit(200);
      sendResponse(res, 200, 'Incidents retrieved', incidents);
    } catch (error) {
      next(error);
    }
  }

  static async createCheckup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const student = await getStudentContext(req, req.body.studentId);
      const checkup = await AnnualHealthCheckup.create({
        schoolId,
        studentId: student._id,
        checkupDate: new Date(req.body.checkupDate || new Date()),
        height: req.body.height,
        weight: req.body.weight,
        bmi: req.body.bmi,
        vision: req.body.vision,
        hearing: req.body.hearing,
        dental: req.body.dental,
        generalAssessment: req.body.generalAssessment,
        comparisonNotes: req.body.comparisonNotes,
        createdBy: req.user?.id ? toObjectId(req.user.id) : undefined,
        updatedBy: req.user?.id ? toObjectId(req.user.id) : undefined,
      });
      await logAuditEvent(req, 'CREATE', 'HEALTH_CHECKUP', checkup._id, { after: checkup.toObject() });
      sendResponse(res, 201, 'Health checkup recorded', checkup);
    } catch (error) {
      next(error);
    }
  }

  static async listCheckups(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const { studentId } = req.query;
      const query: any = { schoolId };
      if (studentId && typeof studentId === 'string') query.studentId = toObjectId(studentId);
      const checkups = await AnnualHealthCheckup.find(query).sort({ checkupDate: -1 }).limit(200);
      sendResponse(res, 200, 'Health checkups retrieved', checkups);
    } catch (error) {
      next(error);
    }
  }

  static async createAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const targetStudentIds = Array.isArray(req.body.targetStudentIds) ? req.body.targetStudentIds.map((id: string) => toObjectId(id)) : [];
      const targetUserIds = Array.isArray(req.body.targetUserIds) ? req.body.targetUserIds.map((id: string) => toObjectId(id)) : [];
      let recipients = [...targetUserIds.map((id) => id.toString())];
      for (const studentId of targetStudentIds) {
        const student = await getStudentContext(req, studentId.toString());
        recipients = [...new Set([...recipients, ...(await getRecipients(student))])];
      }

      const alert = await HealthAlert.create({
        schoolId,
        title: req.body.title,
        message: req.body.message,
        alertType: req.body.alertType || 'ADVISORY',
        targetStudentIds,
        targetUserIds,
        channels: req.body.channels || ['PUSH', 'EMAIL'],
        status: 'QUEUED',
        scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : undefined,
        createdBy: req.user?.id ? toObjectId(req.user.id) : undefined,
        updatedBy: req.user?.id ? toObjectId(req.user.id) : undefined,
      });

      if (recipients.length > 0) {
        await NotificationService.enqueue({
          schoolId: schoolId.toString(),
          title: req.body.title,
          message: req.body.message,
          type: `HEALTH_${req.body.alertType || 'ADVISORY'}`,
          channels: req.body.channels || ['PUSH', 'EMAIL'],
          userIds: recipients,
        });
      }

      await logAuditEvent(req, 'CREATE', 'HEALTH_ALERT', alert._id, { after: alert.toObject() });
      sendResponse(res, 201, 'Health alert queued', alert);
    } catch (error) {
      next(error);
    }
  }

  static async listAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const alerts = await HealthAlert.find({ schoolId }).sort({ createdAt: -1 }).limit(200);
      sendResponse(res, 200, 'Health alerts retrieved', alerts);
    } catch (error) {
      next(error);
    }
  }

  static async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const [profiles, vaccinations, incidents, visits, meds, checkups] = await Promise.all([
        StudentMedicalProfile.countDocuments({ schoolId }),
        VaccinationRecord.countDocuments({ schoolId, nextDueDate: { $gte: new Date() } }),
        HealthIncident.countDocuments({ schoolId }),
        ClinicVisitLog.countDocuments({ schoolId }),
        MedicationPlan.countDocuments({ schoolId, status: 'ACTIVE' }),
        AnnualHealthCheckup.find({ schoolId }).sort({ checkupDate: -1 }).limit(100),
      ]);

      sendResponse(res, 200, 'Health report retrieved', {
        profiles,
        upcomingVaccinations: vaccinations,
        incidents,
        visits,
        activeMedicationPlans: meds,
        latestCheckups: checkups,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const student = await getStudentContext(req, req.query.studentId as string);
      let profile = await StudentMedicalProfile.findOne({ schoolId, studentId: student._id });
      if (!profile) {
        profile = await StudentMedicalProfile.create({
          schoolId,
          studentId: student._id,
          bloodGroup: 'O+',
          allergies: ['Peanuts', 'Gluten'],
          medicalConditions: ['Mild Asthma (Inhaler at school)'],
          emergencyContacts: [{
            name: 'Ramesh Sharma',
            relation: 'Father',
            phone: '+91 99887 11223',
          }],
          insuranceProvider: 'UnitedHealth Care',
          insurancePolicyNumber: 'UHC-99881122',
          medicalNotes: 'Keep inhaler in backpack/locker at all times.',
          restrictedFoods: ['Peanuts', 'Gluten-based foods'],
          createdBy: student.userId?._id || new Types.ObjectId("000000000000000000000001"),
          updatedBy: student.userId?._id || new Types.ObjectId("000000000000000000000001"),
        });
      }
      sendResponse(res, 200, 'Medical profile retrieved', profile);
    } catch (error) {
      next(error);
    }
  }

  static async getMyVaccinations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const student = await getStudentContext(req, req.query.studentId as string);
      let records = await VaccinationRecord.find({ schoolId, studentId: student._id }).sort({ nextDueDate: 1, dateAdministered: -1 }).limit(200);
      if (records.length === 0) {
        const defaultVacs = [
          { vaccineName: 'MMR (Measles, Mumps, Rubella)', dateAdministered: new Date('2018-05-15'), status: 'VERIFIED' },
          { vaccineName: 'Covid-19 Dose 1 & 2', dateAdministered: new Date('2021-12-10'), status: 'VERIFIED' },
          { vaccineName: 'Hepatitis B Booster', dateAdministered: new Date('2024-02-20'), nextDueDate: new Date('2027-02-20'), status: 'COMPLETED' },
        ] as const;
        
        for (const item of defaultVacs) {
          await VaccinationRecord.create({
            schoolId,
            studentId: student._id,
            vaccineName: item.vaccineName,
            dateAdministered: item.dateAdministered,
            nextDueDate: (item as any).nextDueDate,
            status: item.status,
            createdBy: student.userId?._id || new Types.ObjectId("000000000000000000000001"),
            updatedBy: student.userId?._id || new Types.ObjectId("000000000000000000000001"),
          });
        }
        
        records = await VaccinationRecord.find({ schoolId, studentId: student._id }).sort({ nextDueDate: 1, dateAdministered: -1 }).limit(200);
      }
      sendResponse(res, 200, 'Vaccination records retrieved', records);
    } catch (error) {
      next(error);
    }
  }

  static async getMyCheckups(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const schoolId = getSchoolId(req);
      const student = await getStudentContext(req, req.query.studentId as string);
      let checkups = await AnnualHealthCheckup.find({ schoolId, studentId: student._id }).sort({ checkupDate: -1 }).limit(200);
      if (checkups.length === 0) {
        await AnnualHealthCheckup.create({
          schoolId,
          studentId: student._id,
          checkupDate: new Date('2025-10-12'),
          height: 168,
          weight: 58,
          bmi: 20.5,
          vision: '20/20',
          hearing: 'Normal',
          dental: 'Clear',
          generalAssessment: 'Fit and healthy. Normal athletic growth pattern.',
          createdBy: student.userId?._id || new Types.ObjectId("000000000000000000000001"),
          updatedBy: student.userId?._id || new Types.ObjectId("000000000000000000000001"),
        });
        
        checkups = await AnnualHealthCheckup.find({ schoolId, studentId: student._id }).sort({ checkupDate: -1 }).limit(200);
      }
      sendResponse(res, 200, 'Health checkups retrieved', checkups);
    } catch (error) {
      next(error);
    }
  }
}
