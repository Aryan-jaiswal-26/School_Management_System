import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { User } from './src/models/User.ts';
import { signAccessToken } from './src/config/jwt.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/school_management_erp';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to database.');

  const users = await User.find().lean();
  console.log(`Found ${users.length} users in total.`);

  console.log('\n--- Testing POST /library/books for all users ---');
  for (const user of users) {
    const token = signAccessToken({
      sub: user._id.toString(),
      email: user.email,
      fullName: `${user.firstName} ${user.lastName}`,
      role: user.role,
    });

    const res = await fetch('http://localhost:5001/api/v1/library/books', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: `Test Book by ${user.email}`,
        author: 'Tester',
        isbn: `ISBN-${user.email}-${Math.random().toString(36).substring(2, 7)}`,
        category: 'Science',
        totalCopies: 5,
        shelf: 'S-01'
      })
    });

    const status = res.status;
    const body = await res.json() as any;

    console.log(`Email: ${user.email.padEnd(30)} | Role: ${user.role.padEnd(15)} | School: ${String(user.schoolId).padEnd(24)} | Status: ${status} | Message: ${body.message || JSON.stringify(body)}`);
  }

  process.exit(0);
}

main().catch(console.error);
