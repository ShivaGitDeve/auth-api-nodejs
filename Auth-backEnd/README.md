# Auth API – Node.js

A secure authentication and authorization REST API built with Node.js, Express, Sequelize, JWT, and PostgreSQL.

## Features

- User registration with hashed passwords (public signup always creates a `user`, never an `admin`)
- Login with JWT access tokens + rotating refresh tokens (reuse detection)
- Role-Based Access Control (Admin/User), disabled accounts are blocked
- Forgot / reset password via email (15-minute single-use link)
- Change password (signs out every device)
- Admin APIs: list users, change role, delete user
- Rate limiting on login and password reset
- Database schema managed with Sequelize migrations

## Tech Stack

- Node.js, Express.js
- Sequelize + PostgreSQL (migrations via `sequelize-cli`)
- JWT, bcrypt
- Nodemailer (Gmail App Password)

## API Endpoints

### Auth

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh-token
- POST /api/auth/logout
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- POST /api/auth/change-password (Protected)
- GET /api/auth/me (Protected)
- GET /api/auth/profile (Protected)

### Admin (Admin only)

- GET /api/admin/users
- PATCH /api/admin/users/:id/role
- DELETE /api/admin/users/:id

### Workspaces (logged-in users)

Workspace roles (`owner` / `admin` / `member`) are separate from the global `users.role`.
Non-members always get `404` for a workspace, even global admins.

| Method | Path | Allowed workspace roles |
|---|---|---|
| POST | /api/workspaces | any logged-in user (becomes `owner`) |
| GET | /api/workspaces | returns only the caller's workspaces |
| GET | /api/workspaces/:workspaceId | owner, admin, member |
| PATCH | /api/workspaces/:workspaceId | owner, admin |
| DELETE | /api/workspaces/:workspaceId | owner (body: `{ "confirm": "<workspace name>" }`) |

### Workspace invitations

Owners can invite `admin` or `member`; admins can invite (and revoke/resend) only `member`
invitations. Invitations never grant `owner`. Links are single-use, expire after 7 days, and
only a SHA-256 hash of the token is stored. Links are built from `FRONTEND_URL`.

| Method | Path | Who |
|---|---|---|
| POST | /api/workspaces/:workspaceId/invitations | owner, admin (`{ email, role }`) |
| GET | /api/workspaces/:workspaceId/invitations | owner, admin |
| POST | /api/workspaces/:workspaceId/invitations/:invitationId/revoke | owner, admin (admin: member invites only) |
| POST | /api/workspaces/:workspaceId/invitations/:invitationId/resend | owner, admin — issues a new link, old link stops working |
| POST | /api/invitations/preview | public (`{ token }`) |
| POST | /api/invitations/accept | logged-in user whose email matches the invitation (`{ token }`) |

Invalid token → `404`; already accepted / revoked / expired → `410`; wrong account → `403`.

### Teams

Teams live inside a workspace. Any workspace member can view them; only workspace owners/admins
can create, update, delete teams or change team membership. Only existing members of the same
workspace can be added (enforced by composite foreign keys in the database). Team names are
stored trimmed with single spaces and are unique per workspace case-insensitively.

| Method | Path | Allowed workspace roles |
|---|---|---|
| GET | /api/workspaces/:workspaceId/teams | owner, admin, member |
| POST | /api/workspaces/:workspaceId/teams | owner, admin (`{ name, description? }`) |
| GET | /api/workspaces/:workspaceId/teams/:teamId | owner, admin, member |
| PATCH | /api/workspaces/:workspaceId/teams/:teamId | owner, admin |
| DELETE | /api/workspaces/:workspaceId/teams/:teamId | owner, admin |
| POST | /api/workspaces/:workspaceId/teams/:teamId/members | owner, admin (`{ userId }`) |
| DELETE | /api/workspaces/:workspaceId/teams/:teamId/members/:userId | owner, admin |

Duplicate name or membership → `409`; user not in the workspace → `400`; another workspace's team → `404`.

### Projects

Projects belong to a workspace and can optionally be linked to a team of the same workspace.
`key` is 2–10 uppercase letters/digits (auto-generated from the name if omitted) and unique per
workspace. Status: `planning`, `active`, `on_hold`, `completed`, `archived` (archived only via the
archive endpoint). Priority: `low`, `medium`, `high`, `urgent`. Dates are `YYYY-MM-DD`; the due
date can never be before the start date (also enforced by a DB check constraint).

Permissions:

| Action | Who |
|---|---|
| List / view projects and members | any workspace member |
| Create (creator becomes project owner + member) | workspace owner, admin |
| Update fields, archive / unarchive, add / remove members | workspace owner, admin, or the project owner |
| Change project owner (`ownerUserId`), delete (`{ confirm: "<KEY>" }`) | workspace owner, admin |

Archived projects are read-only until unarchived. The current project owner cannot be removed
from the members list (transfer ownership first).

| Method | Path |
|---|---|
| GET | /api/workspaces/:workspaceId/projects (`?status=`, `?includeArchived=true`) |
| POST | /api/workspaces/:workspaceId/projects |
| GET / PATCH / DELETE | /api/workspaces/:workspaceId/projects/:projectId |
| POST | /api/workspaces/:workspaceId/projects/:projectId/archive |
| POST | /api/workspaces/:workspaceId/projects/:projectId/unarchive (`{ status? }`) |
| GET / POST | /api/workspaces/:workspaceId/projects/:projectId/members (`{ userId }`) |
| DELETE | /api/workspaces/:workspaceId/projects/:projectId/members/:userId |

Duplicate key or membership → `409`; team/user not in the workspace → `400`; another
workspace's project → `404`; archived project modification → `409`.

Deprecated aliases (same handlers, kept for older clients): `GET /api/auth/users`,
`PATCH /api/auth/users/:id/role`, `DELETE /api/auth/users/:id`, `DELETE /api/admin/user/:id`.

## Security

- Password hashing using bcrypt
- JWT-based authentication; deleted or disabled users are rejected on every request
- Refresh tokens stored server-side, deleted on logout / password change / password reset
- Role-based authorization
- Sensitive data (password, reset token) excluded from responses
- CORS restricted to configured origins

## How to Run

1. Clone the repo
2. `npm install`
3. Copy `.env.example` to `.env` and fill in the values
4. Create an empty PostgreSQL database matching `DB_NAME`
5. `npm run dev` (runs pending migrations, then starts the server on `PORT`)

## Database migrations

The schema is created and changed **only** through migrations in `db/migrations`
(no `sequelize.sync()`).

| Command | What it does |
|---|---|
| `npm run db:migrate` | Apply pending migrations (also runs automatically before `dev` / `start`) |
| `npm run db:migrate:status` | Show which migrations are applied |
| `npm run db:migrate:undo` | Revert the last migration |
| `npm run db:migration:new -- <name>` | Create a new migration file |

The first migration is a baseline: on an existing database it leaves the `users` and
`RefreshTokens` tables untouched, on a fresh database it creates them.

## Tests

```bash
npm test
```

Uses the built-in `node:test` runner. Unit tests do not need a database.

```bash
npm run test:integration
```

Integration tests use the PostgreSQL connection from `.env`, but run inside a temporary
schema (`teamflow_test_<pid>`) that is created, migrated and dropped by the tests.
The `public` schema and its data are never touched.
