# Collaborative Team Hub

A full-stack collaborative workspace platform that enables teams to manage shared goals, post announcements, track action items in real time, and collaborate across multiple workspaces.

**Live demo:** [https://your-web.up.railway.app](https://your-web.up.railway.app)  
**API:** [https://your-api.up.railway.app](https://your-api.up.railway.app)

---

## Project Overview

Collaborative Team Hub is a comprehensive team workspace application built for modern organizations that need centralized goal tracking, announcement management, and real-time collaboration. The platform enables teams to:

- **Manage Goals & Milestones** — Create high-level objectives with nested milestones, track progress through updates, and visualize completion rates
- **Post Announcements** — Share important updates with rich text formatting, emoji reactions, comments, and the ability to pin critical posts
- **Track Action Items** — Organize tasks using a Kanban board or list view, assign team members, set priorities and due dates, and link items to specific goals
- **Collaborate in Real-Time** — See changes instantly across all connected clients via WebSocket updates for announcements, action items, and notifications
- **Work Across Workspaces** — Switch between multiple workspaces, each with its own team, goals, and announcements, with customizable accent colors

---

## Features

### Authentication & Authorization

- User registration with email and password
- Login with secure JWT-based authentication
- Automatic token refresh via httpOnly cookies
- Session persistence across browser tabs
- Logout with immediate token invalidation

### Workspaces

- Create new workspaces with custom name, description, and accent color
- Switch between multiple workspaces via sidebar dropdown
- Invite members by email with role assignment (Admin/Member)
- Workspace-specific settings for name, description, and accent color

### Goals & Milestones

- Create goals with title, description, and optional due date
- Add milestones to goals with progress tracking (0-100%)
- Post progress updates with rich text content
- Status tracking: Not Started, In Progress, Completed, At Risk
- Filter goals by status in the goals dashboard

### Announcements

- Rich text announcements with formatting support
- Emoji reactions (like, love, celebrate, think, rocket) on posts
- Comment thread on each announcement
- Pin important announcements to top of feed
- Real-time updates when new announcements are posted

### Action Items

- Kanban board view with columns: To Do, In Progress, In Review, Done
- List view with sortable columns
- Drag and drop to move items between columns
- Link action items to specific goals
- Assign to team members
- Set priority (Low, Medium, High, Urgent) and due dates
- Status updates reflect immediately with optimistic UI

### Real-Time Updates

- Socket.io integration for instant updates
- Live notification delivery for new announcements, action item changes, and mentions
- Optimistic UI updates across all components
- Automatic reconnection on connection loss

### Analytics Dashboard

- Overview metrics: total goals, action items, announcements
- Goal completion rates visualized with charts
- Action item status distribution
- Workspace activity trends using Recharts

### Data Export

- CSV export functionality for goals and action items
- Export includes all relevant fields and metadata

---

## Advanced Features Implemented

### 1. Optimistic UI

The application implements optimistic updates throughout the interface, providing a snappy user experience:

- **Action Item Status Changes** — When you move a card between columns or change status, the UI updates immediately. If the server request fails, the change automatically rolls back and displays an error notification
- **Announcement Reactions** — Emoji reactions appear instantly when clicked, then sync with the server in the background. Failed reactions are reverted automatically
- **Goal Creation** — New goals appear immediately in the list while the server processes the request. On failure, the goal is removed and the create dialog re-opens
- **Announcement & Comment Posting** — New posts appear instantly in the feed with a temporary ID, then replace with the server-generated ID on success

This pattern uses temporary IDs (`temp-{timestamp}`) to identify optimistic updates, with automatic duplicate prevention when Socket.io broadcasts return the same data.

### 2. Advanced RBAC (Role-Based Access Control)

The application implements a comprehensive permission matrix enforced on both backend middleware and frontend UI:

| Action | Admin | Member |
|--------|-------|--------|
| Create workspace | ✅ | ❌ |
| Update workspace settings | ✅ | ❌ |
| Invite members | ✅ | ❌ |
| Remove members | ✅ | ❌ |
| Create goals | ✅ | ✅ |
| Update any goal | ✅ | ❌ |
| Delete any goal | ✅ | ❌ |
| Create milestones | ✅ | ✅ |
| Post announcements | ✅ | ✅ |
| Pin/unpin announcements | ✅ | ❌ |
| Delete any announcement | ✅ | ❌ |
| Create action items | ✅ | ✅ |
| Update any action item | ✅ | ❌ |
| Delete any action item | ✅ | ❌ |

Backend middleware (`checkPermission.js`) validates every API request against the permission matrix. Frontend components use the `usePermission` hook to conditionally render UI elements based on the user's role in the active workspace.

---

## Tech Stack

| Area | Technology |
|------|------------|
| **Monorepo** | Turborepo + pnpm |
| **Frontend Framework** | Next.js 14+ (App Router) |
| **UI Styling** | Tailwind CSS + shadcn/ui |
| **State Management** | Zustand |
| **Backend Framework** | Node.js + Express.js |
| **Database** | PostgreSQL + Prisma ORM |
| **Authentication** | JWT (access + refresh tokens) |
| **Real-Time** | Socket.io |
| **File Storage** | Cloudinary |
| **Deployment** | Railway |

---

## Project Structure

```
team-hub/
├── apps/
│   ├── api/                    # Express.js REST API
│   │   ├── lib/                # Utilities (Prisma, JWT, Cloudinary, permissions)
│   │   ├── middleware/         # Auth & permission middleware
│   │   ├── routes/             # API route handlers
│   │   ├── index.js            # Server entry point
│   │   ├── seed.js             # Database seeding script
│   │   └── package.json
│   │
│   └── web/                    # Next.js frontend application
│       ├── app/                # App Router pages and layouts
│       │   ├── (auth)/         # Login and register pages
│       │   ├── dashboard/      # Authenticated dashboard pages
│       │   │   ├── action-items/
│       │   │   ├── analytics/
│       │   │   ├── announcements/
│       │   │   ├── goals/
│       │   │   └── settings/
│       │   └── workspaces/     # Workspace management pages
│       ├── components/          # Reusable UI components
│       ├── hooks/              # Custom React hooks
│       ├── lib/                # API client, utilities
│       ├── store/              # Zustand state stores
│       ├── proxy.js            # API proxy for dev
│       └── package.json
│
├── packages/
│   └── db/                     # Prisma schema and client
│       └── prisma/
│           └── schema.prisma
│
├── turbo.json                  # Turborepo configuration
├── pnpm-workspace.yaml         # pnpm workspace config
└── package.json                # Root package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL (local or cloud)

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/team-hub
cd team-hub
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Configure Environment Variables

Create the backend environment file:

```bash
cp apps/api/.env.example apps/api/.env
```

Create the frontend environment file:

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

Edit both files with your actual values (see Environment Variables section below).

### Step 4: Run Database Migrations

```bash
cd packages/db
pnpm dlx prisma migrate dev
cd ../..
```

### Step 5: Seed the Database

```bash
cd apps/api
node seed.js
```

### Step 6: Start the Development Server

```bash
pnpm dev
```

This starts both the frontend (http://localhost:3000) and backend API (http://localhost:4000) concurrently using Turborepo.

---

## Environment Variables

### Backend (`apps/api/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (e.g., `postgresql://user:pass@localhost:5432/db`) | ✅ |
| `JWT_ACCESS_SECRET` | Secret key for signing access tokens | ✅ |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens | ✅ |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary API key | ✅ |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | ✅ |
| `CLIENT_URL` | Frontend URL for CORS (e.g., `http://localhost:3000`) | ✅ |
| `NODE_ENV` | Environment mode (`development` or `production`) | Optional |

### Frontend (`apps/web/.env.local`)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g., `http://localhost:4000/api`) | ✅ |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io server URL (e.g., `http://localhost:4000`) | ✅ |

---

## Deployment

### Railway Deployment

1. **Create a Railway Project**
   - Sign up at [railway.app](https://railway.app)
   - Create a new project

2. **Provision PostgreSQL**
   - In your Railway project, click "New" → "Database" → "PostgreSQL"
   - Railway will automatically provision a PostgreSQL instance and provide the `DATABASE_URL`

3. **Deploy Backend API**
   - Click "New" → "GitHub Repo" or "Empty Service"
   - Select your repository and the `apps/api` directory
   - Set the build and start commands:
     - Build: `pnpm install && pnpm --filter api build` (or just `node index.js` if not building)
     - Start: `node index.js`
   - Add all required environment variables in the Variables tab

4. **Deploy Frontend**
   - Click "New" → "GitHub Repo" or "Empty Service"
   - Select your repository and the `apps/web` directory
   - Set the build and start commands:
     - Build: `pnpm install && pnpm --filter web build`
     - Start: `pnpm --filter web start`
   - Add all required environment variables, including the backend API URL (update to point to your Railway backend URL)

5. **Update Client URL**
   - In the backend service's variables, set `CLIENT_URL` to your frontend Railway URL
   - In the frontend service's variables, update `NEXT_PUBLIC_API_URL` to point to your backend Railway URL

---

## Demo Account

The database seed script creates the following demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@demo.com` | `demo1234` |
| Member | `member@demo.com` | `demo1234` |

The Admin user has full access to all features including workspace management, member invitations, and content moderation. The Member user has standard access limited to creating and managing personal content within workspaces they belong to.

---

## Known Limitations

- **No Mobile Application** — The platform is optimized for desktop browsers only; mobile responsiveness is limited
- **No Real-Time Collaborative Editing** — Documents and content are edited by one user at a time; simultaneous editing is not supported
- **No Email Notifications** — Users must check the application manually for updates; email alerts for mentions, deadlines, or new content are not implemented
- **No Unit Tests** — The codebase lacks automated test coverage; manual testing is the primary quality assurance method
- **Invite by Email Requires Existing Account** — Team members must already have an account to be invited to a workspace; self-registration is workspace-specific
- **Limited File Types** — File uploads are restricted to image types handled by Cloudinary; document and PDF uploads are not supported

---

## License

MIT License