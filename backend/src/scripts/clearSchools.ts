import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { School } from '../models/School.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/school_management';

async function clear() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');
    
    const res = await School.deleteMany({
      code: { $nin: ['DEFAULT_SCH', 'GLOBAL_ACADEMY'] }
    });
    console.log(`Successfully deleted ${res.deletedCount} temporary sample/test schools.`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning schools:', error);
    process.exit(1);
  }
}

clear();
