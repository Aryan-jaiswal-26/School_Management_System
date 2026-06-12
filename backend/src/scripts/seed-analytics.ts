import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import {
  School,
  SubscriptionPlan,
  Subscription,
  Invoice,
  Payment,
  User,
  ActivityLog,
  Student,
  Parent,
  Class,
  Section
} from '../models/index.js';
import { Employee } from '../models/Employee.js';

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/school_management';

async function seed() {
  try {
    console.log('Connecting to MongoDB at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // 1. Create Plans if they don't exist
    console.log('Checking subscription plans...');
    const plansData = [
      { name: 'Trial Plan', code: 'FREE_TRIAL', price: 0, billingCycle: 'MONTHLY' as const, features: ['LMS'], limits: { maxStudents: 50, maxTeachers: 5, maxStorageBytes: 100000000 } },
      { name: 'Basic Plan', code: 'BASIC', price: 99, billingCycle: 'MONTHLY' as const, features: ['LMS', 'CHAT'], limits: { maxStudents: 200, maxTeachers: 15, maxStorageBytes: 1000000000 } },
      { name: 'Standard Plan', code: 'STANDARD', price: 299, billingCycle: 'MONTHLY' as const, features: ['LMS', 'CHAT', 'TRANSPORT'], limits: { maxStudents: 1000, maxTeachers: 50, maxStorageBytes: 10000000000 } },
      { name: 'Premium Plan', code: 'PREMIUM', price: 599, billingCycle: 'MONTHLY' as const, features: ['LMS', 'CHAT', 'TRANSPORT', 'HOSTEL', 'ANALYTICS'], limits: { maxStudents: 2500, maxTeachers: 120, maxStorageBytes: 25000000000 } },
      { name: 'Enterprise Plan', code: 'ENTERPRISE', price: 1199, billingCycle: 'MONTHLY' as const, features: ['LMS', 'CHAT', 'TRANSPORT', 'HOSTEL', 'ANALYTICS', 'API_ACCESS'], limits: { maxStudents: 10000, maxTeachers: 500, maxStorageBytes: 100000000000 } },
    ];

    const plans: Record<string, any> = {};
    for (const planData of plansData) {
      let plan = await SubscriptionPlan.findOne({ code: planData.code });
      if (!plan) {
        plan = await SubscriptionPlan.create({ ...planData, isActive: true });
        console.log(`Created plan: ${planData.name}`);
      } else {
        console.log(`Plan already exists: ${planData.name}`);
      }
      plans[planData.code] = plan;
    }

    // 2. Create Schools and Subscriptions
    console.log('Checking schools and subscriptions...');
    const schoolsData = [
      { name: 'Greenwood High School', code: 'GHS-001', planCode: 'ENTERPRISE', subStatus: 'ACTIVE' as const, status: 'ACTIVE' as const },
      { name: 'St. Mary School', code: 'SMS-002', planCode: 'PREMIUM', subStatus: 'ACTIVE' as const, status: 'ACTIVE' as const },
      { name: 'Oakwood Academy', code: 'OAK-003', planCode: 'STANDARD', subStatus: 'ACTIVE' as const, status: 'ACTIVE' as const },
      { name: 'Global International School', code: 'GIS-004', planCode: 'BASIC', subStatus: 'ACTIVE' as const, status: 'ACTIVE' as const },
      { name: 'Pinecrest Academy', code: 'PAC-005', planCode: 'BASIC', subStatus: 'CANCELED' as const, status: 'SUSPENDED' as const },
    ];

    const passwordHash = await bcrypt.hash('admin123', 10);
    const now = new Date();

    for (const sData of schoolsData) {
      let school = await School.findOne({ code: sData.code });
      if (!school) {
        school = await School.create({
          name: sData.name,
          code: sData.code,
          contactEmail: `admin@${sData.code.toLowerCase()}.com`,
          status: sData.status,
          isActive: sData.status === 'ACTIVE',
        });
        console.log(`Created school: ${sData.name}`);
      } else {
        // Ensure status matches
        school.status = sData.status;
        school.isActive = sData.status === 'ACTIVE';
        await school.save();
        console.log(`School already exists: ${sData.name}`);
      }

      // Create subscription
      let sub = await Subscription.findOne({ schoolId: school._id });
      const plan = plans[sData.planCode];
      
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 5); // 5 months ago
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      if (!sub) {
        sub = await Subscription.create({
          schoolId: school._id,
          planId: plan._id,
          status: sData.subStatus,
          startDate,
          endDate,
        });
        console.log(`Created subscription for ${sData.name} (${sData.subStatus})`);
      } else {
        sub.status = sData.subStatus;
        sub.planId = plan._id;
        await sub.save();
      }

      // Seed Users for this school (1 Admin, 3 Teachers, 10 Students, 10 Parents)
      console.log(`Checking users for school: ${sData.name}`);
      const roles = ['SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] as const;

      // School Admin
      const adminEmail = `admin@${sData.code.toLowerCase()}.com`;
      let adminUser = await User.findOne({ email: adminEmail });
      if (!adminUser) {
        adminUser = await User.create({
          schoolId: school._id,
          email: adminEmail,
          passwordHash,
          firstName: 'School',
          lastName: 'Admin',
          role: 'SCHOOL_ADMIN',
          isActive: true,
        });
      }

      // Teachers
      const teachers: any[] = [];
      for (let i = 1; i <= 3; i++) {
        const email = `teacher${i}@${sData.code.toLowerCase()}.com`;
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            schoolId: school._id,
            email,
            passwordHash,
            firstName: 'Teacher',
            lastName: `${i}`,
            role: 'TEACHER',
            isActive: true,
          });
          
          await Employee.create({
            schoolId: school._id,
            userId: user._id,
            employeeId: `EMP-${sData.code}-${i}`,
            employeeType: 'TEACHING',
            designation: 'Teacher',
            joiningDate: new Date(),
            isActive: true,
            createdBy: adminUser._id,
            updatedBy: adminUser._id
          });
        }
        teachers.push(user);
      }

      // Create Class and Section for this school first
      let classDoc = await Class.findOne({ schoolId: school._id, name: '10' });
      if (!classDoc) {
        classDoc = await Class.create({ schoolId: school._id, name: '10' });
      }
      let sectionDoc = await Section.findOne({ schoolId: school._id, classId: classDoc._id, name: 'A' });
      if (!sectionDoc) {
        sectionDoc = await Section.create({ schoolId: school._id, classId: classDoc._id, name: 'A' });
      }

      // Students & Parents
      const students: any[] = [];
      for (let i = 1; i <= 10; i++) {
        const email = `student${i}@${sData.code.toLowerCase()}.com`;
        let studentUser = await User.findOne({ email });
        if (!studentUser) {
          studentUser = await User.create({
            schoolId: school._id,
            email,
            passwordHash,
            firstName: 'Student',
            lastName: `${i}`,
            role: 'STUDENT',
            isActive: true,
          });

          await Student.create({
            schoolId: school._id,
            userId: studentUser._id,
            admissionNumber: `ADM-${sData.code}-${100 + i}`,
            rollNumber: `${i}`,
            classId: classDoc._id,
            sectionId: sectionDoc._id,
            dob: new Date('2012-05-15'),
            gender: 'MALE',
            isActive: true,
            createdBy: adminUser._id,
            updatedBy: adminUser._id
          });
        }
        students.push(studentUser);

        // Parent
        const parentEmail = `parent${i}@${sData.code.toLowerCase()}.com`;
        let parentUser = await User.findOne({ email: parentEmail });
        if (!parentUser) {
          parentUser = await User.create({
            schoolId: school._id,
            email: parentEmail,
            passwordHash,
            firstName: 'Parent',
            lastName: `${i}`,
            role: 'PARENT',
            isActive: true,
          });

          await Parent.create({
            schoolId: school._id,
            userId: parentUser._id,
            contactPrimary: '9876543210',
            createdBy: adminUser._id,
            updatedBy: adminUser._id
          });
        }
      }

      // Seed Invoices and Payments for the last 5 months
      console.log(`Seeding invoice history for ${sData.name}`);
      for (let m = 5; m >= 0; m--) {
        const invDate = new Date();
        invDate.setMonth(invDate.getMonth() - m);
        invDate.setDate(1); // First of the month

        const invoiceNumber = `INV-${sData.code}-${invDate.getFullYear()}-${invDate.getMonth() + 1}`;
        let invoice = await Invoice.findOne({ invoiceNumber });

        // For Pinecrest school, it canceled 2 months ago, so no invoices for the last 2 months
        if (sData.subStatus === 'CANCELED' && m < 2) {
          continue;
        }

        const isPinecrestChurnMonth = sData.subStatus === 'CANCELED' && m === 2; // Canceled 2 months ago
        const status = isPinecrestChurnMonth ? 'OVERDUE' : 'PAID';

        if (!invoice) {
          invoice = await Invoice.create({
            schoolId: school._id,
            subscriptionId: sub._id,
            invoiceNumber,
            amount: plan.price,
            taxAmount: 0,
            totalAmount: plan.price,
            currency: 'USD',
            status,
            dueDate: new Date(invDate.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days due
            paidAt: status === 'PAID' ? invDate : undefined,
            billingDetails: { schoolName: school.name, email: school.contactEmail },
            lineItems: [{ description: `${plan.name} Subscription`, quantity: 1, unitPrice: plan.price, amount: plan.price }],
          });
        } else {
          invoice.status = status;
          invoice.amount = plan.price;
          invoice.totalAmount = plan.price;
          await invoice.save();
        }

        // If paid, log a Payment
        if (status === 'PAID') {
          const transactionId = `TXN-${sData.code}-${invDate.getTime()}`;
          let payment = await Payment.findOne({ transactionId });
          if (!payment) {
            await Payment.create({
              schoolId: school._id,
              feeId: new mongoose.Types.ObjectId(), // Schema compliance
              studentId: new mongoose.Types.ObjectId(), // Schema compliance
              amountPaid: plan.price,
              paymentDate: invDate,
              paymentMethod: 'ONLINE',
              transactionId,
              status: 'SUCCESS',
              remarks: 'Subscription payment',
            });
          }
        }
      }

      // Seed Activity Logs for the last 30 days
      console.log(`Seeding activity logs for ${sData.name}`);
      const schoolUsers = await User.find({ schoolId: school._id });
      
      // Determine school login probability
      let loginProb = 0.5; // Default 50%
      if (sData.code === 'GHS-001') loginProb = 0.9; // Greenwood High - 90%
      if (sData.code === 'SMS-002') loginProb = 0.75; // St. Mary - 75%
      if (sData.code === 'OAK-003') loginProb = 0.45; // Oakwood - 45%
      if (sData.code === 'GIS-004') loginProb = 0.6; // Global - 60%
      if (sData.code === 'PAC-005') loginProb = 0.1; // Pinecrest (low, declining to churn)

      // Clean existing activity logs for these users to prevent explosion
      await ActivityLog.deleteMany({ userId: { $in: schoolUsers.map(u => u._id) } });

      const logsToInsert = [];
      for (let day = 30; day >= 0; day--) {
        const logDate = new Date();
        logDate.setDate(logDate.getDate() - day);

        // For Pinecrest, after day 15 (15 days ago), it churned completely (0 logins)
        if (sData.code === 'PAC-005' && day < 15) {
          continue;
        }

        // Adjust Pinecrest probability for the first 15 days to be low
        let dayProb = loginProb;
        if (sData.code === 'PAC-005') {
          dayProb = 0.15 * (day / 30); // Decline over time
        }

        for (const u of schoolUsers) {
          if (Math.random() < dayProb) {
            logsToInsert.push({
              schoolId: school._id,
              userId: u._id,
              activityType: 'LOGIN',
              ipAddress: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              createdAt: logDate,
              updatedAt: logDate
            });

            // Also add a few page views
            const numPageViews = Math.floor(Math.random() * 4) + 1;
            for (let pv = 0; pv < numPageViews; pv++) {
              const pvDate = new Date(logDate);
              pvDate.setMinutes(pvDate.getMinutes() + (pv * 5) + 1);
              logsToInsert.push({
                schoolId: school._id,
                userId: u._id,
                activityType: 'PAGE_VIEW',
                ipAddress: `192.168.1.${Math.floor(Math.random() * 254) + 1}`,
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                createdAt: pvDate,
                updatedAt: pvDate
              });
            }
          }
        }
      }

      if (logsToInsert.length > 0) {
        await ActivityLog.insertMany(logsToInsert);
        console.log(`Inserted ${logsToInsert.length} activity log entries for ${sData.name}`);
      }
    }

    console.log('\n🎉 Analytics data seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding analytics data:', error);
    process.exit(1);
  }
}

seed();
