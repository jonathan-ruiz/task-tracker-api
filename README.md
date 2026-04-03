# Task Tracker API

A RESTful Task Tracker API built with Node.js, Express, and SQLite. Supports full CRUD with pagination, filtering, sorting, and input validation.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express
- **Database**: SQLite via `better-sqlite3`
- **Validation**: Zod
- **Security**: Helmet, CORS
- **Testing**: Jest + Supertest

## Prerequisites

- Node.js >= 18

## Installation

```bash
npm install
```

## Environment Setup

Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

```env
PORT=3000
NODE_ENV=development
DB_PATH=./data/tasks.db
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
```

## Run Locally

```bash
# Run database migrations
npm run migrate

# Start dev server (with file watching)
npm run dev

# Start production server
npm start
```

## Run Tests

```bash
# Unit + integration tests (uses in-memory SQLite)
npm test
```

## API Endpoints

Base path: `/api/v1/tasks`

| Method   | Path               | Description          |
|----------|--------------------|----------------------|
| `POST`   | `/api/v1/tasks`    | Create a task        |
| `GET`    | `/api/v1/tasks`    | List tasks (paginated) |
| `GET`    | `/api/v1/tasks/:id`| Get a single task    |
| `PATCH`  | `/api/v1/tasks/:id`| Partially update a task |
| `DELETE` | `/api/v1/tasks/:id`| Delete a task        |
| `GET`    | `/health`          | Health check         |

### Task Object

```json
{
  "id": 1,
  "title": "Finish architecture draft",
  "description": "Write the API design and DB schema",
  "status": "todo",
  "created_at": "2026-04-03T10:00:00.000Z",
  "updated_at": "2026-04-03T10:00:00.000Z",
  "due_date": "2026-04-10T00:00:00.000Z"
}
```

Allowed `status` values: `todo`, `in_progress`, `done`

### POST /api/v1/tasks

```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "My task", "status": "todo", "due_date": "2026-04-10T00:00:00.000Z"}'
```

Response: `201 Created` with `{ "data": { ...task } }`

### GET /api/v1/tasks

Query params:

| Param        | Default      | Description                                      |
|--------------|--------------|--------------------------------------------------|
| `page`       | `1`          | Page number                                      |
| `per_page`   | `20`         | Results per page (max 100)                       |
| `status`     | —            | Filter by status: `todo`, `in_progress`, `done`  |
| `search`     | —            | Text search against title and description        |
| `due_before` | —            | ISO datetime upper bound on `due_date`           |
| `due_after`  | —            | ISO datetime lower bound on `due_date`           |
| `sort_by`    | `created_at` | `created_at`, `updated_at`, `due_date`, `title`  |
| `sort_order` | `desc`       | `asc` or `desc`                                  |

```bash
curl "http://localhost:3000/api/v1/tasks?status=todo&search=draft&page=1&per_page=10"
```

Response: `200 OK`
```json
{
  "data": [ ...tasks ],
  "meta": { "page": 1, "per_page": 10, "total": 3, "total_pages": 1 }
}
```

### GET /api/v1/tasks/:id

```bash
curl http://localhost:3000/api/v1/tasks/1
```

Response: `200 OK` with `{ "data": { ...task } }` or `404` with `TASK_NOT_FOUND`.

### PATCH /api/v1/tasks/:id

Partial updates only. At least one field required.

```bash
curl -X PATCH http://localhost:3000/api/v1/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'
```

Response: `200 OK` with updated task.

### DELETE /api/v1/tasks/:id

```bash
curl -X DELETE http://localhost:3000/api/v1/tasks/1
```

Response: `204 No Content`

## Error Responses

