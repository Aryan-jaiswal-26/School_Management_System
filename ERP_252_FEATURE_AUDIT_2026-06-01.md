# School ERP 252 Feature Audit - 2026-06-01

## Audit Rules Applied

- Project architecture preserved: React/TanStack Start frontend, Express backend, MongoDB/Mongoose data layer.
- No implementation changes were made during this audit.
- A feature is marked Complete only when Frontend, API, Database, and Role Permission can be verified end to end.
- Because this audit did not execute authenticated browser flows for every feature, and the live MongoDB `roles` and `permissions` collections are empty, no item is marked Complete.
- Status legend: Complete = verified end to end; Partial = some frontend/API/schema exists; Missing = no meaningful end-to-end implementation found.

## Codebase Audit

### Folder Structure

- Frontend app: `src/`
  - `src/routes/`: role portals and module screens for super-admin, admin, teacher, student, parent, and driver.
  - `src/components/`: shared UI, module shell, admissions, payments, super-admin context.
  - `src/lib/`: API client, auth context, schemas, seed/demo data, module API helpers.
  - `src/server/`: TanStack server functions, though many frontend screens call the Express API directly.
- Backend app: `backend/src/`
  - `app.ts`, `server.ts`: Express bootstrap, middleware, MongoDB connection.
  - `routes/v1/`: API route registration.
  - `controllers/`, `services/`, `repositories/`: business/API layers.
  - `models/`: Mongoose schemas and MongoDB collections.
  - `middleware/`: auth, RBAC, tenant isolation, feature gating, upload, validation.

### MongoDB Inspection

Live read-only inspection succeeded against `DATABASE_URL`.

- Non-empty collections: `schools` 2, `users` 6, `students` 2, `employees` 2, `classes` 3, `sections` 3, `attendances` 1, `subjects` 1, `studymaterials` 1, `transportroutes` 2.
- Empty but present collections include admissions, fees, exams, homework, hostel, library, events, visitors, inventory, sports, subscriptions, notifications, chat, audit/activity logs.
- Critical RBAC blocker: `permissions` count 0 and `roles` count 0 in the inspected database.

### Mongoose Models / Collections

Implemented model areas:

- Core tenancy/profile: `School`, `Branch`, `User`, `Role`, `Permission`, `Subscription`, `SubscriptionPlan`, `AuditLog`, `ActivityLog`.
- Academics: `AcademicYear`, `Semester`, `Class`, `Section`, `Subject`, `Timetable`, `Syllabus`, `StudyMaterial`, `Exam`, `Result`.
- Student/admin operations: `Student`, `Parent`, `StudentDocument`, `AdmissionApplication`, `AdmissionLead`.
- Attendance/HR: `Attendance`, `Employee`, `EmployeeAttendance`, `EmployeeDocument`, `LeaveRequest`, `SalaryRecord`.
- Fees/payments: `Fee`, `Payment`, `FeeStructure`, `FeeScholarship`, `FeeInstallmentPlan`.
- Modules: hostel, transport, library, inventory, sports, visitors, events, notifications, chat.

Major missing collection areas:

- Canteen wallet/menu/orders/transactions.
- Health medical profile/vaccination/nurse visit/medication/incident/checkup.
- Safety/emergency SOS/drills/CCTV/lockdown/missing student alerts.
- Certificates/achievement portfolio/scholarship notifications.
- Virtual classroom sessions/recordings/whiteboard/polls/breakout/online attendance.
- Parent community forum, suggestions, surveys, translation, read receipts.
- Backup/restore jobs, external API keys/integrations, bulk imports, duplicate detection records.

### APIs

Implemented route groups include:

- `/api/v1/auth`, `/schools`, `/students`, `/employees`, `/attendance`, `/fees`, `/exams`, `/homework`, `/notifications`, `/chat`, `/academics`, `/hostel`, `/transport`, `/library`, `/hr`, `/users`, `/inventory`, `/events`, `/admissions`, `/visitors`, `/analytics`, `/leaves`, `/syllabus`, `/sports`, `/parents`.

API gaps:

