import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/school_management_erp';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to database.');

  const db = mongoose.connection.db;
  console.log('\n--- User Sessions ---');
  const sessions = await db.collection('usersessions').find().toArray();
  for (const session of sessions) {
    console.log(session);
  }

  process.exit(0);
}

main().catch(console.error);