All errors follow a consistent shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [{ "field": "title", "message": "Title is required" }]
  }
}
```

| Code                   | HTTP Status | Trigger                        |
|------------------------|-------------|--------------------------------|
| `VALIDATION_ERROR`     | 400         | Invalid or missing input       |
| `TASK_NOT_FOUND`       | 404         | Task ID does not exist         |
| `INTERNAL_SERVER_ERROR`| 500         | Unexpected server failure      |

## Project Structure

```
task-tracker-api/
├── src/
│   ├── app.js                        # Express app, middleware, routing
│   ├── server.js                     # Entry point — starts HTTP server
│   ├── config/env.js                 # Environment config
│   ├── routes/taskRoutes.js          # Route definitions
│   ├── controllers/taskController.js # HTTP handlers
│   ├── services/taskService.js       # Business logic, pagination
│   ├── repositories/taskRepository.js# SQL queries (prepared statements)
│   ├── db/
│   │   ├── client.js                 # SQLite connection
│   │   ├── migrate.js                # Migration runner
│   │   └── migrations/
│   │       └── 001_create_tasks.sql  # Schema + indexes
│   ├── middleware/
│   │   ├── validate.js               # Zod validation middleware
│   │   └── errorHandler.js           # Global error handler
│   ├── validators/taskSchemas.js     # Zod schemas
│   └── utils/pagination.js           # Pagination helpers
└── tests/
    ├── unit/
    │   ├── taskValidator.test.js
    │   └── pagination.test.js
    └── integration/
        └── taskRoutes.test.js
```

---

## Acceptance Criteria

These are the formal criteria against which the implementation is evaluated.

### AC-1: Create Task

- `POST /api/v1/tasks` with a valid `title` returns `201` and a task object with `id`, `title`, `description`, `status`, `created_at`, `updated_at`, `due_date`
- `status` defaults to `todo` when omitted
- `description` defaults to `""` when omitted
- `due_date` accepts a valid ISO datetime string or `null`
- Missing `title` returns `400` with `code: VALIDATION_ERROR`
- Invalid `status` returns `400` with `code: VALIDATION_ERROR`
- `title` longer than 255 characters returns `400`

### AC-2: List Tasks

- `GET /api/v1/tasks` returns `200` with `{ data: [...], meta: { page, per_page, total, total_pages } }`
- Defaults: `page=1`, `per_page=20`
- `per_page` is capped at `100`
- `status` query param filters results to that status only
- `search` query param matches against `title` and `description` (case-insensitive)
- `due_before` and `due_after` filter on `due_date`
- `sort_by` accepts only whitelisted fields: `created_at`, `updated_at`, `due_date`, `title`
- `sort_order` accepts `asc` or `desc`
- Invalid `status` filter returns `400`
- Invalid `sort_by` value returns `400`

### AC-3: Get Task

- `GET /api/v1/tasks/:id` returns `200` with `{ data: { ...task } }` for a valid ID
- Non-existent ID returns `404` with `code: TASK_NOT_FOUND`

### AC-4: Update Task

- `PATCH /api/v1/tasks/:id` with at least one field returns `200` with the updated task
- `updated_at` is updated on every change
- Empty body (no fields) returns `400` with `code: VALIDATION_ERROR`
- Invalid `status` value returns `400`
- Non-existent ID returns `404` with `code: TASK_NOT_FOUND`

### AC-5: Delete Task

- `DELETE /api/v1/tasks/:id` returns `204 No Content` for a valid ID
- Non-existent ID returns `404` with `code: TASK_NOT_FOUND`
- Deleted task is no longer retrievable via `GET /api/v1/tasks/:id`

### AC-6: Error Format

- All error responses follow `{ error: { code, message } }` shape
- Validation errors include `details: [{ field, message }]`
- Unexpected errors return `500` with `code: INTERNAL_SERVER_ERROR`

### AC-7: Persistence

- Tasks are stored in SQLite, not in-memory
- Database is initialized via migration runner before server starts
- Schema includes indexes on `status`, `due_date`, and `created_at`

### AC-8: Test Coverage

- All acceptance criteria above are exercised by automated tests
- Unit tests cover: validation schemas, pagination math
- Integration tests cover: all endpoints, success and error paths
- Tests run with `npm test` and use an isolated in-memory SQLite DB

---

## Implementation Summary

| Criteria | Status | Evidence |
|---|---|---|
| AC-1 Create Task | PASS | `tests/integration/taskRoutes.test.js` — POST suite |
| AC-2 List Tasks | PASS | Integration — GET suite (pagination, filter, search, sort) |
| AC-3 Get Task | PASS | Integration — GET /:id suite |
| AC-4 Update Task | PASS | Integration — PATCH suite |
| AC-5 Delete Task | PASS | Integration — DELETE suite |
| AC-6 Error Format | PASS | All error assertions check `error.code` |
| AC-7 Persistence | PASS | `src/db/`, `better-sqlite3`, `001_create_tasks.sql` |
| AC-8 Test Coverage | PASS | 44 tests, 3 suites — all passing |

## Repository

https://github.com/jonathan-ruiz/task-tracker-api
