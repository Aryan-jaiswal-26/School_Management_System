import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { School } from '../models/School.js';
import { Role } from '../models/Role.js';
import { Permission } from '../models/Permission.js';
import { User } from '../models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.evm') });

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';

const permissionsList = [
  { name: 'MANAGE_SCHOOL', module: 'ADMINISTRATION', description: 'Manage school profile and settings' },
  { name: 'MANAGE_USERS', module: 'ADMINISTRATION', description: 'Manage system users' },
  { name: 'MANAGE_ACADEMICS', module: 'ACADEMICS', description: 'Manage academic configuration' },
  { name: 'MANAGE_EXAMS', module: 'ACADEMICS', description: 'Manage exams and results' },
  { name: 'MANAGE_COMMUNICATIONS', module: 'COMMUNICATIONS', description: 'Manage announcements and notices' },
  { name: 'MANAGE_TRANSPORT', module: 'TRANSPORT', description: 'Manage transport routes and tracking' },
  { name: 'MANAGE_LIBRARY', module: 'LIBRARY', description: 'Manage library inventory and circulation' },
  { name: 'MANAGE_FEES', module: 'FINANCE', description: 'Manage fee structures and payments' },
  { name: 'MANAGE_HR', module: 'HR', description: 'Manage staff leave, payroll, and documents' },
  { name: 'MANAGE_STUDENTS', module: 'STUDENT', description: 'Manage student records' },
  { name: 'VIEW_STUDENT', module: 'STUDENT', description: 'View student details' },
  { name: 'CREATE_STUDENT', module: 'STUDENT', description: 'Create new student' },
  { name: 'EDIT_STUDENT', module: 'STUDENT', description: 'Edit student details' },
  { name: 'DELETE_STUDENT', module: 'STUDENT', description: 'Delete student' },
  { name: 'VIEW_ATTENDANCE', module: 'ATTENDANCE', description: 'View attendance records' },
  { name: 'MARK_ATTENDANCE', module: 'ATTENDANCE', description: 'Mark student attendance' },
  { name: 'VIEW_FEES', module: 'FINANCE', description: 'View fee details' },
  { name: 'VIEW_REPORTS', module: 'REPORTING', description: 'View academic and financial reports' },
  { name: 'VIEW_ANALYTICS', module: 'REPORTING', description: 'View operational analytics' },
  { name: 'MANAGE_EVENTS', module: 'EVENTS', description: 'Manage events and culture content' },
  { name: 'MANAGE_HOSTEL', module: 'HOSTEL', description: 'Manage hostel rooms and operations' },
];

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    // 1. Seed Permissions
    console.log('Seeding permissions...');
    const permissionDocs = [];
    for (const perm of permissionsList) {
      const updatedPerm = await Permission.findOneAndUpdate(
        { name: perm.name },
        perm,
        { upsert: true, new: true }
      );
      permissionDocs.push(updatedPerm);
    }
    console.log(`${permissionDocs.length} permissions seeded.`);

    // 2. Create Default School
    let school = await School.findOne({ code: 'DEFAULT_SCH' });
    if (!school) {
      school = new School({
        name: 'Default International School',
        code: 'DEFAULT_SCH',
        contactEmail: 'contact@school.com',
        isActive: true,
      });
      await school.save();
      console.log('Default school created.');
    } else {
      console.log('Default school already exists.');
    }

    const permissionsByName = new Map(permissionDocs.map((permission) => [permission.name, permission]));

    // 3. Seed Roles
    console.log('Seeding roles for default school...');

    const allPermissionIds = permissionDocs.map((permission) => permission._id);

    // School Admin Role - all permissions
    const schoolAdminRole = await Role.findOneAndUpdate(
      { name: 'SCHOOL_ADMIN', schoolId: school._id },
      { 
        name: 'SCHOOL_ADMIN', 
        schoolId: school._id, 
        permissions: allPermissionIds
      },
      { upsert: true, new: true }
    );

    // Teacher Role
    const teacherPerms = [
      'VIEW_STUDENT',
      'VIEW_ATTENDANCE',
      'MARK_ATTENDANCE',
      'VIEW_FEES',
      'VIEW_REPORTS',
      'VIEW_ANALYTICS',
      'MANAGE_ACADEMICS',
      'MANAGE_EXAMS',
      'MANAGE_COMMUNICATIONS',
    ].map((permissionName) => permissionsByName.get(permissionName)).filter(Boolean);
    const teacherRole = await Role.findOneAndUpdate(
      { name: 'TEACHER', schoolId: school._id },
      { 
        name: 'TEACHER', 
        schoolId: school._id, 
        permissions: teacherPerms.map((permission) => permission!._id)
      },
      { upsert: true, new: true }
    );

    // Driver Role
    const driverPerms = [
      'VIEW_STUDENT',
      'VIEW_ATTENDANCE',
      'VIEW_REPORTS',
      'MANAGE_TRANSPORT',
    ].map((permissionName) => permissionsByName.get(permissionName)).filter(Boolean);
    const driverRole = await Role.findOneAndUpdate(
      { name: 'DRIVER', schoolId: school._id },
      {
        name: 'DRIVER',
        schoolId: school._id,
        permissions: driverPerms.map((permission) => permission!._id),
      },
      { upsert: true, new: true }
    );

    // Parent Role
    const parentPerms = [
      'VIEW_STUDENT',
      'VIEW_ATTENDANCE',
      'VIEW_FEES',
      'VIEW_REPORTS',
    ].map((permissionName) => permissionsByName.get(permissionName)).filter(Boolean);
    const parentRole = await Role.findOneAndUpdate(
      { name: 'PARENT', schoolId: school._id },
      { 
        name: 'PARENT', 
        schoolId: school._id, 
        permissions: parentPerms.map((permission) => permission!._id)
      },
      { upsert: true, new: true }
    );

    // Student Role
    const studentPerms = [
      'VIEW_STUDENT',
      'VIEW_ATTENDANCE',
      'VIEW_FEES',
      'VIEW_REPORTS',
    ].map((permissionName) => permissionsByName.get(permissionName)).filter(Boolean);
    const studentRole = await Role.findOneAndUpdate(
      { name: 'STUDENT', schoolId: school._id },
      { 
        name: 'STUDENT', 
        schoolId: school._id, 
        permissions: studentPerms.map((permission) => permission!._id)
      },
      { upsert: true, new: true }
    );

    // 4. Seed Users
    const demoUsers = [
      {
        email: 'admin@school.com',
        firstName: 'Priya',
        lastName: 'Menon',
        role: 'SCHOOL_ADMIN',
      },
      {
        email: 'teacher@school.com',
        firstName: 'Anita',
        lastName: 'Iyer',
        role: 'TEACHER',
      },
      {
        email: 'student@school.com',
        firstName: 'Aarav',
        lastName: 'Sharma',
        role: 'STUDENT',
      },
      {
        email: 'parent@school.com',
        firstName: 'Ramesh',
        lastName: 'Sharma',
        role: 'PARENT',
      },
      {
        email: 'schooladmin@school.com',
        firstName: 'Priya',
        lastName: 'Menon',
        role: 'SCHOOL_ADMIN',
      },
      {
        email: 'driver@school.com',
        firstName: 'Suresh',
        lastName: 'Kumar',
        role: 'DRIVER',
      },
    ] as const;

    for (const demoUser of demoUsers) {
      const passwordHash = await bcrypt.hash('123', 10);
      await User.findOneAndUpdate(
        { email: demoUser.email },
        {
          email: demoUser.email,
          passwordHash,
          firstName: demoUser.firstName,
          lastName: demoUser.lastName,
          role: demoUser.role,
          schoolId: school._id,
          isActive: true,
        },
        { upsert: true, new: true }
      );
    }

    console.log('Demo users normalized (all demo passwords set to 123).');
    
    console.log('Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