- No API groups for canteen, health, safety, certificates, online classes, backup/restore, bulk import, third-party API access, newsletters, school magazine, PTM scheduling, event ticketing, feedback/surveys, community forum, GDPR/privacy workflows, mobile app version management.
- Some frontend routes are rich UI mocks/static state without matching backend APIs.
- Some frontend API calls reference endpoints that are not present in backend routes, especially broader admissions/payment flows.

### Authentication

- JWT access token support via cookie or Bearer token.
- Refresh, forgot-password, reset-password routes exist.
- Registration creates role-specific profile records for student, parent, teacher/driver/accountant.
- Tenant isolation checks authenticated user `schoolId` against resolved tenant context.

Auth gaps:

- OTP login is not implemented.
- Biometric login is not applicable in web/backend yet.
- Password reset delivery mechanism is not verified.
- App-wide privacy/GDPR and session/device management are not implemented.

### RBAC / Permissions

- Coarse `requireRoles(...)` middleware is actively used in many backend routes.
- Fine-grained `requirePermissions(...)` middleware exists but is not wired into feature routes.
- `Role` and `Permission` Mongoose models exist.
- Seed script defines only 10 coarse permissions.
- Live database has zero `roles` and zero `permissions`.

RBAC conclusion:

- Role gating is Partial.
- Permission customization is Partial/Missing depending on feature.
- No feature can be marked Complete under the requested Frontend <-> API <-> Database <-> Role Permission standard until permission data and route-level permission checks are verified.

### Existing Dashboards / UI

Implemented route surfaces:

- Super admin: overview, directory, config, helpdesk.
- Admin: dashboard, academics, admissions, analytics, canteen, certificates, communications, events, exams, fees, health, hostel, HR, inventory, library, safety, settings, sports, staff, students, transport, visitors.
- Teacher: dashboard, attendance, exams, assignments, feed, fees, leave, live class, materials, messages, profile, reports, support, syllabus, AI hub.
- Student: dashboard, academics, assignments, calendar, feed, fees, hostel, materials, notifications, profile, syllabus, timetable, transport, AI hub.
- Parent: dashboard, academics, admissions, fees, notifications, transport.
- Driver: standalone driver interface.

UI conclusion:

- UI coverage is broad, but many pages are static/demo or only partially wired to backend APIs and MongoDB collections.

## Validation Run

- Frontend build: passed with `npm run build` after running outside sandbox; Vite warned about chunks larger than 500 kB.
- Backend build: passed with `npm run build` after running outside sandbox so Prisma could generate/download required engine assets.
- No test script is defined in root or backend `package.json`.

## Feature Verification Matrix

### Super Admin - 11

| # | Feature | Status | Gap Summary |
|---|---|---|---|
| 1 | Dashboard with all schools overview | Partial | UI and school APIs exist; revenue/active users not end-to-end verified; permissions empty. |
| 2 | School onboarding add/approve schools | Partial | School CRUD exists; approval workflow not clearly modeled; permissions empty. |
| 3 | Subscription plan management | Partial | Models exist; UI config exists; route/API coverage not verified end to end. |
| 4 | Payment and billing tracking per school | Partial | Payment/Fee models exist; super-admin billing per school not complete. |
| 5 | Send announcements to all admins | Partial | Announcement API exists; global admin targeting not fully verified. |
| 6 | App-wide settings and configurations | Partial | Super-admin config UI exists; backend settings coverage limited. |
| 7 | Feature toggle per school | Partial | `featureOverrides` and middleware exist; route enforcement not broadly wired. |
| 8 | MAU/DAU/churn analytics per school | Missing | No usage analytics collections or computed churn logic found. |
| 9 | Support ticket management | Partial | Super-admin helpdesk UI exists; no matching ticket model/API found. |
| 10 | Push notification broadcast to all users | Partial | Notification APIs exist; actual push provider/device tokens not verified. |
| 11 | Manage app content terms/privacy/FAQs | Missing | No content management schema/API found. |

### Admin School Setup - 18

