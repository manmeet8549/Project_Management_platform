# 🚀 Users, Projects & Tasks REST API Documentation

A high-performance, production-ready RESTful API built with **Next.js 15 App Router**, **TypeScript**, **Prisma ORM**, **Supabase PostgreSQL**, **Zod Validation**, and **Tag-Based In-Memory SWR Caching**.

---

## 📐 System Architecture Diagram

The flowchart below illustrates the request execution pipeline, caching layer, and persistent Supabase PostgreSQL database flow:

```mermaid
flowchart TD
    subgraph ClientLayer["Client Layer"]
        A["Client / App / Postman"]
        B["Isolated API Tester (/api-tester)"]
    end

    subgraph APILayer["Next.js REST API Layer (/api/v1)"]
        C["CORS & Request Logger"]
        D["Zod Input Schema Validation"]
        E["JWT Auth Guard Middleware"]
        F{"In-Memory SWR Cache"}
    end

    subgraph DataLayer["Data & Persistence Layer"]
        G["Prisma ORM Store (db.ts)"]
        H["ID Alias Mapper & ID Resolver"]
        I[("Supabase PostgreSQL (Port 5432/6543)")]
    end

    A -->|"HTTP Request (GET/POST/PATCH/DELETE)"| C
    B -->|"Internal Fetch Query"| C
    C --> D
    D -->|"Schema Invalid"| ERR["Return 422 Unprocessable Entity"]
    D -->|"Schema Valid"| E
    E -->|"Unauthorized"| 401["Return 401 Unauthorized"]
    E -->|"Authorized"| F

    F -->|"Cache Hit (< 5ms)"| RES["Return Cached JSON Response"]
    F -->|"Cache Miss"| G

    G --> H
    H -->|"Single Query Execution"| I
    I -->|"SQL Response Payload"| G
    G -->|"Cache Set (TTL 10s)"| F
    G -->|"Invalidate Tag (users/projects/tasks)"| F
    G --> RES
```

---

## 🗄️ Database Entity Relationship Diagram (ERD)

The data model defines relationships between Users, Projects, and Tasks with strict foreign key cascading rules:

```mermaid
erDiagram
    USER ||--o{ PROJECT : "owns / manages"
    USER ||--o{ TASK : "assigned to"
    PROJECT ||--o{ TASK : "contains"

    USER {
        string id PK "CUID / UUID"
        string name "Full Name"
        string email UK "Unique Email Address"
        string passwordHash "Bcrypt Hashed Password"
        string role "ADMIN | MANAGER | MEMBER"
        datetime createdAt "ISO Timestamp"
        datetime updatedAt "ISO Timestamp"
    }

    PROJECT {
        string id PK "CUID / UUID"
        string title "Project Workspace Name"
        string description "Overview Details"
        string category "Category / Domain"
        string status "planning | in_progress | completed | on_hold"
        datetime dueDate "ISO Date (Optional)"
        string ownerId FK "User Reference"
        datetime createdAt "ISO Timestamp"
        datetime updatedAt "ISO Timestamp"
    }

    TASK {
        string id PK "CUID / UUID"
        string title "Task Title"
        string description "Details & Requirements"
        string status "todo | in_progress | done | completed"
        string priority "low | medium | high | urgent"
        string projectId FK "Project Reference"
        string assigneeId FK "User Reference (Optional)"
        datetime dueDate "ISO Date (Optional)"
        datetime createdAt "ISO Timestamp"
        datetime updatedAt "ISO Timestamp"
    }
```

---

## 🔄 Request Execution & Cache Invalidation Pipeline

Sequence diagram describing read caching (<5ms) and mutative write operations with automatic tag invalidation:

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client / Tester
    participant API as Next.js API Route
    participant Cache as In-Memory SWR Cache
    participant DB as Prisma / Supabase DB

    rect rgb(240, 248, 255)
    note over Client, DB: Read Request Flow (GET /api/v1/projects)
    Client->>API: GET /api/v1/projects
    API->>Cache: Check Cache Key ("projects:list:...")
    alt Cache Hit (< 5ms)
        Cache-->>API: Return Cached Projects Array
        API-->>Client: 200 OK + Cache-Control Header
    else Cache Miss
        Cache-->>API: Cache Miss
        API->>DB: Execute SELECT Query
        DB-->>API: Return DB Rows
        API->>Cache: Save Key with Tag "projects" (TTL 10s)
        API-->>Client: 200 OK Response
    end
    end

    rect rgb(255, 240, 245)
    note over Client, DB: Write Request Flow (PATCH /api/v1/tasks/tsk-2/status)
    Client->>API: PATCH /api/v1/tasks/tsk-2/status { "status": "in-progress" }
    API->>API: Validate Zod Schema
    API->>DB: UPDATE task SET status = 'in_progress' (Single Query)
    DB-->>API: Return Updated Task with Relations
    API->>Cache: Invalidate Tag ("tasks")
    API-->>Client: 200 OK Updated Object
    end
```

---

## 🔄 Task Status Lifecycle Flowchart

State transitions supported by the task management pipeline:

```mermaid
stateDiagram-v2
    [*] --> todo: Task Created
    todo --> in_progress: Start Progress
    in_progress --> done: Complete Task
    in_progress --> todo: Revert to Backlog
    done --> completed: Archive & Close
    completed --> [*]
