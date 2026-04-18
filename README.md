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

- Backend: user model, signup, login, JWT auth, auth middleware, admin dashboard route.
- Frontend: login/signup UI, token handling in-memory, admin dashboard to view users.
- Dev DB connectivity via Sequelize to MySQL (config read from .env).

Limitations & known issues

- No migrations or production-grade schema management (using sync({ alter: true }) in route file).
- Password reset, email verification, and profile update endpoints missing.
- No input validation or rate limiting on backend.
- No refresh tokens; JWT expires in 1 day (configured in auth route).
- No secure token storage in client (token kept in memory — page refresh loses session).
- No CORS origin restriction; cors() called with defaults.
- No tests or CI configured.

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

This will start the backend on PORT (default 5000). Sequelize will try to connect to the MySQL DB and User.sync will run when signup route file loads.

2) Frontend
- From repository root, run:
  cd client
  npm install
  npm start

Open http://localhost:3000 (or the port CRA uses). Use the signup page to create users and login.

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

- POST /api/auth/signup
  - body: { username, password, role, name, email }
  - returns: { message, user }

- POST /api/auth/login
  - body: { username, password }
  - returns: { token, user }

- GET /api/dashboard/admin
  - headers: Authorization: Bearer <token>
  - role: admin required
  - returns: { users: [...] }
