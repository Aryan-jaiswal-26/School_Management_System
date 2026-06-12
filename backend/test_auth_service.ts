import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { AuthService } from './src/services/auth.service.js';

const MONGODB_URI = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/school_management_erp";

async function run() {
  await mongoose.connect(MONGODB_URI);
  const authService = new AuthService();
  
  try {
    const result = await authService.login({
      email: 'admin@example.com',
      password: 'password'
    });
    console.log(result);
  } catch (error) {
    console.error("ERROR:");
    console.error(error);
  }
  
  process.exit(0);
}

run();
