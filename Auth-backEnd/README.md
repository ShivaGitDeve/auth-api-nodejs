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

Uses the built-in `node:test` runner. Tests do not need a database.
