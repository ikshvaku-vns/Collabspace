# CollabSpace - Project Plan & Dependencies

Based on the Product Requirements Document (PRD), here is the structured plan for the workspace, external dependencies required, and the week-by-week implementation priorities.

## 1. Project Folder Structure
Since we are building both a frontend and a backend, the recommended approach is a **Monorepo structure**. We will have a single root folder containing both self-contained projects:

```text
CollabSpace/
├── frontend/    # React + Vite + TypeScript + Tailwind CSS
├── backend/     # Node.js + Express + TypeScript + Socket.IO
└── project_plan.md
```

*(Note: The actual project initialization is deferred for now, but this is the planned structure.)*

---

## 2. External Dependencies & APIs Required

Before we start building, we will need to set up accounts or gather credentials for the following external services:

### Authentication
* **Google OAuth API**: Needed for "Sign in with Google" via Passport.js. We will need to create a project in the Google Cloud Console and obtain the `Client ID` and `Client Secret`.

### Database & Caching
* **MongoDB**: Using MongoDB Atlas (Cloud) is recommended for storing User, Workspace, Card, ChatMessage, and ActivityLog data. We will need a `MONGO_URI`.
* **Redis**: Used for Session Cache and storing presence/active cursors. We can provision a managed Redis instance (e.g., via Railway, Upstash, or Redis Labs).

### Real-Time Communication
* **Socket.IO**: The core for real-time collaborative features (Kanban board live sync, cursors, presence, chat). No external API key needed, this runs on our backend server.

### Deployment & CI/CD
* **Vercel**: For deploying the frontend React application.
* **Railway**: For deploying the Node.js backend and provisioning the Redis instance.
* **GitHub**: For source control and setting up GitHub Actions (CI/CD pipeline for type checking and linting on every PR).

---

## 3. Implementation Roadmap (Week-by-Week Priorities)

Here is the week-wise priority execution plan directly derived from the PRD timeline:

### Week 1: Foundation
* **Goal**: Scaffold the project architecture.
* **Tasks**: 
  * Initialize the `frontend` (Vite + TS) and `backend` (Express) folders.
  * Connect the backend to MongoDB.
  * Set up the GitHub repository with the CI/CD pipeline (GitHub Actions).

### Week 2: Auth
* **Goal**: Implement secure user authentication.
* **Tasks**: 
  * Set up JWT (JSON Web Tokens) for email/password signup and login.
  * Integrate Google OAuth using Passport.js.
  * Create protected frontend routes and outline the user profile page.

### Week 3: Workspaces
* **Goal**: Workspace creation and management.
* **Tasks**: 
  * Build the ability to create workspaces (rooms).
  * Generate unique invite links for collaboration.
  * Develop the workspace list dashboard and member view.

### Week 4: Real-Time Core (Highest Priority)
* **Goal**: The core collaborative Kanban board.
* **Tasks**: 
  * Build the Kanban board UI with To Do, In Progress, and Done columns.
  * Integrate Socket.IO for live card sync across clients.
  * Implement live cursors, presence bar, and typing indicators.

### Week 5: Chat + Redis
* **Goal**: Real-time communication and system resilience.
* **Tasks**: 
  * Add the persistent chat sidebar to workspaces.
  * Integrate Redis for presence caching and active session tracking.
  * Implement automatic Socket.IO reconnection logic and React error boundaries.

### Week 6: Polish & Deploy
* **Goal**: Finalize features and launch.
* **Tasks**: 
  * Complete the activity feed and in-app toast notifications.
  * Write a comprehensive README with the architecture diagram.
  * Deploy the application (Frontend to Vercel, Backend to Railway) and share the live demo URL.