| # | Feature | Status | Gap Summary |
|---|---|---|---|
| 12 | School profile setup | Partial | School model/API exist; frontend settings present; permission data empty. |
| 13 | White-label branding per school | Partial | School whiteLabel schema exists; route/UI not fully verified. |
| 14 | Academic year and term/semester configuration | Partial | Models exist; API/UI coverage incomplete. |
| 15 | Class and section management | Partial | Models/routes exist under schools; no end-to-end permission verification. |
| 16 | Subject management | Partial | Subject model/API read exists; full CRUD not verified. |
| 17 | Timetable/schedule builder | Partial | Timetable model/API/UI exists; builder completeness not verified. |
| 18 | School calendar holidays/events/exams | Partial | Event and exam pieces exist; unified calendar missing. |
| 19 | Subscription management and renewal | Partial | Subscription models exist; renewal/payment flow not verified. |
| 20 | Multi-branch school management | Partial | Branch model/routes exist; multi-campus workflows not verified. |
| 21 | Role and permission customization | Partial | Models/middleware exist; live roles/permissions empty; UI not connected end to end. |
| 22 | Data backup and restore | Missing | No backup/restore model/API/job found. |
| 23 | Bulk import students/staff via Excel/CSV | Missing | No import pipeline/API found. |
| 24 | Duplicate student/record detection | Missing | No duplicate detection workflow found. |
| 25 | Audit logs | Partial | Audit/Activity models/util exist; route/UI/report coverage incomplete. |
| 26 | API access for third-party integrations | Missing | No API key/integration management found. |
| 27 | Online admission enquiry form | Partial | Admission frontend/API/model exist; route mismatch risk remains. |
| 28 | Admission application tracking | Partial | Admin UI and model exist; end-to-end status flow incomplete. |
| 29 | Waiting list management | Partial | Status supports waitlist-like values; dedicated API/UI incomplete. |

### Admin Admission, Staff, Student, Fees, Reports, Communication - 44

| # | Feature | Status | Gap Summary |
|---|---|---|---|
| 30 | Document verification checklist | Partial | Admission document fields exist; complete verification UI/API not verified. |
| 31 | Admission fee collection | Partial | Admission fee fields exist; payment integration not verified. |
| 32 | Offer letter/admission confirmation generation | Missing | No document generation workflow found. |
| 33 | New student onboarding flow | Partial | Admission-to-student pieces exist; full conversion flow not verified. |
| 34 | Add/edit/remove staff accounts | Partial | Employee/User APIs exist; permissions empty. |
| 35 | Assign staff roles | Partial | User role exists; custom permission assignment incomplete. |
| 36 | Staff attendance tracking | Partial | EmployeeAttendance model/API exists; UI verification incomplete. |
| 37 | Staff payroll management | Partial | SalaryRecord model and employee salary route exist; payroll depth incomplete. |
| 38 | Staff leave requests and approvals | Partial | Leave APIs/UI exist; permissions empty. |
| 39 | Staff documents upload | Partial | EmployeeDocument model exists; upload flow incomplete. |
| 40 | Teacher performance review | Missing | No model/API found. |
| 41 | Substitute teacher management | Missing | No model/API found. |
| 42 | Student enrollment and registration | Partial | Student/User creation exists; end-to-end admission/enrollment not verified. |
| 43 | Assign students to classes/sections | Partial | Student class/section fields exist; workflow not fully verified. |
| 44 | Student profile management | Partial | Student/User APIs and UI exist; permissions empty. |
| 45 | Student ID card generation | Missing | No ID card generation found. |
| 46 | Transfer certificate management | Partial | `tcStatus` fields/routes exist; certificate generation missing. |
| 47 | Alumni records and directory | Missing | No alumni schema/API found. |
| 48 | Discipline and behavior records | Missing | No discipline schema/API found. |
| 49 | Create fee structures | Partial | FeeStructure model/API/UI exists. |
| 50 | Assign fees to classes/students | Partial | Fee/FeeStructure exist; assignment workflow incomplete. |
| 51 | Fee payment tracking and history | Partial | Fee/Payment models and routes exist; payment flow not fully verified. |
| 52 | Send fee reminders to parents | Partial | Notification APIs exist; automated reminders not verified. |
| 53 | Generate invoices and receipts | Partial | Payment UI/server helpers exist; invoice persistence/generation incomplete. |
| 54 | Overdue fee reports | Partial | Fee status/due date exists; reports not fully verified. |
| 55 | Online payment gateway integration | Partial | Razorpay/env/payment helpers exist; backend payment order routes not fully present. |
| 56 | Sibling discount management | Missing | No sibling discount schema/logic found. |
| 57 | Scholarship and concession management | Partial | FeeScholarship model/API exists; notification workflow incomplete. |
| 58 | Partial payment and installment plans | Partial | Fee paidAmount/installment model exists; complete flow not verified. |
| 59 | Fee defaulter auto follow-up | Missing | No scheduled follow-up job found. |
| 60 | Split fee collection | Partial | Payment method fields likely support manual/online; split flow not verified. |
| 61 | GST/tax invoice generation | Missing | No GST/tax schema or invoice generation found. |
| 62 | Refund management | Partial | Frontend payment helper includes refund concepts; backend ERP routes incomplete. |
| 63 | Attendance reports students/staff | Partial | Attendance APIs exist; staff reports incomplete. |
| 64 | Fee collection reports | Partial | Fee APIs exist; export/reporting incomplete. |
| 65 | Academic performance reports | Partial | Exam/results/analytics exist; report cards incomplete. |
| 66 | Enrollment statistics | Partial | Analytics dashboard exists; exact metric verification incomplete. |
| 67 | Export reports as PDF/Excel | Missing | No export pipeline found. |
| 68 | Send targeted announcements | Partial | Announcement target audience exists; class-specific targeting incomplete. |
| 69 | Bulk SMS and push sender | Partial | Notification APIs for SMS/push exist; providers not verified. |
| 70 | Manage notice board | Partial | Announcements exist; notice board workflow incomplete. |
| 71 | Parent-teacher meeting scheduler | Missing | No PTM model/API found. |
| 72 | School news feed/social wall | Partial | Feed UI/announcements exist; social wall backend incomplete. |
| 73 | Digital school magazine/newsletter | Missing | No magazine/newsletter model/API found. |

