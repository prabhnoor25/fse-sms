# School Management System (FSE-SMS)

## Project overview
This repository contains a basic School Management System with a Node.js + Express backend and a React frontend (Material-UI). The system currently supports user signup/login, JWT-based auth, role-based dashboard for admins, and a simple Sequelize-based User model backed by MySQL.

Files of interest

- server/
  - index.js – Express app entry. Registers middleware and routes, starts HTTP server on PORT (env or 5000).
  - routes/auth.js – Signup and login endpoints. Uses bcrypt to hash passwords and JWT to sign tokens. Syncs User model (User.sync({ alter: true })) for dev-time schema changes.
  - models.js – Sequelize initialization and User model. Fields: username, password, role (admin|teacher|student), name, email.
  - middleware.js – authMiddleware that reads Authorization header (Bearer token), verifies JWT and attaches req.user. Used to protect routes.
  - dashboard.js – Admin-protected route (/api/dashboard/admin) returning a list of users (id, username, role, name, email).
  - .env – example env values in the repo (DB_NAME, DB_USER, DB_PASS, DB_HOST, JWT_SECRET).
  - package.json – server dependencies (express, sequelize, mysql2, bcryptjs, jsonwebtoken, cors, dotenv).

- client/ (Create React App)
  - src/api.js – client API helpers (login, signup, getDashboard). Uses REACT_APP_API_URL or http://localhost:5000/api.
  - src/Login.js – Login form, calls login(), sets token and user on success.
  - src/Signup.js – Signup form (role select: admin/teacher/student), calls signup().
  - src/Dashboard.js – If user role is admin, calls getDashboard and lists users in a Material-UI table; otherwise shows a welcome card.
  - src/App.js – App-level state for user/token and simple navigation between login/signup and dashboard.
  - package.json – React dependencies (MUI v5, react 19, react-scripts).

What's implemented (summary)

- Backend: User, Student, Teacher, SchoolClass and Subject Sequelize models with basic associations. Authentication (signup/login) with JWT; auth middleware and admin dashboard.
- REST API: CRUD endpoints for Students, Teachers, Classes, Subjects, Assignments, Enrollments, Grades, and Attendance with role-based access controls. Database sync performed at server startup (sequelize.sync()).
- Frontend: Login, Signup, Admin Dashboard, and polished CRUD UIs for Students, Teachers, Classes, Subjects, Assignments, Enrollments, Grades and Attendance (client/src). Responsive side navigation, dashboard summary cards, and improved layout for better UX.
- Dev DB connectivity via Sequelize to MySQL (config in server/.env).

Setup & running (development)

Prerequisites:
- Node.js (16+), npm
- MySQL server

1) Backend
- Copy/modify server/.env with DB_* and JWT_SECRET. Example:
  DB_NAME=school_db
  DB_USER=root
  DB_PASS=root
  DB_HOST=localhost
  JWT_SECRET=supersecret

- From repository root, run:
  cd server
  npm install
  node index.js

This will start the backend on PORT (default 5000). Sequelize will try to connect to the MySQL DB.

Account creation & UX updates (important):
- The top Sign Up button was removed from the navigation; user creation is admin-only in the UI. The public /api/auth/signup endpoint still exists for manual or scripted use but should be restricted in production.
- Admins should create teacher and student accounts via the admin UI or the admin-only endpoints. Endpoints:
  - POST /api/teachers — body: { employeeId, name, email, phone, subjects, password } — creates a Teacher record and a corresponding User (username = employeeId). Password must be provided by the admin.
  - POST /api/students — body: { rollNumber, name, class, section, email, guardianName, phone, password } — creates a Student and a corresponding User (username = rollNumber).
- The frontend now includes modal Edit flows across entities (Students, Teachers, Subjects, Classes, Assignments, Enrollments). Each list has an Edit button that opens a pre-filled dialog and submits changes via PUT /api/<entity>/:id.
- Teacher subjects are selected from existing subjects (frontend fetches GET /api/subjects) and submitted as subject IDs. Currently the app stores subject IDs as a comma-separated string (consider normalizing to a join table in future).
- For login, use username (employeeId for teachers, rollNumber for students) and the password set by the admin. Admins must securely share credentials; consider adding temporary-password + email and force-reset on first login for production.

Security note: Admins must securely share passwords with users. Consider adding a temporary-password + email flow or forcing password reset on first login in future releases.

2) Frontend
- From repository root, run:
  cd client
  npm install
  npm start

