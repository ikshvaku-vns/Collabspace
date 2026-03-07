# CollabSpace PRD

## 1. Project Overview
**1.1 The Premise**
**CollabSpace** is a real-time, multi-user workspace designed specifically as a portfolio capstone project. It focuses on solving a hard technical problem — distributed state synchronization (live cursors, real-time kanban boards, and chat) — demonstrating seniority and system design competence to recruiters and hiring managers.

While the frontend will be clean and professional, the true value of this project lies in the backend architecture and WebSocket implementation. 

**1.2 Goals**
* Build a portfolio piece that screams "Senior Frontend/Fullstack Engineer"
* Demonstrate mastery over WebSockets (Socket.IO) and real-time state management
* Introduce TypeScript across the full stack — the top recruiter signal missing from current resume
* Show deployment fluency: CI/CD pipeline, containerisation basics, and live demo URL
* Build a product that is genuinely usable and shareable — not just a toy

**1.3 Non-Goals**
* This is NOT a commercial product — no monetisation, billing, or enterprise features in v1
* No mobile app in v1 — web-only to keep scope tight
* No AI features in v1 — those are reserved for the AI Property Dashboard project

## 2. Target Users
For the purpose of this portfolio project, there are two user personas — but these also serve as the demo audience:

| Persona | Description | Key Needs |
| :--- | :--- | :--- |
| **Collaborator** | A team member joining a shared workspace | See others' cursors, update tasks live, get notified of changes instantly |
| **Workspace Owner** | User who creates and invites others to a room | Control membership, manage board state, see presence of all users |

## 3. Feature Specification

**3.1 Authentication & Onboarding**
* Email + password signup/login using JWT (access token + refresh token pattern)
* OAuth login via Google (single provider is sufficient for portfolio)
* Protected routes — redirect unauthenticated users to login
* User profile: display name, avatar (initials fallback), account creation date

**3.2 Workspace Management**
* Create a workspace (room) with a name and optional description
* Invite collaborators via unique invite link — no email required for simplicity
* Workspace list on dashboard showing last active time and member count
* Leave or delete a workspace

**3.3 Real-Time Collaborative Task Board — Core Feature**
This is the centrepiece feature and should receive the most engineering attention.
* Kanban-style board with three columns: To Do, In Progress, Done
* Create, edit, delete, and move cards across columns — all changes reflected live for all users in the room
* Live cursors: every connected user's cursor position is broadcast and rendered as a named, colour-coded pointer
* Presence bar: avatars of all currently online users shown at the top of the board
* Typing indicators: show 'Ankit is editing...' when a user is typing in a card title field
* Optimistic UI updates: apply changes locally before server confirmation to feel instantaneous

**3.4 Real-Time Chat Panel**
* Persistent chat sidebar per workspace
* Messages stored in MongoDB and loaded on join (last 50 messages)
* Live message delivery via Socket.IO — no page refresh needed
* User online/offline status indicator next to each message sender

**3.5 Notifications & Activity Feed**
* In-app toast notifications for: new user joined room, card moved, card assigned to you
* Activity log panel showing timestamped actions (e.g. 'Ankit moved 'Setup DB' to Done — 2m ago')

**3.6 Admin: Reconnection & Error Handling**
This is the feature that separates a toy from a production-grade project — and is a great interview talking point.
* Automatic Socket.IO reconnection with exponential backoff
* Conflict resolution: last-write-wins for card edits (document this decision in the README)
* Visual indicator when a user disconnects: avatar greys out, cursor disappears
* Error boundaries in React to prevent full-page crashes

## 4. Technical Architecture

**4.1 Tech Stack**

| Layer | Technology | Why |
| :--- | :--- | :--- |
| **Frontend** | React + TypeScript + Tailwind CSS | Industry standard; TS is a top recruiter signal |
| **State Mgmt** | Redux Toolkit | Familiar and comfortable; RTK’s createSlice pairs well with TypeScript and scales cleanly |
| **Backend** | Node.js + Express + TypeScript | Consistency with frontend; familiar territory |
| **Real-Time** | Socket.IO (rooms + namespaces) | Proven expertise from Convrse Spaces — leverage it |
| **Session Cache** | Redis | Store presence & active cursors; adds cloud credibility |
| **Database** | MongoDB + Mongoose | Existing familiarity; flexible for task/chat schemas |
| **Auth** | JWT + Google OAuth (Passport.js) | Shows security awareness |
| **Deployment** | Vercel (FE) + Railway (BE + Redis) | Free tier, fast deploys, CI/CD integration |
| **CI/CD** | GitHub Actions | Lint + type check on every PR; badge on README |

