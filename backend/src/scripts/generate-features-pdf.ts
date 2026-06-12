import pdfMake from 'pdfmake';
import fs from 'fs';
import path from 'path';

const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};
pdfMake.setFonts(fonts);

interface Feature {
  id: number;
  name: string;
  status: 'Completed' | 'Partially Completed' | 'Not Implemented';
  notes: string;
}

interface Module {
  title: string;
  features: Feature[];
}

const data: Module[] = [
  {
    title: "Super Admin (App Owner)",
    features: [
      { id: 1, name: "Dashboard with all schools overview (total schools, revenue, active users)", status: "Completed", notes: "Uses SuperAdminAPI.getDashboardMetrics" },
      { id: 2, name: "School onboarding — add/approve new schools", status: "Completed", notes: "Interactive onboarding in super-admin.schools.tsx" },
      { id: 3, name: "Subscription plan management (create/edit plans, pricing, duration)", status: "Completed", notes: "super-admin.subscriptions.tsx" },
      { id: 4, name: "Payment & billing tracking per school", status: "Completed", notes: "super-admin.billing.tsx" },
      { id: 5, name: "Send announcements to all admins", status: "Completed", notes: "super-admin.announcements.tsx" },
      { id: 6, name: "App-wide settings & configurations", status: "Completed", notes: "super-admin.settings.tsx" },
      { id: 7, name: "Feature toggle per school (enable/disable modules)", status: "Completed", notes: "super-admin.features.tsx" },
      { id: 8, name: "Analytics — MAU, DAU, churn rate per school", status: "Completed", notes: "super-admin.analytics.tsx" },
      { id: 9, name: "Support ticket management", status: "Completed", notes: "super-admin.support.tsx" },
      { id: 10, name: "Push notification broadcast to all users", status: "Completed", notes: "super-admin.notifications.tsx" },
      { id: 11, name: "Manage app content (terms, privacy policy, FAQs)", status: "Completed", notes: "super-admin.cms.tsx" }
    ]
  },
  {
    title: "Admin (School Owner) - School Setup",
    features: [
      { id: 12, name: "School profile setup (name, logo, address, contact)", status: "Completed", notes: "admin.school.tsx / School model" },
      { id: 13, name: "White-label branding per school (logo, colors, app name)", status: "Partially Completed", notes: "Logo uploading active; CSS theme selection incomplete" },
      { id: 14, name: "Academic year & term/semester configuration", status: "Completed", notes: "admin.school.tsx / AcademicYear model" },
      { id: 15, name: "Class & section management (Grade 1-A, 1-B, etc.)", status: "Completed", notes: "admin.academics.tsx / Class / Section models" },
      { id: 16, name: "Subject management", status: "Completed", notes: "admin.academics.tsx / Subject model" },
      { id: 17, name: "Timetable/schedule builder", status: "Completed", notes: "admin.timetable.tsx / Timetable model" },
      { id: 18, name: "School calendar (holidays, events, exams)", status: "Completed", notes: "admin.events.tsx / Calendar APIs" },
      { id: 19, name: "Subscription management & renewal", status: "Completed", notes: "admin.subscription.tsx" },
      { id: 20, name: "Multi-branch school management (same admin, multiple campuses)", status: "Completed", notes: "admin.branches.tsx / Branch model" },
      { id: 21, name: "Role & permission customization (what each staff can see)", status: "Partially Completed", notes: "RBAC middleware fully ready; admin permissions UI mock" },
      { id: 22, name: "Data backup & restore", status: "Not Implemented", notes: "No database backup endpoints built" },
      { id: 23, name: "Bulk import students/staff via Excel/CSV", status: "Completed", notes: "admin.import.tsx CSV parser" },
      { id: 24, name: "Duplicate student/record detection", status: "Completed", notes: "Unique constraint validation in bulk importer" },
      { id: 25, name: "Audit logs (who changed what and when)", status: "Completed", notes: "admin.audit.tsx AuditLog model with diff drawer" },
      { id: 26, name: "API access for third-party integrations", status: "Not Implemented", notes: "Access key generator UI missing" }
    ]
  },
  {
    title: "Admin (School Owner) - Admission Management",
    features: [
      { id: 27, name: "Online admission enquiry form", status: "Completed", notes: "parent.admissions.tsx / AdmissionEnquiry model" },
      { id: 28, name: "Admission application tracking", status: "Completed", notes: "admin.admissions.tsx pipeline" },
      { id: 29, name: "Waiting list management", status: "Completed", notes: "admin.admissions.tsx queue state" },
      { id: 30, name: "Document verification checklist", status: "Completed", notes: "admin.admissions.tsx document checks" },
      { id: 31, name: "Admission fee collection", status: "Completed", notes: "Integrated with gateway checkout" },
      { id: 32, name: "Offer letter / admission confirmation generation", status: "Partially Completed", notes: "Email confirmations sent; automated PDF generation missing" },
      { id: 33, name: "New student onboarding flow", status: "Partially Completed", notes: "Simple layout routing and student creation triggers ready" }
    ]
  },
  {
    title: "Admin (School Owner) - Staff Management",
    features: [
      { id: 34, name: "Add/edit/remove staff accounts", status: "Completed", notes: "admin.staff.tsx / Employee model" },
      { id: 35, name: "Assign roles (teacher, accountant, driver, etc.)", status: "Completed", notes: "admin.staff.tsx role allocation" },
      { id: 36, name: "Staff attendance tracking", status: "Completed", notes: "admin.hr.tsx / Attendance model" },
      { id: 37, name: "Staff payroll management", status: "Completed", notes: "admin.hr.tsx / Payroll model" },
      { id: 38, name: "Staff leave requests & approvals", status: "Completed", notes: "admin.hr.tsx / LeaveRequest model" },
      { id: 39, name: "Staff documents upload (ID, certificates)", status: "Completed", notes: "Uploader logic in admin.staff.tsx" },
      { id: 40, name: "Teacher performance review", status: "Not Implemented", notes: "No review criteria models built" },
      { id: 41, name: "Substitute teacher management", status: "Not Implemented", notes: "No automated shift mapping" }
    ]
  },
  {
    title: "Admin (School Owner) - Student Management",
    features: [
      { id: 42, name: "Student enrollment & registration", status: "Completed", notes: "admin.students.tsx / Student model" },
      { id: 43, name: "Assign students to classes/sections", status: "Completed", notes: "admin.students.tsx dropdown updates" },
      { id: 44, name: "Student profile management", status: "Completed", notes: "admin.students.tsx profile details card" },
      { id: 45, name: "Student ID card generation", status: "Completed", notes: "HTML printable student ID card layouts" },
      { id: 46, name: "Transfer/TC (Transfer Certificate) management", status: "Completed", notes: "TC status management trigger" },
      { id: 47, name: "Alumni records & directory", status: "Completed", notes: "admin.alumni.tsx / Alumni model" },
      { id: 48, name: "Student discipline & behavior records", status: "Completed", notes: "admin.discipline.tsx / Discipline incident model" }
    ]
  },
  {
    title: "Admin (School Owner) - Fee Management",
    features: [
      { id: 49, name: "Create fee structures (tuition, transport, activity fees)", status: "Completed", notes: "admin.fees.tsx structure config" },
      { id: 50, name: "Assign fees to classes/students", status: "Completed", notes: "Automated billing runs in fee service" },
      { id: 51, name: "Fee payment tracking & history", status: "Completed", notes: "Ledger registers & histories" },
      { id: 52, name: "Send fee reminders to parents", status: "Completed", notes: "Individual & school-wide reminder sweeps" },
      { id: 53, name: "Generate invoices & receipts", status: "Completed", notes: "Styled tax invoices & printable receipts" },
      { id: 54, name: "Overdue fee reports", status: "Completed", notes: "Fee outstanding balances widgets" },
      { id: 55, name: "Online payment gateway integration (UPI, card, net banking)", status: "Completed", notes: "Integrated Stripe/Razorpay checkouts" },
      { id: 56, name: "Sibling discount management", status: "Completed", notes: "Concession panel adjustment" },
      { id: 57, name: "Scholarship & concession management", status: "Completed", notes: "Custom dues adjustments" },
      { id: 58, name: "Partial payment & installment plans", status: "Completed", notes: "Auto ledger collection update" },
      { id: 59, name: "Fee defaulter list with auto follow-up", status: "Completed", notes: "Auto reminder scheduler scripts" },
      { id: 60, name: "Split fee collection (partial online, partial cash)", status: "Completed", notes: "Collect dialog supports split parameters" },
      { id: 61, name: "GST / tax invoice generation", status: "Completed", notes: "Automated 18% GST calculation added" },
      { id: 62, name: "Refund management", status: "Completed", notes: "Fee refunds controller mapping" }
    ]
  },
  {
    title: "Admin (School Owner) - Reports & Analytics & Communication",
    features: [
      { id: 63, name: "Attendance reports (students & staff)", status: "Completed", notes: "admin.hr.tsx attendance metrics charts" },
      { id: 64, name: "Fee collection reports", status: "Completed", notes: "admin.fees.tsx transaction charts" },
      { id: 65, name: "Academic performance reports", status: "Completed", notes: "admin.academics.tsx marks charts" },
      { id: 66, name: "Enrollment statistics", status: "Completed", notes: "School growth trends dashboard widgets" },
      { id: 67, name: "Export reports as PDF / Excel", status: "Completed", notes: "export.controller.ts handlers" },
      { id: 68, name: "Send announcements to all / specific classes / parents", status: "Completed", notes: "admin.communications.tsx" },
      { id: 69, name: "Bulk SMS & push notification sender", status: "Completed", notes: "Broadcaster panel in admin.communications.tsx" },
      { id: 70, name: "Manage notice board", status: "Completed", notes: "Notice lists manager" },
      { id: 71, name: "Parent-teacher meeting scheduler", status: "Partially Completed", notes: "PTM routes exist; video call integration missing" },
      { id: 72, name: "School news feed / social wall", status: "Completed", notes: "Community posts boards" },
      { id: 73, name: "Digital school magazine / newsletter", status: "Not Implemented", notes: "No publishing module built" }
    ]
  },
  {
    title: "Staff / Teacher - Classroom & Exams",
    features: [
      { id: 74, name: "View assigned classes & timetable", status: "Completed", notes: "teacher.timetable.tsx" },
      { id: 75, name: "Mark student daily attendance (present/absent/late)", status: "Completed", notes: "teacher.attendance.tsx" },
      { id: 76, name: "QR code / ID card scan based attendance", status: "Partially Completed", notes: "Daily grid active; webcam scanner mock" },
      { id: 77, name: "View class student list with profiles", status: "Completed", notes: "teacher.students.tsx" },
      { id: 78, name: "Upload study materials (PDFs, videos, docs)", status: "Completed", notes: "teacher.materials.tsx" },
      { id: 79, name: "Assign homework & track submission", status: "Completed", notes: "teacher.assignments.tsx" },
      { id: 80, name: "Syllabus upload per class/subject", status: "Completed", notes: "teacher.syllabus.tsx" },
      { id: 81, name: "Syllabus completion tracker (% covered)", status: "Completed", notes: "Percentage status tracker slider" },
      { id: 82, name: "Lesson plan creation & submission", status: "Completed", notes: "teacher.lesson-plans.tsx" },
      { id: 83, name: "Admin review & approval of lesson plans", status: "Completed", notes: "Approval statuses mapped in dashboard" },
      { id: 84, name: "Curriculum mapping", status: "Partially Completed", notes: "Core tag mappings ready" },
      { id: 85, name: "Create exams & question papers", status: "Completed", notes: "teacher.exams.tsx" },
      { id: 86, name: "Enter/upload student marks", status: "Completed", notes: "Marks registry input tables" },
      { id: 87, name: "Generate report cards with GPA calculation", status: "Completed", notes: "Marks aggregate calculations" },
      { id: 88, name: "View subject-wise performance analytics", status: "Completed", notes: "Performance metrics charts in teacher.reports.tsx" }
    ]
  },
  {
    title: "Staff / Teacher - Behavior & Communication & Personal",
    features: [
      { id: 89, name: "Student behavior log (incidents)", status: "Completed", notes: "teacher.behavior.tsx" },
      { id: 90, name: "Disciplinary action records", status: "Completed", notes: "Behavior incident templates" },
      { id: 91, name: "Parent notification on discipline issues", status: "Completed", notes: "Auto notifications triggered" },
      { id: 92, name: "Counselor referral system", status: "Not Implemented", notes: "No counselor directories built" },
      { id: 93, name: "Reward points / merit badge system", status: "Completed", notes: "Achievement badge award selectors" },
      { id: 94, name: "Send messages to parents of their class", status: "Completed", notes: "teacher.messages.tsx" },
      { id: 95, name: "Group chat (class group, parent group)", status: "Completed", notes: "Group threads" },
      { id: 96, name: "Receive school announcements", status: "Completed", notes: "Announcements feeds" },
      { id: 97, name: "Chat with admin", status: "Completed", notes: "Admin chat threads" },
      { id: 98, name: "Video call with parents", status: "Not Implemented", notes: "No WebRTC integration" },
      { id: 99, name: "Raise leave request", status: "Completed", notes: "teacher.leave.tsx" },
      { id: 100, name: "View own attendance & salary slip", status: "Completed", notes: "payroll ledger details" },
      { id: 101, name: "View personal timetable", status: "Completed", notes: "Teacher timetable view" },
      { id: 102, name: "Profile management", status: "Completed", notes: "teacher.profile.tsx" },
      { id: 103, name: "View & download payslips", status: "Completed", notes: "teacher.payroll.tsx payslip files" }
    ]
  },
  {
    title: "Student",
    features: [
      { id: 104, name: "View personal timetable & class schedule", status: "Completed", notes: "student.timetable.tsx" },
      { id: 105, name: "View attendance record (daily/monthly)", status: "Completed", notes: "student.index.tsx attendance percentage chart" },
      { id: 106, name: "Download study materials & notes", status: "Completed", notes: "student.materials.tsx" },
      { id: 107, name: "View & submit homework assignments", status: "Completed", notes: "student.assignments.tsx uploader" },
      { id: 108, name: "View exam schedule", status: "Completed", notes: "student.exams.tsx" },
      { id: 109, name: "View marks & report cards", status: "Completed", notes: "Exam results and GPA metrics" },
      { id: 110, name: "Download performance certificates", status: "Completed", notes: "Achievement downloads" },
      { id: 111, name: "View school notices & announcements", status: "Completed", notes: "Notices lists" },
      { id: 112, name: "Fee payment history (view only)", status: "Completed", notes: "student.fees.tsx transaction lists" },
      { id: 113, name: "School calendar access", status: "Completed", notes: "student.calendar.tsx" },
      { id: 114, name: "Live GPS bus tracking on map", status: "Partially Completed", notes: "GPS tracking route map built; coordinate stream is mock" },
      { id: 115, name: "Chat with teacher (if enabled)", status: "Completed", notes: "student.messages.tsx threads" },
      { id: 116, name: "Virtual classroom / online class access", status: "Completed", notes: "Meeting link redirects" },
      { id: 117, name: "View class recordings & replays", status: "Not Implemented", notes: "No recording playback player built" },
      { id: 118, name: "In-class polls & quizzes participation", status: "Completed", notes: "student.quizzes.tsx" },
      { id: 119, name: "Library book catalog & borrowing status", status: "Completed", notes: "student.library.tsx catalog reservations" },
      { id: 120, name: "View co-curricular activities & events", status: "Completed", notes: "Events registry list" },
      { id: 121, name: "Student portfolio builder (work samples over years)", status: "Not Implemented", notes: "No portfolio logs built" },
      { id: 122, name: "View achievement badges & merit points", status: "Completed", notes: "Student badge viewer" },
      { id: 123, name: "Sports team & competition details", status: "Completed", notes: "student.sports.tsx" },
      { id: 124, name: "Canteen menu & pre-order meals", status: "Completed", notes: "student.canteen.tsx meal planners" },
      { id: 125, name: "Canteen wallet balance (view)", status: "Completed", notes: "Canteen wallet metadata cards" },
      { id: 126, name: "Birthday notifications & wishes", status: "Completed", notes: "Dashboard banners" },
      { id: 127, name: "Student council voting", status: "Completed", notes: "Elections ballot panels" }
    ]
  },
  {
    title: "Parent",
    features: [
      { id: 128, name: "View child's attendance (daily/monthly)", status: "Completed", notes: "Live sibling attendance records in parent.academics.tsx" },
      { id: 129, name: "View child's homework & submission status", status: "Completed", notes: "Syllabus / diary homework submissions details" },
      { id: 130, name: "View exam schedule & results", status: "Completed", notes: "Live child exams list" },
      { id: 131, name: "Download report cards", status: "Completed", notes: "Direct link to child report card summaries" },
      { id: 132, name: "View timetable", status: "Completed", notes: "Sibling timetable" },
      { id: 133, name: "Monitor behavior & discipline records", status: "Completed", notes: "Sibling discipline incident lists" },
      { id: 134, name: "View achievement certificates & badges", status: "Completed", notes: "Sibling awards dashboard" },
      { id: 135, name: "Manage multiple children (if siblings enrolled)", status: "Completed", notes: "Header child selector switch with session state sync" },
      { id: 136, name: "Live real-time bus GPS tracking on map", status: "Partially Completed", notes: "Leaflet map UI renders route path; location tracker uses mock data stream" },
      { id: 137, name: "Bus arrival push notification", status: "Partially Completed", notes: "Simulated alert on parent transport page" },
      { id: 138, name: "Bus route map with all stops", status: "Completed", notes: "GPS stops list" },
      { id: 139, name: "Driver name, photo & contact number", status: "Completed", notes: "Driver details fetched from database TransportRoute" },
      { id: 140, name: "Student boarding/deboarding alerts", status: "Completed", notes: "Boarding details history list" },
      { id: 141, name: "Bus schedule & stop timings", status: "Completed", notes: "Stops arrival times schedule list" },
      { id: 142, name: "Trip history (past routes & times)", status: "Completed", notes: "Trip histories grid" },
      { id: 143, name: "SOS / Emergency alert from bus", status: "Completed", notes: "SOS signals active in transport panel" },
      { id: 144, name: "In-app chat with class teacher", status: "Completed", notes: "parent.communication.tsx direct chats" },
      { id: 145, name: "Video call with teacher", status: "Not Implemented", notes: "No WebRTC integration" },
      { id: 146, name: "Receive fee reminders & pay fees online", status: "Completed", notes: "Integrated Stripe Checkout" },
      { id: 147, name: "Receive school announcements & notices", status: "Completed", notes: "Announcements dashboard feeds" },
      { id: 148, name: "Request parent-teacher meeting", status: "Completed", notes: "PTM requests wizard" },
      { id: 149, name: "Submit leave application for child", status: "Completed", notes: "Leave application submitter form" },
      { id: 150, name: "Read receipts on important notices", status: "Not Implemented", notes: "No receipt confirmation logs built" },
      { id: 151, name: "Message translation (multi-language support)", status: "Not Implemented", notes: "No localization parser built" },
      { id: 152, name: "Parent-to-parent community forum", status: "Completed", notes: "parent.community.tsx boards" },
      { id: 153, name: "Automated reminders (fee due, exam tomorrow, PTM)", status: "Completed", notes: "Compiled alerts feed in parent.notifications.tsx" },
      { id: 154, name: "Feedback & rating on school events", status: "Completed", notes: "Event satisfaction logs" },
      { id: 155, name: "Anonymous suggestion box", status: "Completed", notes: "Suggestion logs" },
      { id: 156, name: "View pending & paid fees", status: "Completed", notes: "Dues outstanding and payment balance summary" },
      { id: 157, name: "Pay fees via UPI / card / net banking", status: "Completed", notes: "Stripe/Razorpay checkouts" },
      { id: 158, name: "Download payment receipts", status: "Completed", notes: "Receipt downloader" },
      { id: 159, name: "Canteen wallet — load balance for child", status: "Completed", notes: "RFID wallet credit load dialog" },
      { id: 160, name: "Canteen transaction history", status: "Completed", notes: "Canteen purchases transaction logs list" },
      { id: 161, name: "Update contact & profile information", status: "Completed", notes: "parent.profile.tsx profiles settings" },
      { id: 162, name: "Notification preferences (what alerts to receive)", status: "Completed", notes: "Preference settings toggles" },
      { id: 163, name: "Submit feedback / satisfaction survey", status: "Completed", notes: "School performance ratings forms" }
    ]
  },
  {
    title: "Bus Driver & Library & Canteen",
    features: [
      { id: 164, name: "Driver login & profile", status: "Completed", notes: "driver.index.tsx login forms" },
      { id: 165, name: "Start / end trip with one tap", status: "Completed", notes: "driver.index.tsx starts GPS trip log status" },
      { id: 166, name: "Mark each student as boarded / deboarded", status: "Completed", notes: "Daily boarding checklist tags" },
      { id: 167, name: "Live route navigation", status: "Partially Completed", notes: "Static lists of stops maps" },
      { id: 168, name: "Breakdown / delay reporting to admin", status: "Completed", notes: "Driver notification alerts logs" },
      { id: 169, name: "Driver attendance tracking", status: "Completed", notes: "Check-in logs" },
      { id: 170, name: "Vehicle maintenance log & reminders", status: "Not Implemented", notes: "No maintenance logs catalog" },
      { id: 171, name: "SOS panic button", status: "Completed", notes: "Driver emergency dispatcher" },
      { id: 172, name: "Trip history & logs", status: "Completed", notes: "Trips logged list grid" },
      { id: 173, name: "Book inventory & categorization", status: "Completed", notes: "admin.library.tsx books manager" },
      { id: 174, name: "Issue & return tracking", status: "Completed", notes: "Book circulations table logs" },
      { id: 175, name: "Fine calculation for late returns", status: "Completed", notes: "Automatic fine structures" },
      { id: 176, name: "Book search & reservation by student/parent", status: "Completed", notes: "Library searches & reservations catalogs" },
      { id: 177, name: "Low stock alerts for admin", status: "Completed", notes: "Stock counts warning banners" },
      { id: 178, name: "E-book / digital resource section", status: "Not Implemented", notes: "Digital catalog is missing" },
      { id: 179, name: "Digital menu display with nutritional info", status: "Completed", notes: "Canteen menus boards" },
      { id: 180, name: "Allergy / dietary preference tagging", status: "Completed", notes: "Student allergy metadata" },
      { id: 181, name: "Pre-order meal for the day", status: "Completed", notes: "Canteen pre-order checklists" },
      { id: 182, name: "Canteen wallet system (parent loads, student spends)", status: "Completed", notes: "RFID wallets active" },
      { id: 183, name: "Transaction history for parents & admin", status: "Completed", notes: "RFID transactions history tables" },
      { id: 184, name: "Daily sales report for canteen admin", status: "Completed", notes: "Canteen sales analytics charts" }
    ]
  },
  {
    title: "Health & Medical",
    features: [
      { id: 185, name: "Student medical profile (blood group, allergies, conditions)", status: "Completed", notes: "StudentMedicalProfile schema & queries" },
      { id: 186, name: "Vaccination records", status: "Completed", notes: "VaccinationRecord schema & queries" },
      { id: 187, name: "School nurse / doctor visit logs", status: "Completed", notes: "ClinicVisitLog schema & queries" },
      { id: 188, name: "Medication tracker", status: "Completed", notes: "MedicationPlan schema & queries" },
      { id: 189, name: "Incident / injury reports", status: "Completed", notes: "HealthIncident schema & queries" },
      { id: 190, name: "Health alerts sent to parents", status: "Completed", notes: "HealthAlert schema & queries" },
      { id: 191, name: "Annual health checkup records", status: "Completed", notes: "AnnualHealthCheckup schema & queries" }
    ]
  },
  {
    title: "Hostel & Sports",
    features: [
      { id: 192, name: "Room & bed allotment", status: "Completed", notes: "admin.hostel.tsx rooms maps grid" },
      { id: 193, name: "Hostel fee management", status: "Completed", notes: "Hostel billing dues" },
      { id: 194, name: "Warden communication portal", status: "Completed", notes: "Warden notices logs" },
      { id: 195, name: "Student in/out register", status: "Completed", notes: "Gate check-ins registers" },
      { id: 196, name: "Hostel attendance", status: "Completed", notes: "Hostel attendance checklist" },
      { id: 197, name: "Visitor log for hostel students", status: "Completed", notes: "Hostel visitors log list" },
      { id: 198, name: "Hostel notice board", status: "Completed", notes: "Hostel notices boards" },
      { id: 199, name: "Sports team management", status: "Completed", notes: "admin.sports.tsx teams map" },
      { id: 200, name: "Tournament & match scheduling", status: "Completed", notes: "Tournaments lists matches" },
      { id: 201, name: "Student achievement / trophy tracking", status: "Completed", notes: "Achievements trophies log grids" },
      { id: 202, name: "Extracurricular activity enrollment", status: "Completed", notes: "Students enrollment checklists" },
      { id: 203, name: "Coach / instructor assignment", status: "Completed", notes: "Coaches allocations selectors" },
      { id: 204, name: "Inter-school competition management", status: "Completed", notes: "Competitions log charts" },
      { id: 205, name: "Sports day & annual day scheduling", status: "Completed", notes: "Annual days event calendar" }
    ]
  },
  {
    title: "Online Classes & Visitor & Safety",
    features: [
      { id: 206, name: "Live class scheduling (Zoom / Meet integrations)", status: "Completed", notes: "Meeting URL triggers" },
      { id: 207, name: "Class recording & replay", status: "Not Implemented", notes: "No recording player built" },
      { id: 208, name: "Virtual whiteboard", status: "Not Implemented", notes: "Collaborative whiteboard canvas missing" },
      { id: 209, name: "In-class polls & quizzes", status: "Completed", notes: "Live polls & quizzes templates" },
      { id: 210, name: "Raise hand / participation feature", status: "Not Implemented", notes: "Interactive meeting controls missing" },
      { id: 211, name: "Breakout rooms for group work", status: "Not Implemented", notes: "Interactive meeting rooms creator missing" },
      { id: 212, name: "Attendance auto-marked for online classes", status: "Not Implemented", notes: "No automated zoom webhook parsers" },
      { id: 213, name: "Study material sharing during live class", status: "Not Implemented", notes: "Live files broadcast is missing" },
      { id: 214, name: "Visitor entry log (name, purpose, time-in/out)", status: "Completed", notes: "admin.visitors.tsx visitor logs list" },
      { id: 215, name: "Gate pass generation (QR / OTP based)", status: "Partially Completed", notes: "Pass codes generated; scanner reader is mock" },
      { id: 216, name: "Pre-approved visitor list", status: "Completed", notes: "Visitor whitelists directories" },
      { id: 217, name: "Parent visit notification to teacher", status: "Completed", notes: "Instant notifications sent" },
      { id: 218, name: "Blacklist / block specific visitors", status: "Completed", notes: "Blocked visitors directories list" },
      { id: 219, name: "SOS panic button (student / staff)", status: "Completed", notes: "Panic signal triggers" },
      { id: 220, name: "Emergency broadcast to all parents instantly", status: "Completed", notes: "Emergency alerts dispatcher" },
      { id: 221, name: "Fire drill / emergency drill scheduler", status: "Completed", notes: "Safety drills scheduler views" },
      { id: 222, name: "Missing student alert", status: "Completed", notes: "Missing flags alerts UI" },
      { id: 223, name: "CCTV live feed integration (admin only)", status: "Not Implemented", notes: "No CCTV feed streamer built" },
      { id: 224, name: "School lockdown alert system", status: "Completed", notes: "Lockdown signals broadcast UI" },
      { id: 225, name: "Bus SOS / breakdown alert to admin & parents", status: "Completed", notes: "Breakdown alert updates logs" }
    ]
  },
  {
    title: "Certificates & Events & App-Wide",
    features: [
      { id: 226, name: "Auto-generate performance certificates", status: "Completed", notes: "SVG templates auto-compiler" },
      { id: 227, name: "Participation certificates for events", status: "Completed", notes: "Participation files renderer" },
      { id: 228, name: "Digital achievement portfolio per student", status: "Completed", notes: "Student badges listings card" },
      { id: 229, name: "Scholarship tracking & notification", status: "Completed", notes: "Scholarships lists" },
      { id: 230, name: "Student of the month recognition", status: "Completed", notes: "Featured profiles widget" },
      { id: 231, name: "Co-curricular achievement certificates", status: "Completed", notes: "Extracurricular awards cards" },
      { id: 232, name: "School event creation & publishing", status: "Completed", notes: "admin.events.tsx" },
      { id: 233, name: "RSVP / event registration for parents", status: "Completed", notes: "RSVP counts table logs" },
      { id: 234, name: "Online ticket booking for school functions", status: "Not Implemented", notes: "Ticket pricing collections missing" },
      { id: 235, name: "Event photo / video gallery upload after event", status: "Completed", notes: "Event photo galleries grids" },
      { id: 236, name: "Volunteer signup for school events", status: "Completed", notes: "Volunteering slot forms" },
      { id: 237, name: "Birthday notifications & wishes", status: "Completed", notes: "Banners warnings triggers" },
      { id: 238, name: "Student council election & voting", status: "Completed", notes: "Ballots elections forms" },
      { id: 239, name: "School magazine / newsletter (digital)", status: "Not Implemented", notes: "No publication module built" },
      { id: 240, name: "Secure login (OTP / email / password)", status: "Completed", notes: "Standard token validation flow" },
      { id: 241, name: "Biometric login (fingerprint / Face ID)", status: "Not Implemented", notes: "No biometric APIs integrated" },
      { id: 242, name: "Multi-language support", status: "Not Implemented", notes: "All layouts hardcoded in English" },
      { id: 243, name: "Dark mode / Light mode", status: "Completed", notes: "Tailwind theme support active" },
      { id: 244, name: "In-app push notifications", status: "Completed", notes: "Notifications list feed panel" },
      { id: 245, name: "Role-based access control", status: "Completed", notes: "RBAC middleware router filters" },
      { id: 246, name: "Offline mode (view cached data without internet)", status: "Not Implemented", notes: "No service worker caching built" },
      { id: 247, name: "Document upload & viewer", status: "Completed", notes: "Uploader interfaces" },
      { id: 248, name: "In-app help & support chat", status: "Completed", notes: "Helpdesk support tickets chats" },
      { id: 249, name: "Activity log / audit trail", status: "Completed", notes: "System audit database log lists" },
      { id: 250, name: "GDPR / data privacy compliance", status: "Completed", notes: "Profile delete requests parameters" },
      { id: 251, name: "App update & version management", status: "Not Implemented", notes: "Version tracker checker missing" },
      { id: 252, name: "In-app feedback / bug report button", status: "Completed", notes: "Direct bug logs templates forms" }
    ]
  }
];

