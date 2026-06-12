import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import {
  School,
  SubscriptionPlan,
  Subscription,
  Invoice,
  Payment,
  Announcement,
  Notification,
  SupportTicket,
  FAQ,
  TermsCondition,
  PrivacyPolicy,
  FeatureToggle,
  AppSetting,
  AuditLog,
  User,
} from '../models/index.js';

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';

async function seedSuperAdminData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    // 1. users (Super Admin)
    const passwordHash = await bcrypt.hash('admin123', 10);
    const superAdmin = await User.findOneAndUpdate(
      { email: 'superadmin@campus.os' },
      {
        firstName: 'System',
        lastName: 'Admin',
        email: 'superadmin@campus.os',
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
      { upsert: true, new: true }
    );
    const superAdminDemo = await User.findOneAndUpdate(
      { email: 'superadmin@school.com' },
      {
        firstName: 'Demo',
        lastName: 'Admin',
        email: 'superadmin@school.com',
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
      { upsert: true, new: true }
    );
    console.log('Super Admin Users seeded.');

    // 2. appsettings
    const appSetting = await AppSetting.findOneAndUpdate(
      { platformName: 'Campus OS' },
      {
        platformName: 'Campus OS',
        supportEmail: 'support@campus.os',
        currency: 'USD',
        timezone: 'UTC',
        smtpConfig: {
          host: 'smtp.sendgrid.net',
          port: 587,
          encryption: 'TLS',
          username: 'apikey',
        },
        smsConfig: {
          provider: 'Twilio',
        },
        securityPolicies: {
          require2FAForSuperAdmins: true,
          sessionTimeoutMinutes: 30,
          passwordExpiryDays: 90,
        },
      },
      { upsert: true, new: true }
    );
    console.log('App Setting seeded.');

    // 3. schools
    const school = await School.findOneAndUpdate(
      { code: 'GLOBAL_ACADEMY' },
      {
        name: 'Global Academy',
        code: 'GLOBAL_ACADEMY',
        contactEmail: 'admin@globalacademy.edu',
        status: 'ACTIVE',
        isActive: true,
        settings: { timezone: 'UTC', currency: 'USD', gradingSystem: 'GPA' },
      },
      { upsert: true, new: true }
    );
    console.log('School seeded.');

    // 4. subscriptionplans
    const plan = await SubscriptionPlan.findOneAndUpdate(
      { code: 'ENTERPRISE' },
      {
        name: 'Enterprise Plan',
        code: 'ENTERPRISE',
        price: 999,
        currency: 'USD',
        billingCycle: 'YEARLY',
        features: ['LMS', 'TRANSPORT', 'HOSTEL', 'CHAT', 'ANALYTICS', 'API_ACCESS'],
        limits: { maxStudents: 5000, maxTeachers: 200, maxStorageBytes: 50000000000 }, // 50GB
        isActive: true,
      },
      { upsert: true, new: true }
    );
    console.log('Subscription Plan seeded.');

    // 5. subscriptions
    const subscription = await Subscription.findOneAndUpdate(
      { schoolId: school._id },
      {
        schoolId: school._id,
        planId: plan._id,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        isTrial: false,
        autoRenew: true,
      },
      { upsert: true, new: true }
    );
    console.log('Subscription seeded.');

    // 6. invoices
    const invoice = await Invoice.findOneAndUpdate(
      { invoiceNumber: 'INV-2024-001' },
      {
        schoolId: school._id,
        subscriptionId: subscription._id,
        invoiceNumber: 'INV-2024-001',
        amount: 999,
        taxAmount: 0,
        totalAmount: 999,
        currency: 'USD',
        status: 'PAID',
        dueDate: new Date(),
        paidAt: new Date(),
        billingDetails: { schoolName: school.name, email: school.contactEmail },
        lineItems: [{ description: 'Enterprise Plan Annual', quantity: 1, unitPrice: 999, amount: 999 }],
      },
      { upsert: true, new: true }
    );
    console.log('Invoice seeded.');

    // 7. payments
    const payment = await Payment.findOneAndUpdate(
      { transactionId: 'TXN-987654321' },
      {
        schoolId: school._id,
        feeId: new mongoose.Types.ObjectId(), // Dummy fee ID for schema compliance
        studentId: new mongoose.Types.ObjectId(), // Dummy student ID
        amountPaid: 999,
        paymentDate: new Date(),
        paymentMethod: 'ONLINE',
        transactionId: 'TXN-987654321',
        status: 'SUCCESS',
        remarks: 'Platform subscription payment',
      },
      { upsert: true, new: true }
    );
    console.log('Payment seeded.');

    // 8. announcements
    await Announcement.findOneAndUpdate(
      { title: 'Welcome to Campus OS' },
      {
        title: 'Welcome to Campus OS',
        content: 'We are thrilled to launch the new centralized platform.',
        targetAudience: 'ALL',
        publishedDate: new Date(),
      },
      { upsert: true, new: true }
    );
    console.log('Announcement seeded.');

    // 9. notifications
    await Notification.findOneAndUpdate(
      { title: 'System Maintenance Scheduled' },
      {
        schoolId: school._id,
        userId: superAdmin._id,
        title: 'System Maintenance Scheduled',
        message: 'The system will undergo maintenance this Sunday at 2 AM UTC.',
        type: 'SYSTEM_ALERT',
        channels: ['PUSH', 'EMAIL'],
        status: 'SENT',
      },
      { upsert: true, new: true }
    );
    console.log('Notification seeded.');

    // 10. supporttickets
    await SupportTicket.findOneAndUpdate(
      { subject: 'API Integration Issue' },
      {
        schoolId: school._id,
        userId: superAdmin._id,
        subject: 'API Integration Issue',
        description: 'Having trouble connecting to the new REST endpoints.',
        status: 'OPEN',
        priority: 'HIGH',
        category: 'TECHNICAL',
      },
      { upsert: true, new: true }
    );
    console.log('Support Ticket seeded.');

    // 11. faqs
    await FAQ.findOneAndUpdate(
      { question: 'How do I add a new school?' },
      {
        question: 'How do I add a new school?',
        answer: 'Navigate to the School Management dashboard and click "Add School".',
        category: 'Administration',
        order: 1,
        isActive: true,
      },
      { upsert: true, new: true }
    );
    console.log('FAQ seeded.');

    // 12. termsconditions
    await TermsCondition.findOneAndUpdate(
      { version: 'v1.0' },
      {
        version: 'v1.0',
        content: '<h2>Terms of Service</h2><p>Welcome to Campus OS...</p>',
        publishedAt: new Date(),
        isActive: true,
      },
      { upsert: true, new: true }
    );
    console.log('TermsCondition seeded.');

    // 13. privacypolicies
    await PrivacyPolicy.findOneAndUpdate(
      { version: 'v1.0' },
      {
        version: 'v1.0',
        content: '<h2>Privacy Policy</h2><p>We respect your privacy...</p>',
        publishedAt: new Date(),
        isActive: true,
      },
      { upsert: true, new: true }
    );
    console.log('PrivacyPolicy seeded.');

    // 14. featuretoggles
    await FeatureToggle.findOneAndUpdate(
      { moduleName: 'AdvancedAnalytics' },
      {
        moduleName: 'AdvancedAnalytics',
        description: 'Provides deep insights into platform usage.',
        isEnabledGlobally: true,
        minimumPlan: plan._id,
      },
      { upsert: true, new: true }
    );
    console.log('FeatureToggle seeded.');

    // 15. auditlogs
    await AuditLog.findOneAndUpdate(
      { action: 'PLATFORM_INITIALIZED' },
      {
        userId: superAdmin._id,
        action: 'PLATFORM_INITIALIZED',
        resourceType: 'SYSTEM',
        details: { message: 'Initial seed completed for Super Admin module.' },
        ipAddress: '127.0.0.1',
      },
      { upsert: true, new: true }
    );
    console.log('AuditLog seeded.');

    console.log('\n✅ All 15 Super Admin Collections Seeded Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedSuperAdminData();
