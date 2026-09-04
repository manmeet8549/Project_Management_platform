# Users, Projects & Tasks REST API Documentation

A RESTful API built with Next.js App Router, Zod validation, JWT authentication, and centralized error handling.

---

## Interactive Documentation & Tools

- **Swagger UI Interactive Docs**: Open `http://localhost:3000/api/docs` in your browser.
- **OpenAPI 3.0 JSON Spec**: Located at [`public/openapi.json`](file:///d:/Projects/project_management/public/openapi.json) or `http://localhost:3000/openapi.json`.
- **Postman Collection**: Import [`docs/postman_collection.json`](file:///d:/Projects/project_management/docs/postman_collection.json) directly into Postman or Insomnia.

---

## Environment Variables Configuration

Ensure the following variables are defined in your environment or `.env` file:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET="super-secret-jwt-key-replace-in-production-12345"
JWT_EXPIRES_IN="24h"
CORS_ALLOWED_ORIGINS="*"
```

---

## Centralized Error Handling & Response Format

All API endpoints return JSON payloads following a predictable structure.

### Success Response (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 5
  }
}
```

### Error Response (`400`, `401`, `404`, `409`, `422`, `500`)
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
    "timestamp": "2026-09-05T00:00:00.000Z"
  }
}
```

### HTTP Status Code Usage Matrix
| Code | Reason | Example Scenario |
|---|---|---|
| `200` | OK | Successful GET, PATCH, PUT request |
| `201` | Created | Resource successfully created (User, Project, Task) |
| `204` | No Content | Successful DELETE request |
| `400` | Bad Request | Malformed JSON payload |
| `401` | Unauthorized | Missing or invalid Bearer JWT token |
| `404` | Not Found | Target User, Project, or Task ID does not exist |
| `409` | Conflict | Registration with an email that is already registered |
| `422` | Unprocessable Entity | Zod schema validation failed |
| `500` | Internal Error | Unhandled server exception |

---

## Endpoint Guide & Example cURL Commands

### 1. User Management Endpoints

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

#### Login User (`POST /api/v1/users/login`)
```bash
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manmeet@example.com",
    "password": "Password123!"
  }'
```

#### List Users (`GET /api/v1/users`)
```bash
curl http://localhost:3000/api/v1/users
```

---

### 2. Project Endpoints

#### List Projects (`GET /api/v1/projects`)
```bash
curl http://localhost:3000/api/v1/projects
```

#### Create Project (`POST /api/v1/projects`)
```bash
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Realtime Collaboration Engine",
    "description": "WebSockets layer for multi-user editing",
    "category": "Infrastructure",
    "status": "in-progress",
    "dueDate": "2026-12-31"
  }'
```

#### Get Project by ID (`GET /api/v1/projects/:id`)
```bash
curl http://localhost:3000/api/v1/projects/proj-1
```

---

### 3. Task Endpoints & Status Management

#### List Tasks (`GET /api/v1/tasks`)
```bash
curl http://localhost:3000/api/v1/tasks?projectId=proj-1
```

#### Create Task (`POST /api/v1/tasks`)
```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Integrate Redis Cache",
    "description": "Cache user sessions and database query results",
    "status": "todo",
    "priority": "high",
    "projectId": "proj-1",
    "assigneeId": "usr-1",
    "dueDate": "2026-09-15"
  }'
```

#### Update Task Status (`PATCH /api/v1/tasks/:id/status`)
```bash
curl -X PATCH http://localhost:3000/api/v1/tasks/tsk-2/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "done"
  }'
```

#### Delete Task (`DELETE /api/v1/tasks/:id`)
```bash
curl -X DELETE http://localhost:3000/api/v1/tasks/tsk-3
```
