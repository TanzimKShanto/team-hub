# Team Hub — Project Context for AI Agents

## What This Project Is
A full-stack **Collaborative Team Hub** web app built as a technical assessment for FredoCloud.
Teams can manage shared goals, post announcements, and track action items in real time.
Deadline: May 3, 2025. Individual submission.

---

## Monorepo Structure
```
team-hub/
├── apps/
│   ├── web/          # Next.js 16 frontend (JavaScript, App Router, NO TypeScript)
│   └── api/          # Node.js + Express REST API
├── packages/
│   └── db/           # Shared Prisma client (@repo/db)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

Package manager: **pnpm** (use `pnpm dlx` not `npx`)
Monorepo tool: **Turborepo**
Run everything: `pnpm dev` from root

---

## Tech Stack (all mandatory per assignment)

| Area | Technology |
|---|---|
| Monorepo | Turborepo |
| Frontend | Next.js 16, App Router, **JavaScript only (no TypeScript)** |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Backend | Node.js + Express.js (REST API) |
| Database | PostgreSQL + Prisma ORM (v7) |
| Auth | JWT — access token (15min) + refresh token (7 days) in httpOnly cookies |
| Real-time | Socket.io |
| File storage | Cloudinary (avatars & attachments) |
| Deployment | Railway — frontend & backend as separate services |
| Version control | Git, conventional commits |

---

## Advanced Features Chosen
1. **Optimistic UI** — actions reflect instantly before server confirmation, roll back on error
2. **Advanced RBAC** — permission matrix: Admin vs Member roles per workspace

---

## Ports
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

---

## Key Files & Paths

### Backend (`apps/api/`)
```
apps/api/
├── lib/
│   ├── prisma.js         # Prisma client singleton
│   └── jwt.js            # generateAccessToken, generateRefreshToken, setTokenCookies, clearTokenCookies
├── middleware/
│   └── authenticate.js   # JWT auth middleware — reads access_token cookie, sets req.userId
├── routes/
│   └── auth.js           # /api/auth/* — register, login, logout, refresh, me
├── index.js              # Express app entry, CORS, cookie-parser, routes
└── .env                  # DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, CLIENT_URL, NODE_ENV
```

### Frontend (`apps/web/`)
```
apps/web/
├── app/
│   ├── layout.js         # Root layout with AuthProvider
│   ├── globals.css
│   ├── login/page.js
│   ├── register/page.js
│   └── dashboard/page.js
├── components/
│   └── AuthProvider.js   # Calls hydrate() on mount to rehydrate user from /auth/me
├── lib/
│   └── api.js            # Axios instance, baseURL=NEXT_PUBLIC_API_URL, withCredentials:true, auto-refresh interceptor
├── store/
│   └── authStore.js      # Zustand store: user, loading, hydrated, hydrate(), login(), register(), logout()
├── proxy.js              # Next.js 16 route protection (was middleware.js — renamed to proxy.js in Next 16)
└── .env.local            # NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### Shared DB (`packages/db/`)
```
packages/db/
├── prisma/
│   └── schema.prisma     # All models (see below)
├── generated/
│   └── client/           # Prisma generated client output
├── prisma.config.ts      # Points to schema, NO earlyAccess/accelerate
└── package.json          # name: @repo/db, postinstall: prisma generate
```

---

## Database Models (Prisma Schema)

- **User** — id, email, password, name, avatar
- **RefreshToken** — id, token, userId, expiresAt (stored in DB for revocation)
- **Workspace** — id, name, description, accentColor
- **WorkspaceMember** — userId, workspaceId, role (ADMIN | MEMBER) — unique[userId, workspaceId]
- **Goal** — title, description, status (NOT_STARTED | IN_PROGRESS | COMPLETED | AT_RISK), dueDate, ownerId, workspaceId
- **Milestone** — title, progress (0-100), goalId
- **GoalUpdate** — content, goalId (activity feed entries)
- **ActionItem** — title, status (TODO | IN_PROGRESS | DONE), priority (LOW | MEDIUM | HIGH), dueDate, assigneeId, goalId, workspaceId
- **Announcement** — content, isPinned, authorId, workspaceId
- **Comment** — content, authorId, announcementId
- **Reaction** — emoji, userId, announcementId — unique[userId, announcementId, emoji]
- **Notification** — content, read, userId, commentId
- **AuditLog** — action, entity, entityId, userId, workspaceId, meta (Json)