Open http://localhost:3000 (or the port CRA uses). After logging in as an admin, use the Admin UI to create Students and Teachers (Sign Up was removed from the top navigation). The admin list views include Edit buttons (modal dialogs) to update records.

Recommended environment variables

- server/.env
  - DB_NAME, DB_USER, DB_PASS, DB_HOST
  - JWT_SECRET (use a strong secret)
  - PORT (optional)

- client/.env
  - REACT_APP_API_URL (e.g., http://localhost:5000/api)


Next steps (To-DO Features)

- Multi-tenant or school entity support (schools, classes, sections, subjects)
- Models and endpoints for Students, Teachers, Classes, Subjects, Assignments, Grades, Attendance
- Admin UI: create classes, assign teachers, enroll students
- Notifications (email/SMS), role-specific dashboards, reporting/export
- RBAC UI for managing permissions and roles
- A timetable that teachers can create and syncs to student's view

Appendix: Quick API reference

Authentication

- POST /api/auth/signup
  - body: { username, password, role, name, email }
  - returns: { message, user }

- POST /api/auth/login
  - body: { username, password }
  - returns: { token, user }

Protected routes require header: Authorization: Bearer <token>

Admin dashboard

- GET /api/dashboard/admin
  - role: admin required
  - returns: { users: [...] }

Students

- POST /api/students
  - role: admin or teacher
  - body: { rollNumber, name, class, section, email, guardianName, phone }
  - returns: { student }

- GET /api/students
  - returns: { students: [...] }

- GET /api/students/:id
  - returns: { student }

- PUT /api/students/:id
  - role: admin or teacher
  - body: fields to update
  - returns: { student }

- DELETE /api/students/:id
  - role: admin only
  - returns: { message }

Teachers

- POST /api/teachers
  - role: admin only
  - body: { employeeId, name, email, phone, subjects }
  - returns: { teacher }

- GET /api/teachers
  - returns: { teachers: [...] }

- GET /api/teachers/:id
  - returns: { teacher }

- PUT /api/teachers/:id
  - role: admin only
  - returns: { teacher }

- DELETE /api/teachers/:id
  - role: admin only
  - returns: { message }

Classes

- POST /api/classes
  - role: admin or teacher
  - body: { name, grade, section, teacherId }
  - returns: { class }

- GET /api/classes
  - returns: { classes: [...] }

- GET /api/classes/:id
  - returns: { class }

- PUT /api/classes/:id
  - role: admin or teacher
  - returns: { class }

- DELETE /api/classes/:id
  - role: admin only
  - returns: { message }

Subjects

- POST /api/subjects
  - role: admin or teacher
  - body: { code, name, description, classId }
  - returns: { subject }

- GET /api/subjects
  - returns: { subjects: [...] }

- GET /api/subjects/:id
  - returns: { subject }

- PUT /api/subjects/:id
  - role: admin or teacher
  - returns: { subject }

- DELETE /api/subjects/:id
  - role: admin only
  - returns: { message }

Enrollments

- POST /api/enrollments
  - role: admin or teacher
  - body: { studentId, classId }
  - returns: { enrollment }

- GET /api/enrollments
  - returns: { enrollments: [...] }

- GET /api/enrollments/class/:classId
  - returns: { enrollments: [...] }

- GET /api/enrollments/student/:studentId
  - returns: { enrollments: [...] }

- DELETE /api/enrollments/:id
  - role: admin only
  - returns: { message }

Assignments

- POST /api/assignments
  - role: admin or teacher
  - body: { title, description, dueDate, classId, subjectId, teacherId }
  - returns: { assignment }

- GET /api/assignments
  - returns: { assignments: [...] }

- GET /api/assignments/:id
  - returns: { assignment }

- PUT /api/assignments/:id
  - role: admin or teacher
  - returns: { assignment }

- DELETE /api/assignments/:id
  - role: admin only
  - returns: { message }

Grades

- POST /api/grades
  - role: admin or teacher
  - body: { studentId, assignmentId, marks, remarks }
  - returns: { grade }

- GET /api/grades/student/:studentId
  - returns: { grades: [...] }

- PUT /api/grades/:id
  - role: admin or teacher
  - returns: { grade }

- DELETE /api/grades/:id
  - role: admin only
  - returns: { message }

Attendance

- POST /api/attendance
  - role: admin or teacher
  - body: { studentId, classId, date, status }
  - returns: { attendance }

- GET /api/attendance/student/:studentId
  - returns: { attendance: [...] }

- GET /api/attendance/class/:classId
  - returns: { attendance: [...] }

- DELETE /api/attendance/:id
  - role: admin only
  - returns: { message }

Notes

- Server syncs Sequelize models on startup. For development, ensure MySQL is running and server/.env contains DB_* and JWT_SECRET values.

Project status

- Current: MVP feature-complete for core school workflows in a development environment.
  - Backend: User, Student, Teacher, SchoolClass, Subject, Enrollment, Assignment, Grade, Attendance models and REST endpoints with role-based access.
  - Frontend: Login, Signup, Admin Dashboard, and CRUD UIs for Students, Teachers, Classes, Subjects, Assignments, Enrollments, Grades and Attendance.
  - Dev setup: sequelize.sync() on startup (development convenience).

- Completion status: PARTIAL (Not production-ready)
  - The core MVP for development/testing is implemented. The project is NOT complete for production use.
  - Critical missing items: input validation, DB migrations, secure auth (refresh tokens/httpOnly cookies), tests/CI, robust error handling, and security hardening.

- Not complete / Known gaps (remaining work):
  - Input validation and robust error handling (server & client).
  - Migrations and production-ready DB setup (currently uses sync()).
  - Secure token storage (client keeps token in memory), refresh tokens and logout persistence.
  - Tests and CI pipeline.
  - UI polish: edit/update flows, confirmation dialogs, pagination, searching, and better state management.
  - Security: CORS restrictions, rate limiting, password policies, secret management.
  - Notifications (email/SMS), file uploads, reporting/export, timetable UI, RBAC management.

Recommended immediate next steps (priority order)

1. Add input validation and central error middleware (reduces bugs quickly).
2. Implement migrations (Sequelize CLI) and remove sync() from production startup.
3. Harden auth (refresh tokens, httpOnly cookies) and persistent sessions.
4. Add basic tests and CI.
5. Improve frontend UX: edit/update flows, confirmations, pagination.

If you want, start with (1) input validation and error handling — confirm to proceed.


## Recent session updates (developer changes applied)
These are the changes implemented during the current editing session to make the app more usable and to add live activity tracking and improved form UX.

- UI/branding and login
  - Renamed header text from "School Management System" to "Campus Care" and removed the top-bar Login button.
  - Redesigned Login page: constrained width, centered both vertically and horizontally, and uses a user-provided image (client/public/images/school.jpg) as the background. Added per-page overflow-y hidden only for Login to avoid cutting other pages.

- Recent Activity (live)
  - Added Activity model on the server (meta stored as TEXT) and User.lastLogin.
  - Implemented server/socket.js and integrated Socket.IO; server emits 'activity' events on login and student creation.
  - Admin dashboard: replaced bottom panes with a full-width "Recent Activity" pane that receives live events via Socket.IO and falls back to polling the /api/dashboard/admin endpoint.

- Authentication & passwords
  - Teachers already had password handling; student create/edit now accepts a password and creates/updates a corresponding User (username = rollNumber) with bcrypt-hashed password.
  - Fixed backend payloads so recent-activity events include actor name (no more "undefined logged in").

- Forms & foreign-key UX
  - Replaced manual ID text inputs with Select dropdowns in multiple forms: Assignments, Enrollments, Subjects, Grades, and Attendance. Dropdowns fetch referenced lists via API (GET /students, /classes, /teachers, /subjects, /assignments).
  - Table views now attempt to show human-readable names (e.g., class name, student name, assignment title) when available.

- Date pickers
  - Integrated MUI x-date-pickers (AdapterDayjs + dayjs) for the Attendance date and Assignment dueDate fields. Installed client dependencies: @mui/x-date-pickers and dayjs. The pickers store dates as 'YYYY-MM-DD' strings in form state.

- Backend fixes
  - Converted Activity.meta from JSON to TEXT to avoid MySQL JSON compatibility issues.
  - Removed stray Model.sync() calls; centralized sequelize.sync({ alter: true }) at server startup for development.

- Misc
  - Partial FK dropdown migration across many forms (Assignments, Enrollments, Subjects, Grades, Attendance). Remaining forms can be migrated similarly.
  - ESLint warnings may appear in build output (react-hooks/exhaustive-deps and unused vars) — these are non-blocking but should be cleaned up.

How to test locally (quick):
- Backend: cd server && npm install && node index.js (ensure server/.env is configured)
- Frontend: cd client && npm install && npm start; hard-refresh the browser after updates

If you'd like, continue to:
- Migrate remaining forms to dropdowns
- Add server-side validation and input sanitization
- Add pagination/search to Recent Activity

(End of session update notes.)
