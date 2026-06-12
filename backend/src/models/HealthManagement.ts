import mongoose, { Schema, Document, Types } from 'mongoose';
import { IAuditFields, auditSchemaDefinition } from './common.js';

export interface IStudentMedicalProfile extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  bloodGroup?: string;
  allergies: string[];
  medicalConditions: string[];
  emergencyContacts: Array<{
    name: string;
    relation?: string;
    phone: string;
  }>;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  medicalNotes?: string;
  restrictedFoods: string[];
  createdAt: Date;
  updatedAt: Date;
}

const studentMedicalProfileSchema = new Schema<IStudentMedicalProfile>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    bloodGroup: { type: String },
    allergies: [{ type: String }],
    medicalConditions: [{ type: String }],
    emergencyContacts: [
      {
        name: { type: String, required: true },
        relation: { type: String },
        phone: { type: String, required: true },
      },
    ],
    insuranceProvider: { type: String },
    insurancePolicyNumber: { type: String },
    medicalNotes: { type: String },
    restrictedFoods: [{ type: String }],
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

studentMedicalProfileSchema.index({ schoolId: 1, studentId: 1 }, { unique: true });

export interface IVaccinationRecord extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  vaccineName: string;
  dateAdministered: Date;
  nextDueDate?: Date;
  verificationDocuments: string[];
  verifiedBy?: Types.ObjectId;
  notes?: string;
  status: 'DUE' | 'COMPLETED' | 'VERIFIED';
}

const vaccinationRecordSchema = new Schema<IVaccinationRecord>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    vaccineName: { type: String, required: true },
    dateAdministered: { type: Date, required: true },
    nextDueDate: { type: Date },
    verificationDocuments: [{ type: String }],
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
    status: { type: String, enum: ['DUE', 'COMPLETED', 'VERIFIED'], default: 'COMPLETED' },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

vaccinationRecordSchema.index({ schoolId: 1, studentId: 1, dateAdministered: -1 });
vaccinationRecordSchema.index({ schoolId: 1, nextDueDate: 1 });

export interface IClinicVisitLog extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  visitDate: Date;
  symptoms: string;
  diagnosis?: string;
  treatment?: string;
  followUpNotes?: string;
  attendedBy?: Types.ObjectId;
  temperature?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH';
}

const clinicVisitLogSchema = new Schema<IClinicVisitLog>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    visitDate: { type: Date, default: Date.now, required: true },
    symptoms: { type: String, required: true },
    diagnosis: { type: String },
    treatment: { type: String },
    followUpNotes: { type: String },
    attendedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    temperature: { type: String },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'LOW' },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

clinicVisitLogSchema.index({ schoolId: 1, studentId: 1, visitDate: -1 });

export interface IMedicationPlan extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  medicineName: string;
  dosage: string;
  schedule: string;
  startDate: Date;
  endDate?: Date;
  administrationHistory: Array<{
    administeredAt: Date;
    administeredBy?: Types.ObjectId;
    notes?: string;
  }>;
  instructions?: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
}

const medicationPlanSchema = new Schema<IMedicationPlan>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    medicineName: { type: String, required: true },
    dosage: { type: String, required: true },
    schedule: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    administrationHistory: [
      {
        administeredAt: { type: Date, required: true },
        administeredBy: { type: Schema.Types.ObjectId, ref: 'User' },
        notes: { type: String },
      },
    ],
    instructions: { type: String },
    status: { type: String, enum: ['ACTIVE', 'PAUSED', 'COMPLETED'], default: 'ACTIVE' },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

medicationPlanSchema.index({ schoolId: 1, studentId: 1, status: 1 });

export interface IHealthIncident extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  studentId?: Types.ObjectId;
  incidentType: string;
  location: string;
  description: string;
  witnesses: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  attachments: string[];
  reportedBy?: Types.ObjectId;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  incidentDate: Date;
}

const healthIncidentSchema = new Schema<IHealthIncident>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    incidentType: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    witnesses: [{ type: String }],
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW' },
    attachments: [{ type: String }],
    reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['OPEN', 'INVESTIGATING', 'RESOLVED'], default: 'OPEN' },
    incidentDate: { type: Date, default: Date.now },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

healthIncidentSchema.index({ schoolId: 1, incidentDate: -1 });

export interface IAnnualHealthCheckup extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  studentId: Types.ObjectId;
  checkupDate: Date;
  height?: number;
  weight?: number;
  bmi?: number;
  vision?: string;
  hearing?: string;
  dental?: string;
  generalAssessment?: string;
  comparisonNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const annualHealthCheckupSchema = new Schema<IAnnualHealthCheckup>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    checkupDate: { type: Date, default: Date.now, required: true },
    height: { type: Number },
    weight: { type: Number },
    bmi: { type: Number },
    vision: { type: String },
    hearing: { type: String },
    dental: { type: String },
    generalAssessment: { type: String },
    comparisonNotes: { type: String },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

annualHealthCheckupSchema.index({ schoolId: 1, studentId: 1, checkupDate: -1 });

export interface IHealthAlert extends Document, IAuditFields {
  schoolId: Types.ObjectId;
  title: string;
  message: string;
  alertType: 'ALLERGY' | 'EMERGENCY' | 'MEDICATION' | 'ADVISORY';
  targetStudentIds: Types.ObjectId[];
  targetUserIds: Types.ObjectId[];
  channels: string[];
  status: 'QUEUED' | 'SENT' | 'FAILED';
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const healthAlertSchema = new Schema<IHealthAlert>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    alertType: { type: String, enum: ['ALLERGY', 'EMERGENCY', 'MEDICATION', 'ADVISORY'], default: 'ADVISORY' },
    targetStudentIds: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
    targetUserIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    channels: [{ type: String }],
    status: { type: String, enum: ['QUEUED', 'SENT', 'FAILED'], default: 'QUEUED' },
    scheduledAt: { type: Date },
    ...auditSchemaDefinition,
  },
  { timestamps: true }
);

healthAlertSchema.index({ schoolId: 1, status: 1, createdAt: -1 });

export const StudentMedicalProfile = mongoose.model<IStudentMedicalProfile>('StudentMedicalProfile', studentMedicalProfileSchema);
export const VaccinationRecord = mongoose.model<IVaccinationRecord>('VaccinationRecord', vaccinationRecordSchema);
export const ClinicVisitLog = mongoose.model<IClinicVisitLog>('ClinicVisitLog', clinicVisitLogSchema);
export const MedicationPlan = mongoose.model<IMedicationPlan>('MedicationPlan', medicationPlanSchema);
export const HealthIncident = mongoose.model<IHealthIncident>('HealthIncident', healthIncidentSchema);
export const AnnualHealthCheckup = mongoose.model<IAnnualHealthCheckup>('AnnualHealthCheckup', annualHealthCheckupSchema);
export const HealthAlert = mongoose.model<IHealthAlert>('HealthAlert', healthAlertSchema);
