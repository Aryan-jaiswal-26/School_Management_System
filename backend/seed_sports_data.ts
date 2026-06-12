import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { School } from './src/models/School.js';
import { SportsTeam, Tournament, ExtracurricularActivity } from './src/models/index.js';

dotenv.config({ path: './.env' });

async function seedSportsData() {
  try {
    await mongoose.connect(process.env.DATABASE_URL as string);
    console.log('Connected to MongoDB');

    // Assume user is School Admin for "Global Heights Public School" (or whatever the first school is)
    const school = await School.findOne({});
    if (!school) {
      console.log('No school found in DB. Exiting.');
      process.exit(1);
    }
    const schoolId = school._id;

    // Clear existing
    await SportsTeam.deleteMany({ schoolId });
    await Tournament.deleteMany({ schoolId });
    await ExtracurricularActivity.deleteMany({ schoolId });

    // Seed Teams
    const teams = await SportsTeam.insertMany([
      {
        schoolId,
        name: "Varsity Basketball",
        coach: "Mr. Sharma",
        members: 15,
        nextMatch: "vs St. Jude (Tomorrow)",
        status: "Active",
      },
      {
        schoolId,
        name: "Junior Soccer (U-14)",
        coach: "Mr. D'Souza",
        members: 22,
        nextMatch: "vs City High (May 30)",
        status: "Active",
      },
      {
        schoolId,
        name: "Track & Field",
        coach: "Ms. Iyer",
        members: 30,
        nextMatch: "State Qualifiers (June 5)",
        status: "Training",
      },
    ]);
    console.log(`Seeded ${teams.length} Sports Teams`);

    // Seed Tournaments
    const tournaments = await Tournament.insertMany([
      {
        schoolId,
        name: "Inter-School Basketball Cup",
        date: "May 27 - May 29",
        location: "Main Campus Indoor Court",
        teams: 8,
      },
      {
        schoolId,
        name: "City High Soccer League",
        date: "May 30 - June 15",
        location: "City Sports Complex",
        teams: 12,
      },
    ]);
    console.log(`Seeded ${tournaments.length} Tournaments`);

    // Seed Extracurriculars
    const activities = await ExtracurricularActivity.insertMany([
      {
        schoolId,
        name: "Debate Club",
        instructor: "Mrs. Gupta",
        enrolled: 45,
        max: 50,
      },
      {
        schoolId,
        name: "Robotics & AI",
        instructor: "Mr. Nair",
        enrolled: 30,
        max: 30,
      },
      {
        schoolId,
        name: "Classical Music",
        instructor: "Ms. Pandit",
        enrolled: 18,
        max: 25,
      },
    ]);
    console.log(`Seeded ${activities.length} Extracurricular Activities`);

    console.log('Sports & Extracurricular Data Seeded Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding sports data:', error);
    process.exit(1);
  }
}

seedSportsData();
