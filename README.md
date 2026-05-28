# Task Management System

A full-stack MEAN application with role-based access control, JWT authentication, and real-time task updates via Socket.IO.

## Tech Stack

| Layer    | Technology                      |
|----------|---------------------------------|
| Frontend | Angular 14                      |
| Backend  | Node.js 20 + Express 4          |
| Database | MongoDB (Mongoose ODM)          |
| Auth     | JWT (jsonwebtoken + bcryptjs)   |
| Realtime | Socket.IO 4                     |

---

## Roles & Permissions

| Role      | Capabilities                                                                 |
|-----------|------------------------------------------------------------------------------|
| Manager   | View all users & tasks, create/modify/reassign any task, manage all users   |
| Team Lead | View/modify/assign tasks to own team members or self                        |
| Employee  | Create & modify own tasks (auto-assigned to self)                            |

---

## Prerequisites

- **Node.js 20+** — [nodejs.org](https://nodejs.org)
- **MongoDB** — local install **or** [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier)
- **Angular CLI 14** — `npm install -g @angular/cli@14`

---

## Setup & Run

### 1. Clone / Open the project

```bash
cd "Task Management System"
```

### 2. Backend

```bash
cd backend
npm install
```

Edit `backend/.env` if needed (default uses `mongodb://localhost:27017/task_management`):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/task_management
JWT_SECRET=change_this_to_a_random_secret
JWT_EXPIRES_IN=7d
```

Start the backend:

```bash
npm run dev        # development (nodemon auto-reload)
# or
npm start          # production
```

The API will be available at `http://localhost:5000`.

### 3. Frontend

```bash
cd frontend
npm install
ng serve
```

The app will be available at `http://localhost:4200`.

---

## API Endpoints

### Auth
| Method | Route              | Access  | Description              |
|--------|--------------------|---------|--------------------------|
| POST   | /api/auth/register | Public  | Register a new user      |
| POST   | /api/auth/login    | Public  | Login & receive JWT      |
| GET    | /api/auth/me       | Auth    | Get current user profile |

### Tasks
| Method | Route            | Access | Description                       |
|--------|------------------|--------|-----------------------------------|
| GET    | /api/tasks       | Auth   | Get tasks (role-filtered)         |
| POST   | /api/tasks       | Auth   | Create a task                     |
| GET    | /api/tasks/:id   | Auth   | Get single task                   |
| PUT    | /api/tasks/:id   | Auth   | Update task (role restrictions)   |
| DELETE | /api/tasks/:id   | Auth   | Delete task (role restrictions)   |

Query params for GET /api/tasks: `?status=pending&priority=high`

### Users (Manager only)
| Method | Route                   | Access  | Description          |
|--------|-------------------------|---------|----------------------|
| GET    | /api/users              | Manager | List all users       |
| POST   | /api/users              | Manager | Create a user        |
| GET    | /api/users/team-leads   | Manager | List team leads      |
| GET    | /api/users/:id          | Manager | Get user by ID       |
| PUT    | /api/users/:id          | Manager | Update a user        |
| DELETE | /api/users/:id          | Manager | Delete a user        |
| GET    | /api/users/my-team/members | TeamLead | Get own team members |

---

## Real-Time Updates (Socket.IO)

The backend emits these events to all connected clients:

| Event         | Payload         | Trigger              |
|---------------|-----------------|----------------------|
| `taskCreated` | Full Task object | Task is created     |
| `taskUpdated` | Full Task object | Task is updated     |
| `taskDeleted` | `{ id: string }` | Task is deleted    |

The Angular frontend connects via `SocketService` and updates the task list reactively.

---

## Seed Data (optional)

After starting the backend you can register users directly from the frontend registration page, or via the API:

```bash
# Manager
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"manager1","email":"manager@test.com","password":"pass123","role":"Manager"}'

# Team Lead
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"lead1","email":"lead@test.com","password":"pass123","role":"TeamLead"}'

# Employee
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"emp1","email":"emp@test.com","password":"pass123","role":"Employee"}'
```

---

## Project Structure

```
Task Management System/
├── backend/
│   ├── src/
│   │   ├── controllers/    # authController, taskController, userController
│   │   ├── middleware/     # auth (JWT verify + role guard)
│   │   ├── models/         # User.js, Task.js (Mongoose schemas)
│   │   ├── routes/         # auth.js, tasks.js, users.js
│   │   └── app.js          # Express app + Socket.IO + MongoDB connect
│   ├── .env
│   └── package.json
│
└── frontend/
    └── src/
        └── app/
            ├── auth/           # login, register components + AuthModule
            ├── dashboard/      # Dashboard with stats + DashboardModule
            ├── tasks/          # task-list, task-form + TasksModule
            ├── users/          # user-list, user-form + UsersModule
            ├── layout/         # Navbar
            └── shared/
                ├── guards/      # AuthGuard, RoleGuard
                ├── interceptors/ # AuthInterceptor (JWT header injection)
                ├── models/      # user.model.ts, task.model.ts
                └── services/    # auth, task, user, socket services
```
