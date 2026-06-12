import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGODB_URI = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/school_management_erp";

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const reservations = await mongoose.connection.collection("bookreservations").find({}).toArray();
  console.log("All reservations in DB:", JSON.stringify(reservations, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