### Teacher / Staff - 30

| # | Feature | Status | Gap Summary |
|---|---|---|---|
| 74 | View assigned classes and timetable | Partial | UI/API exist; assigned-class scoping incomplete. |
| 75 | Mark daily student attendance | Partial | API/UI exist; permissions empty. |
| 76 | QR/ID scan attendance | Missing | No QR scan flow/API found. |
| 77 | View class student list with profiles | Partial | Student APIs exist; teacher class isolation incomplete. |
| 78 | Upload study materials | Partial | StudyMaterial model/API/UI exists; file upload verification incomplete. |
| 79 | Assign homework and track submission | Partial | Homework/submission APIs/UI exist; full tracking not verified. |
| 80 | Syllabus upload per class/subject | Partial | Syllabus model/API/UI exists. |
| 81 | Syllabus completion tracker | Partial | UI/API hints exist; progress logic not fully verified. |
| 82 | Lesson plan creation/submission | Missing | No lesson plan model/API found. |
| 83 | Admin review/approval lesson plans | Missing | No approval workflow found. |
| 84 | Curriculum mapping | Missing | No curriculum map schema/API found. |
| 85 | Create exams and question papers | Partial | Exam APIs exist; question paper model absent. |
| 86 | Enter/upload student marks | Partial | Result/grade APIs exist; upload incomplete. |
| 87 | Generate report cards with GPA | Partial | Result model exists; report card generation incomplete. |
| 88 | Subject-wise performance analytics | Partial | Analytics/grades exist; not fully verified. |
| 89 | Student behavior log | Missing | No behavior log model/API found. |
| 90 | Disciplinary action records | Missing | No discipline action model/API found. |
| 91 | Parent notification on discipline | Missing | Depends on missing discipline workflow. |
| 92 | Counselor referral system | Missing | No model/API found. |
| 93 | Reward points/merit badges | Partial | Student UI shows badges; backend model missing. |
| 94 | Send messages to parents | Partial | Chat APIs exist; parent-class targeting incomplete. |
| 95 | Group chat | Partial | Conversation type supports GROUP; complete UI/permissions not verified. |
| 96 | Receive school announcements | Partial | Announcement APIs/UI exist. |
| 97 | Chat with admin | Partial | Chat APIs exist; participant restrictions not verified. |
| 98 | Video call with parents | Missing | No video call integration found. |
| 99 | Raise leave request | Partial | Leave APIs/UI exist. |
| 100 | View own attendance and salary slip | Partial | Models exist; teacher UI only partly covers. |
| 101 | View personal timetable | Partial | Timetable UI/API exists; personal scoping incomplete. |
| 102 | Profile management | Partial | Profile UI/User API exists; update not fully verified. |
| 103 | View/download payslips | Partial | SalaryRecord exists; download generation missing. |