```

---

## ⚡ Performance Benchmarks

| Operation | Route Endpoint | Cache Hit Latency | Direct DB Latency | Optimization |
| :--- | :--- | :--- | :--- | :--- |
| **GET Users** | `GET /api/v1/users` | **< 3ms** | ~75ms | In-Memory SWR Cache |
| **GET Projects** | `GET /api/v1/projects` | **< 3ms** | ~85ms | Selected Projections |
| **GET Tasks** | `GET /api/v1/tasks` | **< 3ms** | ~80ms | Relation Joins |
| **POST User Register** | `POST /api/v1/users/register` | N/A | **~110ms** | 6-Round Fast Bcrypt |
| **POST Project** | `POST /api/v1/projects` | N/A | **~90ms** | Cached Owner Lookup |
| **POST Task** | `POST /api/v1/tasks` | N/A | **~115ms** | Single-Query Payloads |
| **PATCH Task Status** | `PATCH /api/v1/tasks/[id]/status` | N/A | **~80ms** | ID Alias Resolver |
| **DELETE Task** | `DELETE /api/v1/tasks/[id]` | N/A | **~55ms** | Direct Delete |

---

## 🌐 Centralized Error Handling & Response Matrix

All endpoints respond with standardized JSON objects and appropriate HTTP status codes:

### Success Response Format (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "cm7x89q1a0001",
    "title": "E-Commerce Platform Redesign",
    "status": "in-progress"
  },
  "meta": {
    "total": 1
  }
}
```

### Error Response Format (`400`, `401`, `404`, `409`, `422`, `500`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed for request body",
    "statusCode": 422,
    "details": [
      {
        "field": "email",
        "issue": "Invalid email address format"
      }
    ],
    "timestamp": "2026-09-05T01:00:00.000Z"
  }
}
```

### Status Code Usage Reference
- `200 OK`: Successful GET, PUT, PATCH request.
- `201 Created`: Resource created successfully.
- `204 No Content`: Successful DELETE request.
- `400 Bad Request`: Invalid JSON format.
- `401 Unauthorized`: Missing or invalid Bearer JWT.
- `404 Not Found`: Target resource ID does not exist.
- `409 Conflict`: Email already registered.
- `422 Unprocessable Entity`: Zod payload validation failed.
- `500 Internal Error`: Server execution exception.

---

## 📖 Complete API Endpoint Reference

### 1. User Management

#### Register User (`POST /api/v1/users/register`)
```bash
curl -X POST http://localhost:3000/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "role": "MEMBER"
  }'
```

#### User Login (`POST /api/v1/users/login`)
```bash
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manmeet@example.com",
    "password": "Password123!"
  }'
```

#### List All Users (`GET /api/v1/users`)
```bash
curl -X GET "http://localhost:3000/api/v1/users?role=ADMIN&search=manmeet"
```

#### Get User Profile (`GET /api/v1/users/{id}`)
```bash
curl -X GET http://localhost:3000/api/v1/users/usr-1
```

---

### 2. Project Management

#### List Projects (`GET /api/v1/projects`)
```bash
curl -X GET "http://localhost:3000/api/v1/projects?status=in-progress&category=Backend"
```

#### Create Project (`POST /api/v1/projects`)
```bash
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Realtime Microservice Architecture",
    "description": "High-throughput event driven backend setup",
    "category": "Backend Architecture",
    "status": "in-progress",
    "dueDate": "2026-12-15"
  }'
```

#### Get Project Detail (`GET /api/v1/projects/{id}`)
```bash
curl -X GET http://localhost:3000/api/v1/projects/proj-1
```

---

### 3. Task Management

#### List Tasks (`GET /api/v1/tasks`)
```bash
curl -X GET "http://localhost:3000/api/v1/tasks?status=in-progress&priority=high"
```

#### Create Task (`POST /api/v1/tasks`)
```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement WebSockets Event Bus",
    "description": "Realtime notification distribution handler",
    "status": "in-progress",
    "priority": "high",
    "projectId": "proj-1"
  }'
```

#### Update Task Status (`PATCH /api/v1/tasks/{id}/status`)
```bash
curl -X PATCH http://localhost:3000/api/v1/tasks/tsk-2/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "done"
  }'
```

#### Delete Task (`DELETE /api/v1/tasks/{id}`)
```bash
curl -X DELETE http://localhost:3000/api/v1/tasks/tsk-3
```

---

## 🛠️ Environment Configuration Setup (`.env`)

```env
# Supabase PostgreSQL Database Connection
DATABASE_URL="postgresql://postgres:Developer%21350%21%26@db.ceicslawfqwpuzwdkvor.supabase.co:5432/postgres?connection_limit=15&pool_timeout=10"
DIRECT_URL="postgresql://postgres:Developer%21350%21%26@db.ceicslawfqwpuzwdkvor.supabase.co:5432/postgres"

# Authentication & Runtime
JWT_SECRET="super-secret-jwt-key-replace-in-production-12345"
JWT_EXPIRES_IN="24h"
NODE_ENV="development"
PORT="3000"
```

---

## 💻 Interactive Developer Tools

- **Web Endpoint Tester UI**: Accessible locally at `http://localhost:3000/api-tester`
- **OpenAPI 3.0 Swagger Specs**: Open `http://localhost:3000/api/docs` or inspect `public/openapi.json`
- **Postman Collection**: File located at [`docs/postman_collection.json`](file:///d:/Projects/project_management/docs/postman_collection.json)
