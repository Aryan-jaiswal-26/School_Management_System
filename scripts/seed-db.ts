import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env file in the root
const envPath = path.resolve(__dirname, "../.env");
if (!fs.existsSync(envPath)) {
  console.error("Error: .env file not found in root directory.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");

const env: Record<string, string> = {};
envContent.split("\n").forEach((line) => {
  const parts = line.trim().split("=");
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts
      .slice(1)
      .join("=")
      .trim()
      .replace(/^['"]|['"]$/g, "");
    env[key] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be defined in .env");
  process.exit(1);
}

console.log("Initializing Supabase client with URL:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getAdminSession() {
  console.log("Setting up Admin session...");

  // Try to sign up first
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: "admin@school.com",
    password: "password123",
    options: {
      data: {
        role: "admin",
        full_name: "Priya Menon",
      },
    },
  });

  if (signUpError) {
    if (
      signUpError.message.includes("already registered") ||
      signUpError.message.includes("already exists")
    ) {
      console.log("Admin user already registered, signing in...");
    } else {
      console.warn("Sign up warning:", signUpError.message);
    }
  } else {
    console.log("Admin user created successfully.");
  }

  // Sign in to get session
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: "admin@school.com",
    password: "password123",
  });

  if (signInError) {
    if (signInError.message.includes("Email not confirmed") || (signInError as any).code === "email_not_confirmed") {
      console.error("\n❌ Seeding failed: Email confirmation is required by your Supabase project.");
      console.error("\n👉 How to fix this:");
      console.error("Option A: Disable Email Confirmation (Recommended for Dev)");
      console.error("   1. Open your Supabase Project Dashboard.");
      console.error("   2. Go to Authentication -> Providers -> Email.");
      console.error("   3. Turn OFF 'Confirm email' (disable verification) and click Save.");
      console.error("   4. Re-run this seeding script.");
      console.error("\nOption B: Manually Confirm the Email");
      console.error("   1. Go to Authentication -> Users.");
      console.error("   2. Find 'admin@school.com', click the three dots next to it, and select 'Confirm User'.");
      console.error("   3. Re-run this seeding script.");
      process.exit(1);
    }
    console.error("Sign in failed:", signInError.message);
    throw signInError;
  }

  console.log("Signed in successfully as Admin.");
  return signInData.session;
}