### Student - 24

| # | Feature | Status | Gap Summary |
|---|---|---|---|
| 104 | View personal timetable | Partial | Student timetable UI/API exists. |
| 105 | View attendance record | Partial | Attendance student API/UI exists. |
| 106 | Download study materials | Partial | Materials UI/API exists; file delivery incomplete. |
| 107 | View and submit homework | Partial | Homework API/UI exists. |
| 108 | View exam schedule | Partial | Exam APIs/UI exist. |
| 109 | View marks and report cards | Partial | Results/grades exist; report card generation incomplete. |
| 110 | Download performance certificates | Missing | No certificate generation/download backend. |
| 111 | View notices and announcements | Partial | Announcement APIs/UI exist. |
| 112 | Fee payment history view only | Partial | Fee/payment APIs/UI exist; student scoping risk. |
| 113 | School calendar access | Partial | Calendar UI exists; unified backend missing. |
| 114 | Live GPS bus tracking on map | Partial | Transport GPS fields/API/UI exist; map/real-time not fully verified. |
| 115 | Chat with teacher if enabled | Partial | Chat exists; feature flag enforcement not verified. |
| 116 | Virtual classroom access | Partial | Live class UI exists; backend missing. |
| 117 | Class recordings and replays | Missing | No recording model/API found. |
| 118 | Polls/quizzes participation | Missing | No poll/quiz model/API found. |
| 119 | Library catalog and borrowing status | Partial | Library APIs exist; student UI limited. |
| 120 | Co-curricular activities/events | Partial | Event/sports activity models exist; student flow incomplete. |
| 121 | Student portfolio builder | Partial | Student profile UI has portfolio section; backend missing. |
| 122 | Achievement badges/merit points | Partial | UI exists; backend missing. |
| 123 | Sports team/competition details | Partial | Sports APIs exist; student-facing API/UI incomplete. |
| 124 | Canteen menu/pre-order meals | Missing | Admin canteen UI exists; no backend. |
| 125 | Canteen wallet balance view | Missing | No canteen wallet model/API. |
| 126 | Birthday notifications/wishes | Missing | No birthday notification job found. |
| 127 | Student council voting | Partial | UI section exists; no voting backend. |

### Parent - 38

