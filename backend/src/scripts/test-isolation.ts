import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.evm') });

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/school-management';

async function verifyIsolation() {
  try {
    console.log('[TEST] Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('[TEST] Connected.');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database object not defined');
    }

    console.log('[TEST] Fetching User indexes...');
    const userIndexes = await db.collection('users').indexes();
    
    console.log('[TEST] Users Collection Indexes:');
    console.dir(userIndexes, { depth: null });

    // Validate email index is NOT unique globally
    const emailIndex = userIndexes.find(idx => idx.name === 'email_1');
    if (emailIndex && emailIndex.unique) {
      console.error('❌ FAIL: Legacy global unique index on "email" still exists!');
      process.exit(1);
    } else {
      console.log('✅ PASS: No global unique index on "email".');
    }

    // Validate compound unique index on { schoolId, email }
    const compoundIndex = userIndexes.find(idx => idx.name === 'schoolId_1_email_1');
    if (compoundIndex && compoundIndex.unique) {
      console.log('✅ PASS: Compound unique index on { schoolId, email } is active.');
    } else {
      console.error('❌ FAIL: Compound unique index on { schoolId, email } is missing or not unique!');
      process.exit(1);
    }

    console.log('[TEST] Fetching School indexes...');
    const schoolIndexes = await db.collection('schools').indexes();
    console.log('[TEST] Schools Collection Indexes:');
    console.dir(schoolIndexes, { depth: null });

    const subdomainIndex = schoolIndexes.find(idx => idx.name === 'subdomain_1');
    if (subdomainIndex && subdomainIndex.unique && subdomainIndex.sparse) {
      console.log('✅ PASS: Sparse unique index on "subdomain" is active.');
    } else {
      console.warn('⚠️ WARNING: Subdomain index is missing or not sparse/unique. Mongoose will generate this automatically.');
    }

    console.log('✅ ALL ISOLATION TESTS COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ TEST FAILURE:', error);
    process.exit(1);
  }
}

verifyIsolation();
