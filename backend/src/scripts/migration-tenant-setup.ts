import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { School } from '../models/School.js';
import { SubscriptionPlan } from '../models/SubscriptionPlan.js';
import { Subscription } from '../models/Subscription.js';
import { User } from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env configurations
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.evm') });

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/school-management';

async function runMigration() {
  try {
    console.log('[MIGRATION] Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('[MIGRATION] Connected successfully.');

    // 1. Re-configure User email index
    console.log('[MIGRATION] Checking User email indexes...');
    const usersCollection = mongoose.connection.collection('users');
    
    try {
      const indexes = await usersCollection.indexes();
      const hasEmailUnique = indexes.some(idx => idx.name === 'email_1' && idx.unique);
      
      if (hasEmailUnique) {
        console.log('[MIGRATION] Dropping legacy global email_1 unique index...');
        await usersCollection.dropIndex('email_1');
        console.log('[MIGRATION] Legacy unique index dropped successfully.');
      } else {
        console.log('[MIGRATION] Legacy global email_1 unique index not found or already dropped.');
      }
    } catch (err: any) {
      console.log(`[MIGRATION] [WARNING] Error checking/dropping email_1 index: ${err.message}`);
    }

    // Explicitly rebuild mongoose indexes
    console.log('[MIGRATION] Rebuilding model indexes...');
    await User.cleanIndexes();
    await User.createIndexes();
    console.log('[MIGRATION] User indexes rebuilt.');

    // 2. Seed Default Subscription Plans
    console.log('[MIGRATION] Seeding Subscription Plans...');
    const defaultPlans = [
      {
        name: 'Basic Plan',
        code: 'BASIC',
        price: 99,
        currency: 'USD',
        billingCycle: 'MONTHLY' as const,
        features: ['ACADEMICS', 'ATTENDANCE', 'STUDENTS'],
        limits: { maxStudents: 200, maxTeachers: 20, maxStorageBytes: 5 * 1024 * 1024 * 1024 },
        isActive: true,
      },
      {
        name: 'Pro Plan',
        code: 'PRO',
        price: 249,
        currency: 'USD',
        billingCycle: 'MONTHLY' as const,
        features: ['ACADEMICS', 'ATTENDANCE', 'STUDENTS', 'HOSTEL', 'TRANSPORT', 'CHAT', 'LIBRARY'],
        limits: { maxStudents: 1000, maxTeachers: 100, maxStorageBytes: 50 * 1024 * 1024 * 1024 },
        isActive: true,
      },
      {
        name: 'Enterprise Plan',
        code: 'ENTERPRISE',
        price: 599,
        currency: 'USD',
        billingCycle: 'MONTHLY' as const,
        features: ['ACADEMICS', 'ATTENDANCE', 'STUDENTS', 'HOSTEL', 'TRANSPORT', 'CHAT', 'LIBRARY', 'ANALYTICS', 'VIRTUAL_CLASSROOM', 'WHITE_LABEL'],
        limits: { maxStudents: 100000, maxTeachers: 5000, maxStorageBytes: 1024 * 1024 * 1024 * 1024 }, // 1TB
        isActive: true,
      }
    ];

    const planDocs = [];
    for (const plan of defaultPlans) {
      const updatedPlan = await SubscriptionPlan.findOneAndUpdate(
        { code: plan.code },
        plan,
        { upsert: true, new: true }
      );
      planDocs.push(updatedPlan);
      console.log(`[MIGRATION] Seeded plan: ${plan.code}`);
    }

    // 3. Ensure Default School exists
    console.log('[MIGRATION] Resolving default school...');
    let school = await School.findOne({ code: 'DEFAULT_SCH' });
    if (!school) {
      school = new School({
        name: 'Default International School',
        code: 'DEFAULT_SCH',
        subdomain: 'default',
        contactEmail: 'contact@school.com',
        isActive: true,
      });
      await school.save();
      console.log('[MIGRATION] Default school created.');
    } else {
      if (!school.subdomain) {
        school.subdomain = 'default';
        await school.save();
        console.log('[MIGRATION] Updated default school subdomain to "default".');
      }
      console.log('[MIGRATION] Default school resolved.');
    }

    const defaultSchoolId = school._id as mongoose.Types.ObjectId;

    // 4. Create Active Subscription for Default School
    console.log('[MIGRATION] Verifying school subscription...');
    const enterprisePlan = planDocs.find(p => p.code === 'ENTERPRISE');
    if (enterprisePlan) {
      const existingSub = await Subscription.findOne({ schoolId: defaultSchoolId });
      if (!existingSub) {
        const newSub = new Subscription({
          schoolId: defaultSchoolId,
          planId: enterprisePlan._id,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year out
          paymentGatewayRef: 'MOCK_MIGRATION_SUB_123'
        });
        await newSub.save();
        console.log('[MIGRATION] Active Enterprise subscription seeded for Default School.');
      } else {
        console.log('[MIGRATION] Subscription already exists for Default School.');
      }
    }

    // 5. Scoping orphaned records across ALL collections to the Default School
    console.log('[MIGRATION] Scoping legacy data to Default School...');
    const modelNames = mongoose.modelNames();
    
    for (const modelName of modelNames) {
      // Skip system collections that are not tenant-scoped
      if (['School', 'SubscriptionPlan', 'Subscription', 'AuditLog', 'Permission'].includes(modelName)) {
        continue;
      }
      
      const model = mongoose.model(modelName);
      
      // We look for any records where schoolId is undefined or null or missing
      const query = {
        $or: [
          { schoolId: { $exists: false } },
          { schoolId: null }
        ]
      };
      
      try {
        const count = await model.countDocuments(query);
        if (count > 0) {
          console.log(`[MIGRATION] Scoping ${count} orphaned records in "${modelName}" to default school...`);
          const updateResult = await model.updateMany(query, {
            $set: { schoolId: defaultSchoolId }
          });
          console.log(`[MIGRATION] Updated ${updateResult.modifiedCount} records in "${modelName}".`);
        }
      } catch (err: any) {
        console.log(`[MIGRATION] [WARNING] Could not migrate model "${modelName}": ${err.message}`);
      }
    }

    console.log('[MIGRATION] All migration steps completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[MIGRATION] [FATAL ERROR] Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