async function seed() {
  try {
    const session = await getAdminSession();
    if (!session) {
      throw new Error("No active admin session found.");
    }

    console.log("Seeding hostel rooms...");
    const rooms = [
      {
        block: "A",
        room_no: "101",
        capacity: 4,
        occupied: 3,
        student_ids: [],
        status: "available",
      },
      { block: "A", room_no: "102", capacity: 4, occupied: 4, student_ids: [], status: "full" },
      {
        block: "B",
        room_no: "201",
        capacity: 3,
        occupied: 2,
        student_ids: [],
        status: "available",
      },
      {
        block: "B",
        room_no: "202",
        capacity: 3,
        occupied: 0,
        student_ids: [],
        status: "maintenance",
      },
    ];
    const { error: roomErr } = await supabase
      .from("hostel_rooms")
      .upsert(rooms, { onConflict: "block,room_no" });
    if (roomErr) console.error("Hostel rooms seed error:", roomErr.message);
    else console.log("✔ Hostel rooms seeded.");

    console.log("Seeding hostel complaints...");
    const complaints = [
      {
        student_name: "Aarav Sharma",
        room: "A-101",
        category: "Plumbing",
        description: "Bathroom tap leaking continuously",
        status: "open",
      },
      {
        student_name: "Rohan Verma",
        room: "A-101",
        category: "Electrical",
        description: "Fan not working properly",
        status: "in-progress",
      },
    ];
    const { error: complaintErr } = await supabase.from("hostel_complaints").insert(complaints);
    if (complaintErr) console.error("Hostel complaints seed error:", complaintErr.message);
    else console.log("✔ Hostel complaints seeded.");

    console.log("Seeding hostel visitors...");
    const visitors = [
      {
        visitor_name: "Mr. Rajesh Sharma",
        student_name: "Aarav Sharma",
        room: "A-101",
        purpose: "Parent visit",
        check_in: "2025-05-14T10:00:00Z",
        check_out: "2025-05-14T12:30:00Z",
        status: "checked-out",
      },
      {
        visitor_name: "Mrs. Neha Patel",
        student_name: "Diya Patel",
        room: "A-102",
        purpose: "Birthday celebration",
        check_in: "2025-05-14T14:00:00Z",
        check_out: null,
        status: "checked-in",
      },
    ];
    const { error: visitorErr } = await supabase.from("hostel_visitors").insert(visitors);
    if (visitorErr) console.error("Hostel visitors seed error:", visitorErr.message);
    else console.log("✔ Hostel visitors seeded.");

    console.log("Seeding transport routes...");
    const routes = [
      {
        route_no: "Route 1",
        driver_name: "Suresh Kumar",
        driver_phone: "+91 98765 43210",
        bus_no: "MH-12-GQ-4432",
        capacity: 45,
        student_count: 38,
        stops: [{ name: "Main Gate", time: "07:00", lat: 19.076, lng: 72.877 }],
        current_lat: 19.076,
        current_lng: 72.877,
      },
      {
        route_no: "Route 2",
        driver_name: "Manoj Patil",
        driver_phone: "+91 98765 43211",
        bus_no: "MH-12-HQ-9988",
        capacity: 40,
        student_count: 32,
        stops: [],
        current_lat: 19.082,
        current_lng: 72.881,
      },
    ];
    const { error: routeErr } = await supabase
      .from("transport_routes")
      .upsert(routes, { onConflict: "route_no" });
    if (routeErr) console.error("Transport routes seed error:", routeErr.message);
    else console.log("✔ Transport routes seeded.");

    console.log("Seeding fee categories...");
    const feeCategories = [
      {
        name: "Tuition Fee",
        amount: 45000,
        frequency: "Annual",
        description: "Core academic tuition",
      },
      {
        name: "Hostel Fee",
        amount: 36000,
        frequency: "Annual",
        description: "Boarding and lodging",
      },
      {
        name: "Library Fee",
        amount: 2400,
        frequency: "Annual",
        description: "Library access and resources",
      },
      {
        name: "Transport Fee",
        amount: 18000,
        frequency: "Annual",
        description: "School bus service",
      },
    ];
    const { error: catErr } = await supabase
      .from("fee_categories")
      .upsert(feeCategories, { onConflict: "name" });
    if (catErr) console.error("Fee categories seed error:", catErr.message);
    else console.log("✔ Fee categories seeded.");

    console.log("Seeding fee records...");
    const feeRecords = [
      {
        student_name: "Aarav Sharma",
        grade: "10",
        category: "Tuition",
        amount: 45000,
        paid: 30000,
        due: 15000,
        due_date: "2025-06-30",
        status: "partial",
      },
      {
        student_name: "Diya Patel",
        grade: "10",
        category: "Tuition",
        amount: 45000,
        paid: 45000,
        due: 0,
        due_date: "2025-06-30",
        status: "paid",
      },
    ];
    const { error: recordErr } = await supabase.from("fee_records").insert(feeRecords);
    if (recordErr) console.error("Fee records seed error:", recordErr.message);
    else console.log("✔ Fee records seeded.");

    console.log("Seeding library books...");
    const books = [
      {
        title: "Calculus: Early Transcendentals",
        author: "James Stewart",
        isbn: "978-1285741550",
        category: "Mathematics",
        total_copies: 10,
        available_copies: 6,
        shelf: "M-01",
      },
      {
        title: "Concepts of Physics Vol. 1",
        author: "H.C. Verma",
        isbn: "978-8177091878",
        category: "Physics",
        total_copies: 15,
        available_copies: 8,
        shelf: "P-01",
      },
      {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        isbn: "978-0061120084",
        category: "Literature",
        total_copies: 12,
        available_copies: 9,
        shelf: "L-01",
      },
    ];
    const { error: bookErr } = await supabase.from("library_books").insert(books);
    if (bookErr) console.error("Library books seed error:", bookErr.message);
    else console.log("✔ Library books seeded.");

    console.log("Seeding attendance logs...");
    const attendance = [
      {
        session_date: "2025-05-14",
        grade: "10",
        section: "A",
        student_id: "a10e8400-e29b-41d4-a716-446655440001",
        student_name: "Aarav Sharma",
        status: "present",
        marked_by_name: "Anita Iyer",
      },
      {
        session_date: "2025-05-14",
        grade: "10",
        section: "A",
        student_id: "a10e8400-e29b-41d4-a716-446655440002",
        student_name: "Diya Patel",
        status: "present",
        marked_by_name: "Anita Iyer",
      },
      {
        session_date: "2025-05-14",
        grade: "10",
        section: "A",
        student_id: "a10e8400-e29b-41d4-a716-446655440003",
        student_name: "Rohan Verma",
        status: "absent",
        marked_by_name: "Anita Iyer",
      },
    ];
    const { error: attendErr } = await supabase
      .from("attendance_logs")
      .upsert(attendance, { onConflict: "session_date,grade,section,student_id" });
    if (attendErr) console.error("Attendance logs seed error:", attendErr.message);
    else console.log("✔ Attendance logs seeded.");

    console.log("Seeding academic grades...");
    const grades = [
      {
        student_id: "a10e8400-e29b-41d4-a716-446655440001",
        student_name: "Aarav Sharma",
        subject: "Mathematics",
        grade: "10",
        section: "A",
        score: 88,
        term: "Term 1",
      },
      {
        student_id: "a10e8400-e29b-41d4-a716-446655440001",
        student_name: "Aarav Sharma",
        subject: "Physics",
        grade: "10",
        section: "A",
        score: 82,
        term: "Term 1",
      },
      {
        student_id: "a10e8400-e29b-41d4-a716-446655440002",
        student_name: "Diya Patel",
        subject: "Mathematics",
        grade: "10",
        section: "A",
        score: 94,
        term: "Term 1",
      },
    ];
    const { error: gradeErr } = await supabase.from("academic_grades").insert(grades);
    if (gradeErr) console.error("Academic grades seed error:", gradeErr.message);
    else console.log("✔ Academic grades seeded.");

    console.log("🎉 Database seeding complete!");
  } catch (error) {
    console.error("Seeding operation failed:", error);
    process.exit(1);
  }
}

seed();