---

## Auth Flow
1. Register/Login → API returns user JSON + sets `access_token` (15min) and `refresh_token` (7days) as httpOnly cookies
2. Every API request sends cookies automatically (`withCredentials: true`)
3. On 401, Axios interceptor calls `/auth/refresh` to rotate tokens, then retries original request
4. `GET /auth/me` — used on app load to rehydrate Zustand user state from cookie
5. Logout → deletes refresh token from DB, clears both cookies
6. Route protection via `proxy.js` (Next.js 16) — checks `access_token` cookie existence

---

## Zustand Store Shape

### authStore
```js
{
  user: null | { id, name, email, avatar },
  loading: boolean,
  hydrated: boolean,       // prevents repeated hydrate() calls
  hydrate(),               // calls GET /auth/me, sets user
  login(email, password),
  register(name, email, password),
  logout()
}
```

### workspaceStore (to be built)
```js
{
  workspaces: [],
  activeWorkspace: null,   // { id, name, description, accentColor, role }
  members: [],
  setActiveWorkspace(workspace),
  fetchWorkspaces(),
  createWorkspace(data),
  switchWorkspace(id)
}
```

---

## API Routes Built So Far

### Auth (`/api/auth`)
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /register | No | Create account, set cookies |
| POST | /login | No | Login, set cookies |
| POST | /logout | No | Clear cookies, revoke refresh token |
| POST | /refresh | No | Rotate refresh token |
| GET | /me | Cookie | Get current user |

---

## API Routes To Build

### Workspaces (`/api/workspaces`)
- POST / — create workspace (user becomes Admin)
- GET / — list user's workspaces
- GET /:id — get workspace details + members
- PATCH /:id — update name/description/accentColor (Admin only)
- POST /:id/invite — invite member by email (Admin only)
- PATCH /:id/members/:userId — change role (Admin only)
- DELETE /:id/members/:userId — remove member (Admin only)

### Goals (`/api/workspaces/:workspaceId/goals`)
- GET / — list goals
- POST / — create goal
- GET /:id — goal detail with milestones + updates
- PATCH /:id — update goal
- DELETE /:id — delete goal (Admin or owner)
- POST /:id/milestones — add milestone
- PATCH /:id/milestones/:mId — update milestone progress
- POST /:id/updates — post progress update

### Action Items (`/api/workspaces/:workspaceId/action-items`)
- GET / — list (filterable by status, assignee, goalId)
- POST / — create
- PATCH /:id — update (status, assignee, priority) — optimistic UI target
- DELETE /:id — delete

### Announcements (`/api/workspaces/:workspaceId/announcements`)
- GET / — list (pinned first)
- POST / — create (Admin only)
- PATCH /:id/pin — toggle pin (Admin only)
- POST /:id/reactions — add/remove emoji reaction — optimistic UI target
- POST /:id/comments — add comment with @mention parsing

### Analytics (`/api/workspaces/:workspaceId/analytics`)
- GET / — total goals, completed this week, overdue count, completion chart data
- GET /export — CSV export

---

## RBAC Rules
| Action | Admin | Member |
|---|---|---|
| Create workspace | ✓ | ✓ |
| Invite members | ✓ | ✗ |
| Change member roles | ✓ | ✗ |
| Post announcements | ✓ | ✗ |
| Pin announcements | ✓ | ✗ |
| Create goals | ✓ | ✓ |
| Delete any goal | ✓ | ✗ |
| Delete own goal | ✓ | ✓ |
| Create action items | ✓ | ✓ |
| View all content | ✓ | ✓ |

