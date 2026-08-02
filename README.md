# MediFlow

Modern full-stack hospital management system for appointments, electronic medical records, billing, and doctor portal.

![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20Tailwind-61DAFB?style=flat-square)
![Backend](https://img.shields.io/badge/Backend-Go%20%2B%20Gin%20%2B%20GORM-00ADD8?style=flat-square)
![Database](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square)
![Auth](https://img.shields.io/badge/Auth-JWT-black?style=flat-square)

## Overview

MediFlow is a hospital management platform built for clinics and small hospitals. It covers the main operational workflows: patient registration, appointment scheduling, electronic medical records, billing, and a dedicated doctor portal. Access is controlled through role-based authentication for Admin, Doctor, and Receptionist users.

The system is designed to be lightweight, easy to deploy, and straightforward to extend.

## Features

- Role-based authentication (Admin, Doctor, Receptionist)
- Patient registration and management
- Appointment booking, listing, filtering, and status updates
- Doctor portal with EMR notes
- Billing creation and payment status tracking
- Dashboard with key stats and today's appointments
- Responsive UI built with Tailwind CSS

## Tech Stack

| Layer      | Technology                    |
|------------|-------------------------------|
| Frontend   | React, Vite, Tailwind CSS     |
| Backend    | Go, Gin, GORM                 |
| Database   | PostgreSQL                    |
| Auth       | JWT + role-based middleware   |

## Architecture

```
                    +------------------+
                    |     Browser      |
                    |  (React + Vite)  |
                    +--------+---------+
                             |
                             | HTTPS / REST
                             v
                    +------------------+
                    |   Gin Router     |
                    |  (Go Backend)    |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
              v              v              v
        +-----------+  +-----------+  +-----------+
        |   Auth    |  |  Business |  |  File /   |
        | Middleware|  |  Logic    |  |  Future   |
        |  (JWT)    |  | Controllers| |  Services |
        +-----+-----+  +-----+-----+  +-----------+
              |              |
              v              v
        +---------------------------+
        |         GORM              |
        |    (ORM Layer)            |
        +-------------+-------------+
                      |
                      v
              +---------------+
              |  PostgreSQL   |
              |   Database    |
              +---------------+
```

### Request Flow

1. Client sends request with JWT in Authorization header
2. Gin middleware validates the token and extracts role
3. Role-based middleware checks permission for the route
4. Controller handles business logic
5. GORM interacts with PostgreSQL
6. JSON response is returned to the client

### Role Access Summary

| Module            | Admin | Doctor | Receptionist |
|-------------------|-------|--------|--------------|
| Patients          | Full  | Read   | Full         |
| Appointments      | Full  | Update | Create/Read  |
| EMR Notes         | Read  | Full   | -            |
| Billing           | Full  | Read   | Full         |
| Dashboard         | Full  | Full   | Full         |

## Project Structure

```
mediflow/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env.example
│   ├── go.mod
│   └── main.go
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Go 1.22 or higher
- Node.js 18 or higher
- PostgreSQL 14 or higher

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
go mod tidy
go run main.go
```

Server starts on `http://localhost:8080`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App starts on `http://localhost:5173`.

## Environment Variables

Backend `.env` example:

```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=mediflow
JWT_SECRET=change-this-to-a-long-random-string
PORT=8080
```

## Database Models (Simplified)

```
User
-----
id, name, email, password_hash, role, created_at

Patient
-------
id, name, age, gender, phone, address, created_at

Appointment
-----------
id, patient_id, doctor_id, date, time, status, notes, created_at

EMRNote
-------
id, patient_id, doctor_id, appointment_id, diagnosis, prescription, notes, created_at

Bill
----
id, patient_id, appointment_id, amount, status, description, created_at
```

## API Reference

Base URL: `http://localhost:8080/api`

### Auth

**Register**

```
POST /auth/register
Content-Type: application/json

{
  "name": "Dr. Priya Sharma",
  "email": "priya@hospital.com",
  "password": "securepass123",
  "role": "doctor"
}
```

Response (201):

```json
{
  "message": "user registered successfully",
  "user": {
    "id": 1,
    "name": "Dr. Priya Sharma",
    "email": "priya@hospital.com",
    "role": "doctor"
  }
}
```

**Login**

```
POST /auth/login
Content-Type: application/json

{
  "email": "priya@hospital.com",
  "password": "securepass123"
}
```

Response (200):

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Dr. Priya Sharma",
    "email": "priya@hospital.com",
    "role": "doctor"
  }
}
```

### Patients

**Create Patient**

```
POST /patients
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Rahul Verma",
  "age": 34,
  "gender": "male",
  "phone": "9876543210",
  "address": "12 MG Road, Bengaluru"
}
```

Response (201):

```json
{
  "id": 5,
  "name": "Rahul Verma",
  "age": 34,
  "gender": "male",
  "phone": "9876543210",
  "address": "12 MG Road, Bengaluru",
  "created_at": "2026-08-02T10:15:00Z"
}
```

**List Patients**

```
GET /patients
Authorization: Bearer <token>
```

Response (200):

```json
{
  "patients": [
    {
      "id": 5,
      "name": "Rahul Verma",
      "age": 34,
      "gender": "male",
      "phone": "9876543210"
    }
  ],
  "total": 1
}
```

### Appointments

**Book Appointment**

```
POST /appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "patient_id": 5,
  "doctor_id": 1,
  "date": "2026-08-05",
  "time": "10:30",
  "notes": "Follow-up for fever"
}
```

Response (201):

```json
{
  "id": 12,
  "patient_id": 5,
  "doctor_id": 1,
  "date": "2026-08-05",
  "time": "10:30",
  "status": "scheduled",
  "notes": "Follow-up for fever"
}
```

**Update Appointment Status**

```
PUT /appointments/12
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "completed"
}
```

### EMR Notes

**Add EMR Note**

```
POST /emr
Authorization: Bearer <token>
Content-Type: application/json

{
  "patient_id": 5,
  "appointment_id": 12,
  "diagnosis": "Viral fever",
  "prescription": "Paracetamol 500mg twice daily for 3 days",
  "notes": "Advised rest and hydration"
}
```

Response (201):

```json
{
  "id": 3,
  "patient_id": 5,
  "doctor_id": 1,
  "appointment_id": 12,
  "diagnosis": "Viral fever",
  "prescription": "Paracetamol 500mg twice daily for 3 days",
  "notes": "Advised rest and hydration",
  "created_at": "2026-08-05T11:00:00Z"
}
```

### Billing

**Create Bill**

```
POST /bills
Authorization: Bearer <token>
Content-Type: application/json

{
  "patient_id": 5,
  "appointment_id": 12,
  "amount": 750,
  "description": "Consultation + medicines"
}
```

Response (201):

```json
{
  "id": 8,
  "patient_id": 5,
  "appointment_id": 12,
  "amount": 750,
  "status": "pending",
  "description": "Consultation + medicines"
}
```

### Dashboard

```
GET /dashboard
Authorization: Bearer <token>
```

Response (200):

```json
{
  "total_patients": 48,
  "todays_appointments": 7,
  "pending_bills": 4,
  "completed_today": 3
}
```

## Sample End-to-End Flow

1. Receptionist logs in and creates a new patient
2. Receptionist books an appointment with an available doctor
3. Doctor logs in, views today's appointments, and adds an EMR note after consultation
4. Receptionist generates a bill linked to the appointment
5. Admin or receptionist marks the bill as paid
6. Dashboard reflects updated counts

## Team

- Backend, database design, authentication, and APIs
- Frontend, UI components, and API integration

## License

MIT
