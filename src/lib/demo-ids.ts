/**
 * Canonical demo UUIDs — prefixes must match Supabase seed / profiles_role_check.
 * All values are valid hexadecimal UUIDs for cross-linking local store ↔ database.
 */
export const DEMO_IDS = {
  /** Auth profiles (public.profiles) — roles: admin | teacher | student | parent */
  profile: {
    admin: "f10e8400-e29b-41d4-a716-446655440100",
    teacher: "f10e8400-e29b-41d4-a716-446655440101",
    student: "f10e8400-e29b-41d4-a716-446655440102",
    parent: "f10e8400-e29b-41d4-a716-446655440103",
  },

  /** Enrolled students (legacy prefix: s1, s2, …) */
  student: {
    aarav: "a10e8400-e29b-41d4-a716-446655440001",
    diya: "a10e8400-e29b-41d4-a716-446655440002",
    rohan: "a10e8400-e29b-41d4-a716-446655440003",
    ananya: "a10e8400-e29b-41d4-a716-446655440004",
    kabir: "a10e8400-e29b-41d4-a716-446655440005",
    ishita: "a10e8400-e29b-41d4-a716-446655440006",
    vivaan: "a10e8400-e29b-41d4-a716-446655440007",
    myra: "a10e8400-e29b-41d4-a716-446655440008",
  },

  /** Academic classes (legacy: c10…) */
  class: {
    grade10a: "f10e8400-e29b-41d4-a716-446655440010",
    grade10b: "f10e8400-e29b-41d4-a716-446655440011",
    grade9a: "f10e8400-e29b-41d4-a716-446655440012",
  },

  /** Subjects (legacy: s00…) */
  subject: {
    mathematics: "b00e8400-e29b-41d4-a716-446655440001",
    physics: "b00e8400-e29b-41d4-a716-446655440002",
    chemistry: "b00e8400-e29b-41d4-a716-446655440003",
    english: "b00e8400-e29b-41d4-a716-446655440004",
  },

  /** Fee / invoice records (legacy: v00… / f1…) */
  invoice: {
    aaravTuition: "d00e8400-e29b-41d4-a716-446655440001",
    diyaTuition: "d00e8400-e29b-41d4-a716-446655440002",
    rohanTuition: "d00e8400-e29b-41d4-a716-446655440003",
    ananyaTuition: "d00e8400-e29b-41d4-a716-446655440004",
    kabirTuition: "d00e8400-e29b-41d4-a716-446655440005",
    vivaanTuition: "d00e8400-e29b-41d4-a716-446655440006",
  },

  /** Exams (legacy: e01… / e1…) */
  exam: {
    unitMath: "001e8400-e29b-41d4-a716-446655440001",
    unitPhysics: "001e8400-e29b-41d4-a716-446655440002",
    midtermChem: "001e8400-e29b-41d4-a716-446655440003",
    finalEnglish: "001e8400-e29b-41d4-a716-446655440004",
    boardPractical: "001e8400-e29b-41d4-a716-446655440005",
  },

  /** Hostel rooms (legacy: r1…) */
  hostelRoom: {
    a101: "aa10e840-e29b-41d4-a716-446655440001",
    a102: "aa10e840-e29b-41d4-a716-446655440002",
    b201: "aa10e840-e29b-41d4-a716-446655440003",
    b202: "aa10e840-e29b-41d4-a716-446655440004",
    c301: "aa10e840-e29b-41d4-a716-446655440005",
    c302: "aa10e840-e29b-41d4-a716-446655440006",
  },

  /** Transport routes (legacy: br1…) */
  transportRoute: {
    route12: "cc10e840-e29b-41d4-a716-446655440001",
    route15: "cc10e840-e29b-41d4-a716-446655440002",
  },

  /** Library books (legacy: b1…) */
  libraryBook: {
    calculus: "bb10e840-e29b-41d4-a716-446655440001",
    physics: "bb10e840-e29b-41d4-a716-446655440002",
    organicChem: "bb10e840-e29b-41d4-a716-446655440003",
    mockingbird: "bb10e840-e29b-41d4-a716-446655440004",
    briefHistory: "bb10e840-e29b-41d4-a716-446655440005",
    gandhi: "bb10e840-e29b-41d4-a716-446655440006",
  },
} as const;

/** Logged-in demo student (Aarav) — use in student portal views */
export const DEMO_STUDENT_ID = DEMO_IDS.student.aarav;