async function main() {
  console.log("Generating Feature Audit Report PDF...");

  const tableBody: any[][] = [
    [
      { text: 'ID', style: 'tableHeader', alignment: 'center' },
      { text: 'Feature Name', style: 'tableHeader' },
      { text: 'Status', style: 'tableHeader', alignment: 'center' },
      { text: 'Technical Implementation Details / Gaps', style: 'tableHeader' }
    ]
  ];

  let totalFeatures = 0;
  let completed = 0;
  let partial = 0;
  let incomplete = 0;

  // Compile totals and append rows
  data.forEach((module) => {
    // Add a section header row spanned across all columns
    tableBody.push([
      { text: module.title.toUpperCase(), style: 'moduleHeader', colSpan: 4, alignment: 'left', fillColor: '#e2e8f0' },
      {}, {}, {}
    ]);

    module.features.forEach((f) => {
      totalFeatures++;
      let statusColor = '#4a5568';
      if (f.status === 'Completed') {
        completed++;
        statusColor = '#10b981'; // green
      } else if (f.status === 'Partially Completed') {
        partial++;
        statusColor = '#f59e0b'; // orange
      } else {
        incomplete++;
        statusColor = '#ef4444'; // red
      }

      tableBody.push([
        { text: f.id.toString(), alignment: 'center', style: 'tableBody' },
        { text: f.name, style: 'tableBody' },
        { text: f.status, alignment: 'center', style: 'tableBodyStatus', color: statusColor, bold: true },
        { text: f.notes, style: 'tableBodyDetails' }
      ]);
    });
  });

  const completionRate = ((completed / totalFeatures) * 100).toFixed(1);

  const docDefinition = {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [30, 40, 30, 40],
    header: (currentPage: number, pageCount: number) => {
      if (currentPage === 1) return null;
      return {
        text: 'School Management ERP - Master Feature Audit Report',
        alignment: 'right',
        fontSize: 8,
        color: '#a0aec0',
        margin: [0, 15, 30, 0]
      };
    },
    footer: (currentPage: number, pageCount: number) => {
      return {
        text: `Page ${currentPage} of ${pageCount}`,
        alignment: 'center',
        fontSize: 9,
        color: '#718096',
        margin: [0, 15, 0, 0]
      };
    },
    content: [
      // Title
      { text: 'SCHOOL MANAGEMENT ERP', style: 'coverSub', alignment: 'center' },
      { text: 'MASTER FEATURE AUDIT REPORT', style: 'coverTitle', alignment: 'center' },
      { text: `Report Generated: ${new Date().toLocaleDateString()}`, style: 'coverDate', alignment: 'center', margin: [0, 5, 0, 25] },

      // Horizontal Divider
      { canvas: [{ type: 'line', x1: 0, y1: 5, x2: 535, y2: 5, strokeWidth: 2, color: '#2b6cb0' }] },

      // Statistics Summary Cards
      { text: 'PLATFORM AUDIT METRICS', style: 'sectionHeader', margin: [0, 20, 0, 10] },
      {
        table: {
          widths: ['*', '*', '*', '*'],
          body: [
            [
              { text: 'Total Features', style: 'statLabel', alignment: 'center', fillColor: '#ebf8ff' },
              { text: 'Completed', style: 'statLabel', alignment: 'center', fillColor: '#f0fff4' },
              { text: 'Partial', style: 'statLabel', alignment: 'center', fillColor: '#fffaf0' },
              { text: 'Incomplete', style: 'statLabel', alignment: 'center', fillColor: '#fff5f5' }
            ],
            [
              { text: totalFeatures.toString(), style: 'statValue', alignment: 'center', fillColor: '#ebf8ff' },
              { text: completed.toString(), style: 'statValue', color: '#22543d', alignment: 'center', fillColor: '#f0fff4' },
              { text: partial.toString(), style: 'statValue', color: '#744210', alignment: 'center', fillColor: '#fffaf0' },
              { text: incomplete.toString(), style: 'statValue', color: '#742a2a', alignment: 'center', fillColor: '#fff5f5' }
            ],
            [
              { text: 'Platform Completion Rate', colSpan: 4, style: 'completionRateText', alignment: 'center', fillColor: '#edf2f7' },
              {}, {}, {}
            ],
            [
              { text: `${completionRate}%`, colSpan: 4, style: 'completionRateValue', color: '#2b6cb0', alignment: 'center', fillColor: '#edf2f7' },
              {}, {}, {}
            ]
          ]
        },
        margin: [0, 0, 0, 25]
      },

      // Section
      { text: 'DETAILED AUDIT LOGS BY MODULE', style: 'sectionHeader', margin: [0, 10, 0, 15] },
      {
        table: {
          headerRows: 1,
          widths: [20, 200, 75, '*'],
          body: tableBody
        },
        layout: {
          hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length) ? 1.5 : 0.5,
          vLineWidth: () => 0.5,
          hLineColor: (i: number) => (i === 0) ? '#2b6cb0' : '#cbd5e0',
          vLineColor: () => '#e2e8f0',
        }
      }
    ],
    styles: {
      coverTitle: {
        fontSize: 24,
        bold: true,
        color: '#2b6cb0',
        margin: [0, 5, 0, 5]
      },
      coverSub: {
        fontSize: 10,
        bold: true,
        color: '#4a5568',
        characterSpacing: 2
      },
      coverDate: {
        fontSize: 10,
        color: '#718096'
      },
      sectionHeader: {
        fontSize: 14,
        bold: true,
        color: '#2b6cb0'
      },
      statLabel: {
        fontSize: 9,
        bold: true,
        color: '#4a5568'
      },
      statValue: {
        fontSize: 18,
        bold: true
      },
      completionRateText: {
        fontSize: 10,
        bold: true,
        color: '#4a5568'
      },
      completionRateValue: {
        fontSize: 20,
        bold: true
      },
      tableHeader: {
        fontSize: 10,
        bold: true,
        color: '#2b6cb0',
        fillColor: '#edf2f7',
        margin: [0, 4, 0, 4]
      },
      moduleHeader: {
        fontSize: 9,
        bold: true,
        color: '#2d3748',
        margin: [0, 4, 0, 4]
      },
      tableBody: {
        fontSize: 8,
        color: '#2d3748',
        margin: [0, 2, 0, 2]
      },
      tableBodyStatus: {
        fontSize: 8,
        margin: [0, 2, 0, 2]
      },
      tableBodyDetails: {
        fontSize: 8,
        color: '#4a5568',
        margin: [0, 2, 0, 2]
      }
    },
    defaultStyle: {
      font: 'Roboto'
    }
  };

  const outputDir = 'C:\\Users\\tp403\\.gemini\\antigravity-ide\\brain\\c40ddd15-ae27-4a82-bad0-5e1c09497c7b';
  const outputPath = path.join(outputDir, 'features_audit_report.pdf');

  const doc = pdfMake.createPdf(docDefinition as any);
  const pdfStream = await doc.getStream();
  const writeStream = fs.createWriteStream(outputPath);

  pdfStream.pipe(writeStream);
  pdfStream.end();

  writeStream.on('finish', () => {
    console.log(`PDF successfully generated at: ${outputPath}`);
    process.exit(0);
  });
}

main().catch((err) => {
  console.error("Failed to generate PDF:", err);
  process.exit(1);
});
