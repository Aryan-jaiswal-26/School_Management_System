const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  logoUrl: { type: String },
  theme: { type: Object, default: {} },
  subscriptionTier: { type: String, enum: ['basic', 'pro', 'enterprise'], default: 'basic' },
  features: {
    enableTransport: { type: Boolean, default: true },
    enableHostel: { type: Boolean, default: false },
    enableLibrary: { type: Boolean, default: true },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const academicYearSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  name: { type: String, required: true }, // e.g. "2023-2024"
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: false },
}, { timestamps: true });

const classSectionSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  grade: { type: String, required: true }, // e.g. "Grade 1"
  section: { type: String, required: true }, // e.g. "A"
  capacity: { type: Number, default: 30 },
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
}, { timestamps: true });

const subjectSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  name: { type: String, required: true },
  code: { type: String, required: true },
  type: { type: String, enum: ['CORE', 'LAB', 'ELECTIVE'], default: 'CORE' },
}, { timestamps: true });

const timetableSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  classSectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassSection', required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dayOfWeek: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "10:00"
}, { timestamps: true });

const leaveApplicationSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
}, { timestamps: true });

module.exports = {
  School: mongoose.model('School', schoolSchema),
  AcademicYear: mongoose.model('AcademicYear', academicYearSchema),
  ClassSection: mongoose.model('ClassSection', classSectionSchema),
  Subject: mongoose.model('Subject', subjectSchema),
  Timetable: mongoose.model('Timetable', timetableSchema),
  LeaveApplication: mongoose.model('LeaveApplication', leaveApplicationSchema),
};
