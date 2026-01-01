# Auth API – Node.js

A secure authentication and authorization REST API built with Node.js, Express, Sequelize, JWT, and MySQL.

## Features

- User registration with hashed passwords
- Login with JWT authentication
- Role-Based Access Control (Admin/User)
- Admin-only APIs (Get users, Delete user)
- Protected routes using middleware
- Centralized error handling

## Tech Stack

- Node.js
- Express.js
- Sequelize (MySQL)
- JWT
- bcrypt

## API Endpoints

### Auth

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile (Protected)

### Admin (Admin only)

- GET /api/admin/users
- DELETE /api/admin/user/:id

## Security

- Password hashing using bcrypt
- JWT-based authentication
- Role-based authorization
- Sensitive data excluded from responses

## How to Run

1. Clone the repo
2. npm install
3. Set up .env
4. npm run dev