Enforced via `requireRole('ADMIN')` middleware on backend routes.
Frontend hides Admin-only UI elements based on `activeWorkspace.role` in Zustand.

---

## Optimistic UI Pattern
Apply to: reaction toggle, action item status change, goal status update.

```js
// 1. Update Zustand immediately
set(state => ({ items: state.items.map(i => i.id === id ? { ...i, status } : i) }))

// 2. Fire API call
try {
  await api.patch(`/action-items/${id}`, { status })
} catch {
  // 3. Revert on failure
  set(state => ({ items: state.items.map(i => i.id === id ? { ...i, status: previousStatus } : i) }))
  toast.error('Update failed, reverted')
}
```

---

## Socket.io Events (to be built)
| Event | Direction | Payload |
|---|---|---|
| join:workspace | client→server | workspaceId |
| goal:update | server→client | { goalId, changes } |
| actionitem:update | server→client | { itemId, changes } |
| announcement:new | server→client | announcement object |
| reaction:add | server→client | { announcementId, emoji, userId } |
| reaction:remove | server→client | { announcementId, emoji, userId } |
| presence:update | server→client | { onlineUserIds[] } |
| notification:new | server→client | notification object |

---

## Known Issues / Watch Out For
- **Prisma v7 + monorepo**: requires explicit `output` path in schema generator and NO `earlyAccess: true` in `prisma.config.ts` — otherwise it tries to use Prisma Accelerate and rejects regular `postgresql://` URLs
- **Next.js 16**: `middleware.js` is renamed to `proxy.js`
- **pnpm**: always use `pnpm dlx` not `npx`. Build scripts for `@prisma/engines` must be approved via `pnpm approve-builds` or added to `pnpm.onlyBuiltDependencies` in root `package.json`
- **Tailwind v4**: config is different from v3 — no `tailwind.config.js`, uses `@import "tailwindcss"` in CSS
- **CORS**: API must have `credentials: true` and exact `origin` (not `*`) for cookies to work cross-origin
- **Reload loop on /login**: caused by AuthProvider hydrate() firing repeatedly — fixed with `hydrated` flag in Zustand store

---

## Deployment (Railway)
- 3 services in one Railway project: `web`, `api`, `db` (PostgreSQL plugin)
- DB URL auto-injected as `DATABASE_URL` in Railway variables panel
- Each service has its own env vars set in Railway dashboard

### Backend env vars
```
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLIENT_URL=https://your-web.up.railway.app
NODE_ENV=production
```

### Frontend env vars
```
NEXT_PUBLIC_API_URL=https://your-api.up.railway.app/api
NEXT_PUBLIC_SOCKET_URL=https://your-api.up.railway.app
```

---

## What's Done
- [x] Turborepo monorepo with pnpm
- [x] Next.js 16 frontend (JS, App Router, Tailwind)
- [x] Express API
- [x] Prisma schema with all models
- [x] Railway PostgreSQL provisioned + migrated
- [x] JWT auth (register, login, logout, refresh, me)
- [x] httpOnly cookie token storage
- [x] Zustand auth store with hydration
- [x] Login + Register pages
- [x] Route protection via proxy.js
- [x] Dashboard placeholder page

## What's Next
- [ ] Fix login page reload loop
- [ ] Workspaces CRUD + invite system
- [ ] RBAC middleware on backend
- [ ] Goals + Milestones
- [ ] Action Items + Kanban board
- [ ] Announcements + Comments + Reactions
- [ ] Socket.io real-time
- [ ] Analytics dashboard
- [ ] Cloudinary avatar upload
- [ ] Optimistic UI on reactions + action item status
- [ ] Dark/light theme toggle
- [ ] Deploy both services to Railway
- [ ] Seed demo account
- [ ] README + video walkthrough
