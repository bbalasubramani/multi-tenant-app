# Multi-Tenant Notes Application

## Project Overview

This is a full-stack web application that provides a simple note-taking service with multi-tenancy support. It features strict data isolation between tenants, a JWT-based authentication system with role-based authorization, and a subscription-based notes limit.

The application consists of two main parts: a backend API and a minimal frontend client. Both are designed for deployment on Vercel.

## Features

* **Multi-Tenancy:** Supports at least two tenants (Acme and Globex) with strict data isolation.
* **Authentication:** JWT-based login for all users.
* **Authorization:**
    * `Admin` Role: Can invite users and upgrade subscriptions.
    * `Member` Role: Can create, view, edit, and delete notes.
* **Subscription Gating:**
    * `Free` Plan: Limited to a maximum of 3 notes per tenant.
    * `Pro` Plan: Unlimited notes.
* **Notes API (CRUD):** Full Create, Read, Update, and Delete functionality for notes with tenant and role enforcement.
* **Deployment:** The backend and frontend are hosted on Vercel. CORS is enabled for API access.

## Technical Stack

* **Backend:** Node.js, Express, `jsonwebtoken` for authentication, `pg` for PostgreSQL.
* **Database:** PostgreSQL with a **schema-per-tenant** approach for data isolation.
* **Frontend:** React, `axios` for API requests.
* **Deployment:** Vercel.

## Multi-Tenancy Approach: Schema-per-Tenant

We chose the **schema-per-tenant** approach to ensure the highest level of data isolation. In this model, each tenant (e.g., Acme, Globex) has their own dedicated database schema.

* **How it Works:**
    * Each tenant's data is stored in its own schema within a single PostgreSQL database. For example, Acme's notes are in the `acme` schema, and Globex's notes are in the `globex` schema.
    * Upon user login, the backend identifies the user's tenant from the JWT.
    * Before executing any database query, the backend sets the PostgreSQL search path to the user's specific tenant schema (`SET search_path TO <tenant_name>;`).
    * This guarantees that all subsequent database operations are strictly confined to that tenant's data, making it impossible for data to leak between tenants.

## Getting Started

### Prerequisites

* Node.js (LTS version recommended)
* npm (or yarn)
* A PostgreSQL database (e.g., Supabase)

### Backend Setup

1.  Navigate to the `backend` directory.
2.  Install dependencies: `npm install`
3.  Create a `.env` file with your database connection string and a JWT secret:
    ```env
    DATABASE_URL="<your_supabase_connection_string>"
    JWT_SECRET="<a_strong_random_string>"
    ```
4.  Run the server locally: `npm run dev`

### Frontend Setup

1.  Navigate to the `frontend` directory.
2.  Install dependencies: `npm install`
3.  Create a `.env` file (or hardcode the URL in `App.js` for now):
    ```env
    REACT_APP_API_BASE_URL="http://localhost:3000"
    ```
4.  Run the client locally: `npm start`

## API Endpoints

### Authentication
* `POST /login` - User login.

### Notes (CRUD)
* `POST /notes` - Create a note.
* `GET /notes` - List all notes for the current tenant.
* `GET /notes/:id` - Retrieve a specific note.
* `PUT /notes/:id` - Update a note.
* `DELETE /notes/:id` - Delete a note.

### Tenant & Subscription
* `POST /tenants/:slug/upgrade` - Upgrade a tenant's subscription (Admin only).

### Health Check
* `GET /health` - Returns `{"status": "ok"}`.

## Mandatory Test Accounts

All accounts use the password: `password`.

| Email              | Role   | Tenant |
| ------------------ | ------ | ------ |
| admin@acme.test    | Admin  | Acme   |
| user@acme.test     | Member | Acme   |
| admin@globex.test  | Admin  | Globex |
| user@globex.test   | Member | Globex |
