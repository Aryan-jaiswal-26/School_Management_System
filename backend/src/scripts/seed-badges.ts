import mongoose from 'mongoose';
import { Badge } from '../models/Badge.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const dbUrl = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/school_management_erp';

const defaultBadges = [
  {
    name: 'Academic Scholar',
    icon: '🎓',
    desc: 'Awarded for maintaining a GPA of 9.5 or above throughout the academic year.',
    tone: 'from-amber-400 to-orange-500 text-white',
  },
  {
    name: 'Creative Artist',
    icon: '🎨',
    desc: 'Recognized for excellent performance and creativity in art classes and exhibitions.',
    tone: 'from-purple-400 to-pink-500 text-white',
  },
  {
    name: 'Sports MVP',
    icon: '🏆',
    desc: 'Awarded to the most valuable player in school league tournaments.',
    tone: 'from-emerald-400 to-teal-500 text-white',
  },
  {
    name: 'Tech Pioneer',
    icon: '💻',
    desc: 'Awarded for outstanding contribution and innovative solutions in computer science projects.',
    tone: 'from-blue-400 to-indigo-500 text-white',
  },
  {
    name: 'Community Star',
    icon: '🌟',
    desc: 'Recognized for active participation and hours logged in community service programs.',
    tone: 'from-yellow-400 to-amber-500 text-amber-950',
  }
];

async function seedBadges() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(dbUrl);
    console.log('Connected.');

    const count = await Badge.countDocuments();
    if (count > 0) {
      console.log(`Database already has ${count} badges. Skipping seeding...`);
      await mongoose.disconnect();
      return;
    }

    console.log('Seeding default badges...');
    await Badge.insertMany(defaultBadges);
    console.log('Seeding complete successfully.');
  } catch (error) {
    console.error('Error seeding badges:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seedBadges();
