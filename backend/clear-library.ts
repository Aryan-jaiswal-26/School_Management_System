import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/school_management_erp';

async function clearLibrary() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const result = await mongoose.connection.collection('librarybooks').deleteMany({});
  console.log(`✅ Deleted ${result.deletedCount} books from the library catalog.`);

  // Also clear circulations and reservations if needed
  const circResult = await mongoose.connection.collection('bookcirculations').deleteMany({});
  console.log(`✅ Deleted ${circResult.deletedCount} circulation records.`);

  await mongoose.disconnect();
  console.log('Done.');
}

clearLibrary().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
