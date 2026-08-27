# School Management ERP

A school management system with a React/TanStack frontend. All application data is stored in the browser's localStorage; no backend or database is required.

## Main Features

- Admin dashboard and school settings
- Student, teacher, staff, and parent management
- Attendance, assignments, exams, and timetable
- Fees, payroll, library, hostel, transport, and canteen
- HR, leave management, health, sports, and events
- Notifications, messaging, reports, and analytics
- Super-admin, driver, and nurse portals
- File uploads, Swagger API documentation, and Socket.IO updates

## Project Structure

- `src/` - Frontend React application
- `src/routes/` - Pages for admin, teacher, student, parent, and other roles
- `src/components/` - Reusable frontend components
- `src/services/` - Frontend API services
- `src/lib/api-client.ts` - Local storage data client
- `src/lib/auth-context.tsx` - Local authentication and session state

## Requirements

- Node.js and npm
- Git

## Installation

```bash
git clone https://github.com/tanmaypatil0001/school-management-erp.git
cd school-management-erp
npm install
```

No backend, database, environment file, or API credentials are required.

## Run the Project

```bash
npm run dev
```

Frontend URL: `http://localhost:5173`

## Useful Commands

### Frontend

```bash
npm run dev       # Start development server
npm run build     # Create production build
npm run preview   # Preview production build
npm run lint      # Check code
npm run format    # Format code
```

## Local Data

Data is saved automatically in browser localStorage under the `campus_os_data:` prefix. Login sessions use the `campus_os_auth` key. Clearing browser storage removes the locally saved application data.

## User Roles

Admin, Teacher, Student, Parent, Staff, Driver, Nurse, and Super Admin.