**4.2 Socket.IO Event Architecture**
All real-time events follow a namespaced pattern: `<namespace>:<action>`. Rooms are scoped to workspace IDs.

| Event Name | Direction | Payload & Purpose |
| :--- | :--- | :--- |
| `cursor:move` | Client → Server | `{ x, y, userId }` — broadcast cursor position to room |
| `card:update` | Bidirectional | `{ cardId, field, value, workspaceId }` — sync card edits |
| `card:move` | Bidirectional | `{ cardId, fromColumn, toColumn }` — column transitions |
| `user:joined` | Server → Room | `{ userId, displayName }` — presence notification |
| `user:typing` | Client → Server | `{ userId, cardId, isTyping }` — typing indicator |
| `chat:message` | Bidirectional | `{ text, userId, timestamp }` — chat delivery |
| `user:disconnected` | Server → Room | `{ userId }` — trigger presence cleanup in UI |

**4.3 Data Models**
* **User**: `_id`, `email`, `passwordHash`, `displayName`, `avatarUrl`, `createdAt`, `oauthProvider`
* **Workspace**: `_id`, `name`, `description`, `ownerId`, `memberIds[]`, `inviteToken`, `createdAt`, `lastActiveAt`
* **Card**: `_id`, `workspaceId`, `title`, `description`, `column` (todo|inprogress|done), `assigneeId`, `order`, `createdBy`, `updatedAt`
* **ChatMessage**: `_id`, `workspaceId`, `userId`, `text`, `timestamp`
* **ActivityLog**: `_id`, `workspaceId`, `actorId`, `action` (string), `entityId`, `createdAt`

## 5. Development Roadmap
Target timeline: 6 weeks of evenings/weekends. Each milestone ends with a deployable, demoable state.

| Week | Milestone | Deliverables | Recruiter Signal |
| :--- | :--- | :--- | :--- |
| **1** | Foundation | Project scaffold (Vite + TS), Express server, MongoDB connection, repo with CI | TypeScript + CI/CD |
| **2** | Auth | JWT signup/login, Google OAuth, protected routes, user profile page | Security awareness |
| **3** | Workspaces | Create workspace, invite link, member list, workspace dashboard | CRUD + routing design |
| **4** | Real-Time Core | Kanban board with live card sync, cursors, presence bar, typing indicators | WebSocket architecture |
| **5** | Chat + Redis | Chat panel, Redis presence caching, reconnection logic, error boundaries | Redis + resilience |
| **6** | Polish & Deploy | Activity feed, notifications, README, architecture diagram, Vercel/Railway deploy | Deployment + docs |

## 6. Success Criteria
This project succeeds when all of the following are true:
* Live demo URL works without login prompts failing or blank screens
* Two browser tabs open on the same workspace show live cursor movement within 100ms
* README includes: architecture diagram, tech decisions rationale, local setup under 5 commands, and CI badge
* TypeScript strict mode enabled — zero ts-ignore comments
* At least one recruiter or senior engineer has reviewed and commented on the GitHub repo
* Can be walked through end-to-end in under 4 minutes during an interview screen share

## 7. Resume Integration Guide
Once complete, update your resume bullet points under a 'Projects' section as follows:
* **Real-time core**: Engineered a multi-user collaborative workspace with live cursor sync and presence indicators using Socket.IO rooms — sub-100ms latency across concurrent sessions
* **Architecture**: Designed WebSocket event schema, Redis-backed presence layer, and reconnection logic with exponential backoff for production resilience
* **TypeScript**: Built across a full TypeScript stack (React + Express) with strict mode and CI lint checks on every pull request via GitHub Actions
* **Deployment**: Deployed on Vercel + Railway with automated CI/CD pipeline — live demo available at [url]

*CollabSpace PRD · Ankit Anand · March 2026 · For portfolio use*