| # | Feature | Status | Gap Summary |
|---|---|---|---|
| 128 | View child's attendance | Partial | Parent dashboard/API exists; child scoping not fully verified. |
| 129 | View homework/submission status | Partial | Homework APIs exist; parent-specific flow incomplete. |
| 130 | View exam schedule/results | Partial | Exam/result APIs exist; parent UI partial. |
| 131 | Download report cards | Missing | No report card download generation. |
| 132 | View timetable | Partial | Parent academics UI/API exists. |
| 133 | Monitor behavior/discipline | Missing | Discipline module absent. |
| 134 | View certificates/badges | Partial | UI placeholders exist; backend missing. |
| 135 | Manage multiple children | Partial | Parent model has studentIds; UI/API not fully verified. |
| 136 | Live real-time bus GPS tracking | Partial | Transport route location exists; real-time map incomplete. |
| 137 | Bus arrival push notification | Missing | No ETA notification engine found. |
| 138 | Bus route map with stops | Partial | Stops/GPS fields and UI exist. |
| 139 | Driver name/photo/contact | Partial | Driver name/phone fields exist; photo incomplete. |
| 140 | Boarding/deboarding alerts | Missing | No boarding/deboarding collection/API. |
| 141 | Bus schedule and stop timings | Partial | Transport stops include time. |
| 142 | Trip history | Missing | No trip history collection/API. |
| 143 | Bus SOS/emergency alert | Missing | No bus SOS workflow found. |
| 144 | In-app chat with class teacher | Partial | Chat APIs exist; class-teacher pairing incomplete. |
| 145 | Video call with teacher | Missing | No video call integration. |
| 146 | Receive fee reminders/pay online | Partial | Fees/notifications/payment partial. |
| 147 | Receive announcements/notices | Partial | Announcements exist. |
| 148 | Request parent-teacher meeting | Missing | PTM scheduler absent. |
| 149 | Submit leave application for child | Partial | Leave concepts exist; parent child leave flow incomplete. |
| 150 | Read receipts on important notices | Missing | No read receipt model/API beyond notification read. |
| 151 | Message translation | Missing | No translation workflow. |
| 152 | Parent community forum | Missing | No forum model/API. |
| 153 | Automated reminders | Missing | No scheduler/reminder rules found. |
| 154 | Feedback/rating on events | Missing | No event feedback model/API. |
| 155 | Anonymous suggestion box | Missing | No suggestion model/API. |
| 156 | View pending and paid fees | Partial | Fee APIs/UI exist. |
| 157 | Pay fees via UPI/card/net banking | Partial | Payment helpers exist; full gateway flow not verified. |
| 158 | Download payment receipts | Partial | Receipt concepts exist; generation/download incomplete. |
| 159 | Canteen wallet load balance | Missing | Canteen backend absent. |
| 160 | Canteen transaction history | Missing | Canteen backend absent. |
| 161 | Update contact/profile info | Partial | User/parent models exist; update flow incomplete. |
| 162 | Notification preferences | Missing | No preference schema/API found. |
| 163 | Feedback/satisfaction survey | Missing | No survey model/API found. |
| 164 | Parent admissions applications | Partial | Parent admissions UI/API exists; route mismatch risk. |
| 165 | Parent transport dashboard | Partial | Transport UI/API exists; real-time completeness missing. |

### Bus Driver App - 9

| # | Feature | Status | Gap Summary |
|---|---|---|---|
| 166 | Driver login and profile | Partial | DRIVER role exists; profile UI/API incomplete. |
| 167 | Start/end trip one tap | Partial | Driver UI exists; backend only route location/tripActive partial. |
| 168 | Mark student boarded/deboarded | Partial | Driver UI has roster; no persisted API/collection. |
| 169 | Live route navigation | Partial | UI exists; navigation integration not verified. |
| 170 | Breakdown/delay reporting | Missing | No incident/report model/API found. |
| 171 | Driver attendance tracking | Partial | EmployeeAttendance exists; driver-specific flow incomplete. |
| 172 | Vehicle maintenance log/reminders | Missing | No vehicle maintenance schema/API. |
| 173 | SOS panic button | Partial | UI may exist; backend SOS absent. |
| 174 | Trip history/logs | Missing | No trip log collection/API. |

### Library - 6

| # | Feature | Status | Gap Summary |
|---|---|---|---|
| 175 | Book inventory/categorization | Partial | LibraryBook model/API/UI exists. |
| 176 | Issue and return tracking | Partial | BookCirculation model/API/UI exists. |
| 177 | Fine calculation for late returns | Partial | Due/status fields exist; fine logic not verified. |
| 178 | Book search/reservation | Partial | Search helper exists; reservation model/API missing. |
| 179 | Low stock alerts | Missing | No alert logic found. |
| 180 | E-book/digital resource section | Missing | No e-book schema/API found. |

### Canteen - 6

| # | Feature | Status | Gap Summary |
|---|---|---|---|
| 181 | Digital menu with nutrition | Partial | Admin UI exists; no Mongo/API. |
| 182 | Allergy/dietary tagging | Partial | UI concepts may exist; no schema/API. |
| 183 | Pre-order meal | Partial | UI concepts may exist; no schema/API. |
| 184 | Canteen wallet system | Missing | No model/API. |
| 185 | Transaction history | Missing | No model/API. |
| 186 | Daily sales report | Missing | No model/API/report. |

### Health & Medical - 7

| # | Feature | Status | Gap Summary |
|---|---|---|---|
| 187 | Student medical profile | Partial | Student bloodGroup exists and admin health UI exists; full schema/API missing. |
| 188 | Vaccination records | Partial | UI likely exists; no schema/API. |
| 189 | Nurse/doctor visit logs | Partial | UI likely exists; no schema/API. |
| 190 | Medication tracker | Partial | UI likely exists; no schema/API. |
| 191 | Incident/injury reports | Partial | UI likely exists; no schema/API. |
| 192 | Health alerts to parents | Missing | No health alert backend. |
| 193 | Annual health checkup records | Partial | UI likely exists; no schema/API. |

