# 🏫 School Management ERP

A complete school management system powered by React & TanStack. It runs entirely in the browser using `localStorage`, meaning you don't need to worry about setting up a backend or database to get started! ✨

## ✨ Main Features

- ⚙️ **Admin Dashboard** - Full control over school settings
- 👥 **User Management** - Manage students, teachers, staff, and parents easily
- 📅 **Academics & Planning** - Track attendance, assignments, exams, and timetables
- 💰 **Finance & Operations** - Fees, payroll, library, hostel, transport, and canteen management
- 🏥 **HR & Welfare** - Leave management, health, sports, and events
- 📊 **Insights & Communication** - Notifications, messaging, reports, and analytics
- 🔑 **Specialized Portals** - Super-admin, driver, and nurse access
- 📁 **Extra Goodies** - File uploads, Swagger API docs, and Socket.IO updates

## 📂 Project Structure

- `src/` ⚛️ Frontend React application
- `src/routes/` 🛣️ Pages for admin, teacher, student, parent, and other roles
- `src/components/` 🧩 Reusable UI components
- `src/services/` 📡 Frontend API services
- `src/lib/api-client.ts` 💾 Local storage data client
- `src/lib/auth-context.tsx` 🔐 Local authentication & session state

## 🛠️ Requirements

- **Node.js** and **npm** 📦
- **Git** 🌿

## 🚀 Quick Start (Installation)

Clone the repository and install the dependencies:

```bash
git clone https://github.com/Aryan-jaiswal-26/School_Management_System.git
cd School_Management_System
npm install
```

> **Note:** 🛑 No backend, database, `.env` file, or API credentials are required. Just install and run! 

## 🏃‍♂️ Run the Project

```bash
npm run dev
```

Your app will be live at: 🔗 `http://localhost:5173`

## ⌨️ Useful Commands

| Command | Description |
| ------- | ----------- |
| `npm run dev` | 🛠️ Start development server |
| `npm run build` | 🏗️ Create production build |
| `npm run preview` | 🔍 Preview production build |
| `npm run lint` | 🧹 Check code for issues |
| `npm run format` | ✨ Format code beautifully |

## 💾 Local Data Storage

All your data is saved automatically right in your browser's `localStorage` under the `campus_os_data:` prefix. Login sessions use the `campus_os_auth` key. 

💡 *Tip:* If you ever need to "reset" the database, just clear your browser storage!

## 🎭 User Roles Available

Admin, Teacher, Student, Parent, Staff, Driver, Nurse, and Super Admin.