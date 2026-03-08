# CollabSpace

CollabSpace is a full-stack collaborative workspace built to demonstrate real-time system design, production-oriented React architecture, and a TypeScript-first Node backend. It combines a shared Kanban board, workspace chat, invite-based collaboration, live presence, and activity tracking in one portfolio-ready project.

**Live frontend:** [collabspace-frontend-ecru.vercel.app](https://collabspace-frontend-ecru.vercel.app)

## Why this project stands out

CollabSpace is not a CRUD demo dressed up with a UI. The core problem it solves is distributed state synchronization across multiple clients:

- shared board state updated by multiple users
- workspace-scoped WebSocket rooms
- live cursors and presence indicators
- invite-link collaboration flows
- persistent chat plus activity history
- optimistic interactions with server-backed persistence

This repo is designed to showcase the kind of engineering decisions recruiters and interviewers look for in frontend and full-stack candidates: routing, auth, state modeling, real-time events, deployment, and clean separation between client and server responsibilities.

## Current status

Implemented:
- Email/password authentication with JWT
- Protected frontend routes
- Workspace creation, listing, deletion, and invite-based joining
- Real-time Kanban board with drag-and-drop
- Live cursor broadcasting within a workspace
- Online presence tracking per workspace
- Real-time chat with persisted message history
- Activity feed across workspaces
- Frontend deployment routing fix for direct SPA routes on Vercel

Planned but not yet implemented:
- Google OAuth
- Redis-backed presence/session caching

## Product walkthrough

### Authentication
- Register and sign in with email/password
- JWT is attached to API requests via Axios interceptors
- Unauthenticated users are redirected to `/login`

### Workspaces
- Create a workspace with name and description
- Invite collaborators using a unique invite token link
- View member avatars and last active timestamps from the dashboard
- Delete workspaces you own

### Real-time board
- Three-column Kanban workflow: `todo`, `inprogress`, `done`
- Create, edit, delete, and move cards
- Drag-and-drop interactions implemented on the client
- Socket.IO broadcasts card movement and update events to the room

### Collaboration signals
- Live user presence in each workspace
- Live cursor rendering with consistent per-user colors
- Join/leave notifications and visual cleanup on disconnect
- Reconnection enabled on the client with backoff settings

### Chat and activity
- Persistent workspace chat backed by MongoDB
- Last 50 messages loaded on workspace entry
- Activity feed captures workspace joins, card creation, deletion, and movement
- Dashboard shows recent cross-workspace activity for quick scanning

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router |
| State management | Redux Toolkit |
| Drag and drop | `@hello-pangea/dnd` |
| API client | Axios |
| Real-time transport | Socket.IO |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| Auth | JWT |
| Deployment | Vercel (frontend) |

## Architecture

```text
+---------------------------+         HTTP / WebSocket         +-----------------------------+
| React + Redux frontend    |  <---------------------------->  | Express + Socket.IO backend |
| - auth flows              |                                  | - REST APIs                 |
| - dashboard               |                                  | - JWT auth middleware       |
| - workspace board         |                                  | - workspace/card/chat routes|
| - chat + activity UI      |                                  | - room-based WS events      |
+-------------+-------------+                                  +--------------+--------------+
              |                                                                   |
              |                                                                   |
              v                                                                   v
     Browser localStorage                                                MongoDB via Mongoose
     - JWT token                                                         - users
     - session bootstrap                                                 - workspaces
                                                                         - cards
                                                                         - chat messages
                                                                         - activity logs
```

## Real-time event model

The backend uses workspace-scoped Socket.IO rooms. Key events include:

- `workspace:join`
- `workspace:leave`
- `workspace:users`
- `user:joined`
- `user:disconnected`
- `cursor:move`
- `cursor:update`
- `cursor:remove`
- `card:update`
- `card:updated`
- `card:move`
- `card:moved`
- `chat:message`
- `user:typing` planned in the socket layer, not yet surfaced in the current UI

## Backend API overview

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Workspaces
- `GET /api/workspaces`
- `POST /api/workspaces`
- `GET /api/workspaces/:id`
- `PUT /api/workspaces/:id`
- `DELETE /api/workspaces/:id`
- `POST /api/workspaces/join/:inviteToken`

### Cards
- `GET /api/cards/:workspaceId`
- `POST /api/cards`
- `PUT /api/cards/:id`
- `DELETE /api/cards/:id`
- `PATCH /api/cards/:id/move`

### Chat and activity
- `GET /api/chat/:workspaceId`
- `GET /api/activity`
- `GET /api/activity/:workspaceId`
- `GET /api/health`

## Data model snapshot

- `User`: email, password hash, display name, avatar URL, created at
- `Workspace`: owner, members, invite token, last active timestamp
- `Card`: workspace, title, description, column, order, assignee, creator
- `ChatMessage`: workspace, sender, text, timestamp
- `ActivityLog`: workspace, actor, action, entity metadata, timestamp

## Engineering decisions

### 1. TypeScript across the full stack
Using TypeScript in both the frontend and backend keeps contracts explicit and makes the app easier to extend safely. This is especially useful in Redux slices, API payloads, and Socket.IO events.

### 2. Room-scoped Socket.IO design
Every collaborative action is scoped to a workspace room. This keeps broadcasts targeted and avoids unnecessary client updates across unrelated sessions.

### 3. MongoDB for flexible collaboration data
The app stores cards, messages, workspaces, and activity logs in MongoDB. This schema is flexible enough for evolving product features without overfitting early abstractions.

### 4. In-memory presence for the current deployment stage
Presence and cursors are currently tracked in memory on the backend. That keeps the implementation simple for a single-instance deployment and makes the next step clear: move ephemeral collaboration state to Redis for multi-instance consistency.

### 5. Last-write-wins conflict model
Card updates currently follow a practical last-write-wins strategy. For a portfolio product, that is a reasonable tradeoff between complexity and demonstrable real-time behavior.

## Monorepo structure

```text
CollabSpace/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vercel.json
├── backend/
│   ├── src/
│   └── package.json
├── prd.md
├── project_plan.md
└── README.md
```

## Local setup

### Prerequisites
- Node.js 18+
- npm
- MongoDB instance or Atlas connection string

### Environment variables
Create a root `.env` file for the backend:

```bash
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
PORT=5000
```

Optional frontend variables:

```bash
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### Install
```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

### Run locally
In one terminal:
```bash
cd backend
npm run dev
```

In a second terminal:
```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`.
Backend runs on `http://localhost:5000`.

## Deployment notes

### Frontend
- deployed on Vercel
- uses SPA rewrites so direct routes like `/login` and `/join/:inviteToken` resolve correctly

### Backend
- designed for deployment behind a public base URL with CORS configured via `FRONTEND_URL`
- requires MongoDB connectivity and a valid `JWT_SECRET`

## What I would build next

1. Add Google OAuth for one-click onboarding
2. Move presence and cursor state to Redis for multi-instance scaling
3. Add typing indicators to the visible UI
4. Add automated tests for auth, workspace permissions, and socket flows
5. Add CI checks for type safety and build validation on every push
6. Add screenshots, a short demo GIF, and backend deployment documentation

## Recruiter-facing highlights

- Built a real-time multi-user collaboration product, not just a static task board
- Modeled REST and WebSocket layers separately for clearer system boundaries
- Implemented TypeScript across client and server for stronger contracts
- Deployed a production-accessible frontend with route-safe Vercel configuration
- Designed the app around extensibility: Redis, OAuth, and CI are natural next iterations rather than rewrites

## Source documents

This README is grounded in:
- [prd.md](./prd.md)
- [project_plan.md](./project_plan.md)

## License

This project is currently shared as a portfolio project.