### Hostel - 7

| # | Feature | Status | Gap Summary |
|---|---|---|---|
| 194 | Room and bed allotment | Partial | HostelRoom allocation APIs/UI exist. |
| 195 | Hostel fee management | Partial | Hostel + fee models exist; integrated hostel fee flow incomplete. |
| 196 | Warden communication portal | Partial | Notices/complaints exist; warden role not modeled. |
| 197 | Student in/out register | Partial | HostelLeave exists; in/out register incomplete. |
| 198 | Hostel attendance | Partial | HostelAttendance API/UI exists. |
| 199 | Visitor log for hostel students | Partial | HostelVisitor API/UI exists. |
| 200 | Hostel notice board | Partial | HostelNotice API/UI exists. |

### Sports & Extracurricular - 7

| # | Feature | Status | Gap Summary |
|---|---|---|---|
| 201 | Sports team management | Partial | SportsTeam API/UI exists. |
| 202 | Tournament/match scheduling | Partial | Tournament API/UI exists; match depth incomplete. |
| 203 | Achievement/trophy tracking | Missing | No trophy/achievement model/API. |
| 204 | Activity enrollment | Partial | ExtracurricularActivity model/API exists; enrollment missing. |
| 205 | Coach/instructor assignment | Missing | No coach assignment schema/API. |
| 206 | Inter-school competition management | Missing | Tournament model insufficient for inter-school workflow. |
| 207 | Sports day/annual day scheduling | Partial | Event model can represent events; dedicated workflow missing. |

### Online Classes / Virtual Classroom - 8

| # | Feature | Status | Gap Summary |
|---|---|---|---|
| 208 | Live class scheduling | Partial | Teacher live-class UI exists; no backend schedule/integration. |
| 209 | Class recording and replay | Missing | No recording schema/API. |
| 210 | Virtual whiteboard | Partial | UI concept possible; no backend/persistence. |
| 211 | In-class polls/quizzes | Missing | No poll/quiz schema/API. |
| 212 | Raise hand/participation | Missing | No participation model/API. |
| 213 | Breakout rooms | Missing | No model/integration. |
| 214 | Online attendance auto-marked | Missing | No online attendance integration. |
| 215 | Study material sharing during live class | Partial | Study materials exist; live-class sharing not integrated. |

### Visitor Management - 5

| # | Feature | Status | Gap Summary |
|---|---|---|---|
| 216 | Visitor entry log | Partial | VisitorLog API/UI exists. |
| 217 | Gate pass QR/OTP | Missing | No QR/OTP gate pass generation found. |
| 218 | Pre-approved visitor list | Partial | PreApprovedVisitor API/UI exists. |
| 219 | Parent visit notification to teacher | Missing | No notification workflow. |
| 220 | Blacklist/block visitors | Partial | BlacklistedVisitor API/UI exists. |

### Safety & Emergency - 7

| # | Feature | Status | Gap Summary |
|---|---|---|---|
| 221 | SOS panic button student/staff | Partial | Safety UI exists; no backend SOS collection/API. |
| 222 | Emergency broadcast to parents | Partial | Notification API exists; emergency workflow missing. |
| 223 | Fire/emergency drill scheduler | Partial | Safety UI likely exists; no drill schema/API. |
| 224 | Missing student alert | Missing | No model/API. |
| 225 | CCTV live feed integration | Missing | No integration found. |
| 226 | School lockdown alert | Missing | No lockdown workflow found. |
| 227 | Bus SOS/breakdown alert | Missing | No bus emergency backend. |

### Certificates & Achievements - 6

| # | Feature | Status | Gap Summary |
|---|---|---|---|
| 228 | Auto-generate performance certificates | Partial | Admin certificate UI exists; backend generation missing. |
| 229 | Participation certificates | Partial | UI exists; backend generation missing. |
| 230 | Digital achievement portfolio | Partial | Student UI exists; backend missing. |
| 231 | Scholarship tracking/notification | Partial | FeeScholarship exists; notification workflow incomplete. |
| 232 | Student of the month | Missing | No model/API. |
| 233 | Co-curricular achievement certificates | Partial | UI exists; backend generation missing. |

