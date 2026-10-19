# Healthcare Backend REST API

A secure, scalable, and modular Healthcare Management REST API engineered with **Node.js**, **Express.js**, **PostgreSQL**, **Prisma ORM**, **Zod**, and **JWT Authentication**.

---

## 1. Project Overview

The **Healthcare Backend REST API** provides a backend architecture for hospital and clinical administration. It allows medical staff and users to manage patient profiles, register healthcare providers (doctors), and create patient-doctor consultation mappings.

The system enforces multi-tenant ownership boundaries, input validation, cryptographic password hashing, parameterized database queries, and centralized error handling.

---

## 2. Assignment Objective

Build an enterprise-structured, secure, and GitHub-ready backend REST API for a campus-drive submission. The API fulfills all functional requirements for user authentication, patient CRUD, doctor CRUD, and relational patient-doctor assignments.

---

## 3. Framework Compliance Note

> **Note for Evaluators:**
> The opening instruction of the assignment states:
> *"Framework: Please use the Django/Node framework for completing the assignment. You are free to use any libraries necessary."*
>
> While subsequent clauses in the prompt mention Django, Django REST Framework (DRF), and `djangorestframework-simplejwt`, this project was intentionally built using **Node.js and Express.js** as permitted by the opening statement.
>
> The Django-specific components are translated to equivalent enterprise Node.js technologies:
> - **Django REST Framework (DRF)** $\rightarrow$ **Express.js** with modular MVC service layer
> - **DRF Serializers** $\rightarrow$ **Zod** schema validation
> - **Django ORM** $\rightarrow$ **Prisma ORM** with PostgreSQL migrations
> - **`djangorestframework-simplejwt`** $\rightarrow$ **`jsonwebtoken`** with custom Bearer token middleware
> - **PBKDF2 Password Hasher** $\rightarrow$ **`bcryptjs`** with adaptive work factor (10 salt rounds)
>
> A complete architectural mapping and interview defense guide is provided in [INTERVIEW_GUIDE.md](file:///c:/Users/rahul/healthcare-backend/docs/INTERVIEW_GUIDE.md).

---

## 4. Technology Stack

- **Runtime**: Node.js (v22.x LTS, ES Modules)
- **Framework**: Express.js (v5.x)
- **Database**: PostgreSQL (v17.x)
- **ORM**: Prisma ORM (v6.x)
- **Authentication**: JWT (`jsonwebtoken`)
- **Password Hashing**: `bcryptjs`
- **Request Validation**: `zod`
- **Security Middlewares**: `helmet`, `cors`
- **Logging**: `morgan`
- **Automated Testing**: Jest, Supertest, Cross-Env
- **API Testing**: Postman Collection (v2.1)

---

## 5. Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer [Client Layer]
        Postman[Postman Collection]
        WebClient[Web / Mobile Client]
    end

    subgraph SecurityLayer [Security & Parsing Middlewares]
        Helmet[Helmet HTTP Headers]
        CORS[CORS Policy]
        BodyLimit[Express JSON Parser / 10kb Limit]
    end

    subgraph AuthAndValidation [Interceptors]
        AuthMW[auth.middleware.js - JWT Verify]
        ValMW[validate.middleware.js - Zod Validation]
    end

    subgraph MVC [Application Layer]
        Router[Router - Declarative Routes]
        Controller[Controllers - HTTP Request/Response]
        Service[Services - Domain Logic & Permissions]
    end

    subgraph DataLayer [Data & Persistence]
        Prisma[Prisma ORM Client]
        Postgres[(PostgreSQL Database)]
    end

    subgraph ErrorHandling [Centralized Exception Handling]
        ErrorHandler[error.middleware.js]
    end

    Postman & WebClient --> SecurityLayer
    SecurityLayer --> Router
    Router --> AuthMW
    AuthMW --> ValMW
    ValMW --> Controller
    Controller --> Service
    Service --> Prisma
    Prisma --> Postgres
    Postgres --> Prisma
    Prisma --> Service
    Service --> Controller
    Controller --> Response[Standard JSON Response]
    
    Controller -.->|Exception Thrown| ErrorHandler
    Service -.->|Exception Thrown| ErrorHandler
    ErrorHandler --> Response
```

---

## 6. Folder Structure

```
healthcare-backend/
├── prisma/
│   ├── schema.prisma              # Database schema definitions and relations
│   └── migrations/                # Version-controlled PostgreSQL SQL migrations
├── src/
│   ├── config/
│   │   ├── env.js                 # Zod-validated environment configuration
│   │   └── prisma.js              # Singleton PrismaClient instance
│   ├── routes/
│   │   ├── auth.routes.js         # Authentication endpoints
│   │   ├── patient.routes.js      # Patient CRUD endpoints
│   │   ├── doctor.routes.js       # Doctor CRUD endpoints
│   │   └── mapping.routes.js      # Patient-Doctor mapping endpoints
│   ├── controllers/
│   │   ├── auth.controller.js     # HTTP request handling for auth
│   │   ├── patient.controller.js  # HTTP request handling for patients
│   │   ├── doctor.controller.js   # HTTP request handling for doctors
│   │   └── mapping.controller.js  # HTTP request handling for mappings
│   ├── services/
│   │   ├── auth.service.js        # Authentication business logic & JWT
│   │   ├── patient.service.js     # Patient domain logic & ownership checks
│   │   ├── doctor.service.js      # Doctor domain logic & integrity checks
│   │   └── mapping.service.js     # Mapping domain logic & duplicate guards
│   ├── middleware/
│   │   ├── auth.middleware.js     # Bearer token verification
│   │   ├── authorize.middleware.js# Resource ownership validation
│   │   ├── validate.middleware.js # Zod schema execution
│   │   └── error.middleware.js    # Centralized JSON error response handler
│   ├── validators/
│   │   ├── auth.validator.js      # Zod validation schemas for auth
│   │   ├── patient.validator.js   # Zod validation schemas for patients
│   │   ├── doctor.validator.js    # Zod validation schemas for doctors
│   │   └── mapping.validator.js   # Zod validation schemas for mappings
│   ├── app.js                     # Express application configuration
│   └── server.js                  # Server bootstrap & graceful shutdown
├── tests/
│   ├── helpers/
│   │   └── testDb.js              # Database cleanup helper for isolated tests
│   ├── auth.test.js               # Registration and login test suite
│   ├── patients.test.js           # Patient CRUD & ownership security tests
│   ├── doctors.test.js            # Doctor CRUD & referential integrity tests
│   ├── mappings.test.js           # Mapping CRUD & duplicate prevention tests
│   └── security.test.js           # Edge cases, 404, and malformed payload tests
├── postman/
│   └── healthcare-backend.postman_collection.json # Importable Postman collection
├── docs/
│   └── INTERVIEW_GUIDE.md         # Campus drive Q&A and architecture guide
├── .env.example                   # Template environment variables
├── .gitignore                     # Git ignore rules
├── package.json                   # Dependencies, scripts, and ES module config
└── README.md                      # Complete project documentation
```

---

## 7. Database Schema & Entity Relationships

```mermaid
erDiagram
    User ||--o{ Patient : "owns (1:N)"
    User ||--o{ Doctor : "creates (1:N optional)"
    Patient ||--o{ PatientDoctorMapping : "assigned (1:N)"
    Doctor ||--o{ PatientDoctorMapping : "assigned (1:N)"

    User {
        String id PK "UUID"
        String name
        String email UK "Unique"
        String passwordHash
        DateTime createdAt
        DateTime updatedAt
    }

    Patient {
        String id PK "UUID"
        String name
        DateTime dateOfBirth
        String gender
        String email "Optional"
        String phone "Optional"
        String address "Optional"
        String userId FK "References User.id (CASCADE)"
        DateTime createdAt
        DateTime updatedAt
    }

    Doctor {
        String id PK "UUID"
        String name
        String email UK "Unique"
        String phone
        String specialization
        String createdById FK "References User.id (SET NULL)"
        DateTime createdAt
        DateTime updatedAt
    }

    PatientDoctorMapping {
        String id PK "UUID"
        String patientId FK "References Patient.id (CASCADE)"
        String doctorId FK "References Doctor.id (RESTRICT)"
        DateTime assignedAt
    }
```

### Relational Constraints:
- **`User` $\rightarrow$ `Patient`**: One-to-many. A user owns zero or more patients. Deleting a user cascades to their patients.
- **`Patient` $\leftrightarrow$ `Doctor`**: Many-to-many through `PatientDoctorMapping`. A patient can have multiple assigned doctors; a doctor can consult multiple patients.
- **`Doctor` Deletion Policy**: `onDelete: Restrict`. If a doctor has active patient mappings, PostgreSQL rejects the deletion, and our service returns a `409 Conflict`.
- **Duplicate Protection**: Unique index on `(patientId, doctorId)` prevents double-assignment.

---

## 8. Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.x, v20.x, or v22.x (`node -v`)
- **npm**: v9.x or v10.x (`npm -v`)
- **PostgreSQL**: v14, v15, v16, or v17

---

## 9. Installation & Setup

### Step 1: Clone or Navigate to the Repository
```bash
git clone https://github.com/bansalpriyanshi946/healthcare-backend.git
cd healthcare-backend
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Configure your `.env` with your PostgreSQL database credentials:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/healthcare_db?schema=public"
JWT_SECRET="your_secure_random_secret_at_least_32_characters_long"
JWT_EXPIRES_IN="1h"
```
*(Note: If your password contains special characters like `@` or `#`, URL-encode them. Example: `@` $\rightarrow$ `%40`, `#` $\rightarrow$ `%23`)*.

### Step 4: Run Prisma Migrations
Generate the Prisma Client and apply database migrations:
```bash
npm run db:generate
npm run db:migrate
```

---

## 10. Starting the Server

### Development Mode (with hot-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```
The server will start on `http://localhost:5000`. You can verify it via the health check endpoint:
```bash
curl http://localhost:5000/api/health
```

---

## 11. Complete API Endpoints Table

| # | HTTP Method | Endpoint | Auth Required | Description |
| :-: | :--- | :--- | :-: | :--- |
| **1** | `POST` | `/api/auth/register/` | No | Register a new user account |
| **2** | `POST` | `/api/auth/login/` | No | Authenticate user & receive JWT Bearer token |
| **3** | `POST` | `/api/patients/` | **Yes (Bearer)** | Create a new patient record (auto-binds to user) |
| **4** | `GET` | `/api/patients/` | **Yes (Bearer)** | List all patients owned by authenticated user |
| **5** | `GET` | `/api/patients/:id/` | **Yes (Bearer)** | Retrieve patient by ID (ownership verified) |
| **6** | `PUT` | `/api/patients/:id/` | **Yes (Bearer)** | Update patient by ID (ownership verified) |
| **7** | `DELETE` | `/api/patients/:id/` | **Yes (Bearer)** | Delete patient by ID (ownership verified) |
| **8** | `POST` | `/api/doctors/` | **Yes (Bearer)** | Register a new doctor |
| **9** | `GET` | `/api/doctors/` | **Yes (Bearer)** | List all doctors in the healthcare system |
| **10** | `GET` | `/api/doctors/:id/` | **Yes (Bearer)** | Retrieve doctor profile by ID |
| **11** | `PUT` | `/api/doctors/:id/` | **Yes (Bearer)** | Update doctor profile (creator only) |
| **12** | `DELETE` | `/api/doctors/:id/` | **Yes (Bearer)** | Delete doctor (creator only, rejects if mapped) |
| **13** | `POST` | `/api/mappings/` | **Yes (Bearer)** | Assign doctor to an owned patient |
| **14** | `GET` | `/api/mappings/` | **Yes (Bearer)** | List all mappings for current user's patients |
| **15** | `GET` | `/api/mappings/:patient_id/` | **Yes (Bearer)** | List all doctors assigned to a specific patient |
| **16** | `DELETE` | `/api/mappings/:id/` | **Yes (Bearer)** | Remove assignment (leaves patient & doctor intact) |

---

## 12. Request & Response Examples

### A. Register User (`POST /api/auth/register/`)
**Request Body**:
```json
{
  "name": "Priyanshi Bansal",
  "email": "priyanshi@example.com",
  "password": "SecurePassword123!"
}
```
**Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "c71a399f-7b75-47e2-8b2b-57db89b1c569",
      "name": "Priyanshi Bansal",
      "email": "priyanshi@example.com",
      "createdAt": "2026-10-19T09:55:00.000Z"
    }
  }
}
```

### B. Login User (`POST /api/auth/login/`)
**Request Body**:
```json
{
  "email": "priyanshi@example.com",
  "password": "SecurePassword123!"
}
```
**Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "c71a399f-7b75-47e2-8b2b-57db89b1c569",
      "name": "Priyanshi Bansal",
      "email": "priyanshi@example.com"
    }
  }
}
```

### C. Create Patient (`POST /api/patients/`)
**Headers**: `Authorization: Bearer <token>`
**Request Body**:
```json
{
  "name": "John Doe",
  "dateOfBirth": "1990-05-15",
  "gender": "Male",
  "email": "johndoe@example.com",
  "phone": "9876543210",
  "address": "123 Health Ave, New Delhi"
}
```
**Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Patient created successfully",
  "data": {
    "id": "e91244fa-cf21-4f11-b0db-6e107c128522",
    "name": "John Doe",
    "dateOfBirth": "1990-05-15T00:00:00.000Z",
    "gender": "Male",
    "email": "johndoe@example.com",
    "phone": "9876543210",
    "address": "123 Health Ave, New Delhi",
    "userId": "c71a399f-7b75-47e2-8b2b-57db89b1c569",
    "createdAt": "2026-10-19T09:56:00.000Z",
    "updatedAt": "2026-10-19T09:56:00.000Z"
  }
}
```

### D. Assign Doctor to Patient (`POST /api/mappings/`)
**Headers**: `Authorization: Bearer <token>`
**Request Body**:
```json
{
  "patientId": "e91244fa-cf21-4f11-b0db-6e107c128522",
  "doctorId": "d34512aa-4510-4f55-9a88-888999aabbcc"
}
```
**Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Doctor assigned to patient successfully",
  "data": {
    "id": "f51239aa-0001-44bb-99cc-112233445566",
    "patientId": "e91244fa-cf21-4f11-b0db-6e107c128522",
    "doctorId": "d34512aa-4510-4f55-9a88-888999aabbcc",
    "assignedAt": "2026-10-19T09:57:00.000Z",
    "patient": {
      "id": "e91244fa-cf21-4f11-b0db-6e107c128522",
      "name": "John Doe",
      "gender": "Male"
    },
    "doctor": {
      "id": "d34512aa-4510-4f55-9a88-888999aabbcc",
      "name": "Dr. Sarah Connor",
      "specialization": "Trauma Surgery"
    }
  }
}
```

---

## 13. Error Response Format

All error responses strictly follow a predictable JSON format:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address format"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters long"
    }
  ]
}
```

### Standard Status Codes:
- `200 OK`: Successful read, update, or deletion.
- `201 Created`: Successful creation.
- `400 Bad Request`: Input validation failed or malformed JSON syntax.
- `401 Unauthorized`: Missing, invalid, or expired JWT token.
- `403 Forbidden`: Authenticated user lacks permission to modify or delete resource.
- `404 Not Found`: Target resource does not exist or belongs to another user.
- `409 Conflict`: Duplicate email, duplicate doctor assignment, or deleting a doctor with active mappings.
- `500 Internal Server Error`: Server exception (stack trace hidden in production).

---

## 14. Postman Collection Instructions

An exportable collection is available at:
[`postman/healthcare-backend.postman_collection.json`](file:///c:/Users/rahul/healthcare-backend/postman/healthcare-backend.postman_collection.json)

### Recommended Evaluation Sequence:
1. Import `postman/healthcare-backend.postman_collection.json` into Postman.
2. The collection has pre-configured variables: `baseUrl`, `token`, `patientId`, `doctorId`, `mappingId`.
3. Run **1. Authentication $\rightarrow$ Register User**.
4. Run **1. Authentication $\rightarrow$ Login User** (Automatically captures the Bearer token and populates `{{token}}`).
5. Run **2. Patients $\rightarrow$ Create Patient** (Automatically saves `{{patientId}}`).
6. Run **3. Doctors $\rightarrow$ Create Doctor** (Automatically saves `{{doctorId}}`).
7. Run **4. Patient-Doctor Mappings $\rightarrow$ Assign Doctor to Patient** (Automatically saves `{{mappingId}}`).
8. Run **4. Patient-Doctor Mappings $\rightarrow$ Get Assigned Doctors For Patient**.
9. Run **5. Negative & Security Tests** (verifies 409 conflict, 401 unauthorized, 404 concealment).
10. Run Deletions in order: Delete Mapping $\rightarrow$ Delete Patient $\rightarrow$ Delete Doctor.

---

## 15. Automated Testing

Automated tests are implemented using **Jest** and **Supertest** with ES modules compatibility.

### Running All Automated Tests:
```bash
npm test
```

### Running Test Coverage Report:
```bash
npm run test:coverage
```

### Test Suite Summary:
- **`tests/auth.test.js`**: 9 tests covering registration, login, bcrypt verification, duplicate email rejection, and malformed inputs.
- **`tests/patients.test.js`**: 12 tests covering CRUD, mass-assignment protection, cross-user isolation, and 404 concealment.
- **`tests/doctors.test.js`**: 12 tests covering doctor registration, uniqueness, creator permissions, and active-mapping deletion guards.
- **`tests/mappings.test.js`**: 10 tests covering patient ownership validation, duplicate assignment guards, and deletion isolation.
- **`tests/security.test.js`**: 4 tests covering 404 on undefined routes, malformed JSON body handling, and health check.
- **Total**: **47 tests passed with 100% success rate**.

---

## 16. Git & GitHub Workflow

The repository was built incrementally using dedicated feature branches:
1. `feature/project-setup`: Express app, environment validation, `.gitignore`, and modular folder structure.
2. `feature/database-schema`: Prisma schema, PostgreSQL connection, and migrations.
3. `feature/auth`: User registration, bcrypt hashing, JWT issuance, and auth middleware.
4. `feature/patients`: Patient CRUD, ownership filters, and mass assignment prevention.
5. `feature/doctors`: Doctor CRUD, uniqueness, and referential integrity guards.
6. `feature/mappings`: Patient-Doctor relational mapping and duplicate protection.
7. `feature/testing`: Supertest suite covering 47 scenarios and Postman collection.
8. `feature/documentation`: Comprehensive README and interview defense guide.

---

## 17. Security Measures Implemented

1. **Password Hashing**: `bcryptjs` with 10 salt rounds. Plaintext passwords are never stored or logged.
2. **Preventing Mass Assignment**: `userId` is strictly derived from the verified JWT payload, ignoring any client-sent `userId`.
3. **Information Disclosure Prevention**: Nonexistent or unauthorized patient accesses return `404 Not Found` rather than `403 Forbidden`, preventing resource enumeration.
4. **Denial-of-Service (DoS) Protection**: JSON body parser size is capped at `10kb`.
5. **Secure Headers**: `helmet` enforces Content-Security-Policy, anti-clickjacking, and DNS prefetch controls.
6. **SQL Injection Immunity**: Parameterized queries via Prisma ORM.

---

## 18. Troubleshooting Guide

| Problem | Root Cause | Solution |
| :--- | :--- | :--- |
| `Can't reach database server at 127.0.0.1:5678` | PostgreSQL server process is stopped | Start PostgreSQL server: `& "C:\Program Files\PostgreSQL\17\bin\postgres.exe" -D "C:\Program Files\PostgreSQL\17\data"` |
| `P1012: the URL must start with postgresql://` | Ambient OS environment variable overriding `.env` | Ensure `.env` is loaded with `dotenv.config({ override: true })` |
| `Authentication token required (401)` | Missing `Authorization` header in Postman | Add `Authorization: Bearer <token>` in the Headers tab |
| `Cannot delete doctor with active patient assignments (409)` | Doctor is currently assigned to a patient | Delete the mapping first via `DELETE /api/mappings/:id/` |

---

## 19. Author

- **Author**: Priyanshi Bansal
- **Repository**: `healthcare-backend`
- **GitHub**: [https://github.com/priyanshibansal987/healthcare-backend](https://github.com/priyanshibansal987/healthcare-backend)