### Events & School Culture - 8

| # | Feature | Status | Gap Summary |
|---|---|---|---|
| 234 | School event creation/publishing | Partial | Event API/UI exists. |
| 235 | RSVP/event registration | Missing | No RSVP/registration model/API. |
| 236 | Online ticket booking | Missing | No ticketing/payment model/API. |
| 237 | Event gallery upload | Missing | No gallery model/API. |
| 238 | Volunteer signup | Missing | No volunteer model/API. |
| 239 | Birthday notifications/wishes | Missing | No scheduler/job. |
| 240 | Student council election/voting | Partial | Student UI section exists; backend missing. |
| 241 | School magazine/newsletter | Missing | No magazine/newsletter model/API. |

### App-Wide - 13 Audited Items

The source document category total says 13, and the extracted visible list contains 13 app-wide items. The grand total still states 252 features, but summing the category totals in the DOCX produces 254, so the source specification has a two-item total discrepancy.

| # | Feature | Status | Gap Summary |
|---|---|---|---|
| 242 | Secure login OTP/email/password | Partial | Email/password JWT exists; OTP missing. |
| 243 | Biometric login | Missing | No mobile biometric integration. |
| 244 | Multi-language support | Missing | No i18n framework/translation workflow found. |
| 245 | Dark/light mode | Partial | UI styling exists; persistent theme toggle not fully verified. |
| 246 | In-app push notifications | Partial | Notification model/API exists; device token/provider missing. |
| 247 | Role-based access control | Partial | Coarse roles exist; fine-grained permissions not active and DB empty. |
| 248 | Offline mode cached data | Missing | No offline/cache strategy found beyond normal browser behavior. |
| 249 | Document upload and viewer | Partial | Upload middleware/document models exist; viewer incomplete. |
| 250 | In-app help/support chat | Partial | Super-admin helpdesk/support UIs exist; backend ticketing missing. |
| 251 | Activity log/audit trail | Partial | Models/utils exist; route/UI coverage incomplete. |
| 252 | GDPR/data privacy compliance | Missing | No privacy export/delete/consent workflows found. |
| 253 | App update/version management | Missing | No app version/update management found. |
| 254 | In-app feedback/bug report button | Missing | No feedback/bug report backend found. |

## Status Summary

- Complete: 0
- Partial: Most core school ERP modules have at least one UI/API/model surface, but lack verified permission wiring or full business flows.
- Missing: Advanced mobile/app-wide, safety, canteen, health, virtual classroom, certificates, community, and automation-heavy workflows are mostly absent at backend/database level.

Note: Because the extracted visible list produced 254 row entries after preserving every app-wide bullet, this report keeps the visible source bullets instead of silently dropping any. The DOCX grand total says 252, so the next audit pass should reconcile the two-item discrepancy directly in Word if exact numbering must match procurement/compliance paperwork.

## Highest-Risk Broken Flows

- RBAC cannot be verified because live `roles` and `permissions` collections are empty.
- Fine-grained `requirePermissions` middleware is not wired into routes, so "role permission" is mostly coarse role checks.
- Several frontend screens imply modules that have no backend collection or API.
- Payment frontend/server helpers and backend fee/payment APIs are not a single clearly verified payment gateway flow.
- Super-admin subscription/feature-gating models exist, but route-level `requireFeature(...)` enforcement is not broadly applied.
- Parent/student resource isolation exists as middleware but is not consistently wired into all sensitive routes.

## Recommended Implementation Phases

1. RBAC foundation: seed roles/permissions, attach route-level permissions, add tests for each role.
2. Core data integrity: tenant isolation, parent/student/teacher scoping, audit logging, feature toggle enforcement.
3. Core ERP completion: admissions, students, staff, attendance, fees, academics, notifications.
4. Operational modules: transport, hostel, library, visitors, sports, inventory.
5. Missing product modules: canteen, health, safety, certificates, virtual classroom, events culture.
6. App-wide mobile capabilities: push devices, i18n, offline cache, privacy workflows, version management.
