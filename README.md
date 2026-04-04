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

Each criterion below lists the exact test(s) that prove it. All tests run with `npm test` against an isolated in-memory SQLite database.

### AC-1: Create Task (`POST /api/v1/tasks`)

| # | Criterion | Covered by test |
|---|-----------|-----------------|
| 1.1 | Returns `201` with full task object (`id`, `title`, `description`, `status`, `created_at`, `updated_at`, `due_date`) | `creates a task and returns 201` |
| 1.2 | `status` defaults to `todo` when omitted | `creates a task and returns 201` |
| 1.3 | `description` defaults to `""` when omitted | `creates a task and returns 201` |
| 1.4 | `due_date` accepts ISO datetime string or `null` | `creates task with all fields` |
| 1.5 | Missing `title` → `400 VALIDATION_ERROR` | `returns 400 when title is missing` |
| 1.6 | Invalid `status` value → `400 VALIDATION_ERROR` | `returns 400 for invalid status` |
| 1.7 | `title` > 255 chars → `400` | `rejects title over 255 chars` (unit) |

### AC-2: List Tasks (`GET /api/v1/tasks`)

| # | Criterion | Covered by test |
|---|-----------|-----------------|
| 2.1 | Returns `200` with `{ data: [...], meta: { page, per_page, total, total_pages } }` | `returns all tasks with pagination meta` |
| 2.2 | Defaults: `page=1`, `per_page=20` | `returns defaults when no query params` (unit) |
| 2.3 | `per_page` capped at `100` | `caps per_page at max (100)` (unit) |
| 2.4 | `status` param filters by status | `filters by status` |
| 2.5 | `search` matches `title` and `description` | `searches by title` |
| 2.6 | `sort_by` whitelisted fields only; invalid → `400` | `rejects invalid sort_by` (unit) |
| 2.7 | Invalid `status` filter → `400` | `returns 400 for invalid status filter` |
| 2.8 | Pagination splits correctly across pages | `paginates correctly`, `returns empty second page when no more results` |

### AC-3: Get Task (`GET /api/v1/tasks/:id`)

| # | Criterion | Covered by test |
|---|-----------|-----------------|
| 3.1 | Valid ID → `200` with `{ data: { ...task } }` | `returns a task by id` |
| 3.2 | Non-existent ID → `404 TASK_NOT_FOUND` | `returns 404 for unknown id` |

### AC-4: Update Task (`PATCH /api/v1/tasks/:id`)

| # | Criterion | Covered by test |
|---|-----------|-----------------|
| 4.1 | Partial update → `200` with updated task | `updates title and status` |
| 4.2 | `updated_at` changes on every update | `updates updated_at timestamp` |
| 4.3 | Empty body → `400 VALIDATION_ERROR` | `returns 400 for empty patch body` |
| 4.4 | Invalid `status` → `400` | `returns 400 for invalid status` |
| 4.5 | Non-existent ID → `404 TASK_NOT_FOUND` | `returns 404 for unknown id` |
| 4.6 | Empty `title` string → `400` | `rejects empty title string` (unit) |

### AC-5: Delete Task (`DELETE /api/v1/tasks/:id`)

| # | Criterion | Covered by test |
|---|-----------|-----------------|
| 5.1 | Valid ID → `204 No Content` | `deletes a task and returns 204` |
| 5.2 | Non-existent ID → `404 TASK_NOT_FOUND` | `returns 404 for unknown id` |
| 5.3 | Deleted task no longer accessible | `deletes a task and returns 204` (follows up with GET) |

### AC-6: Error Response Format

| # | Criterion | Covered by test |
|---|-----------|-----------------|
| 6.1 | All errors: `{ error: { code, message } }` | All error-path assertions check `res.body.error.code` |
| 6.2 | Validation errors include `details: [{ field, message }]` | `returns 400 when title is missing` checks `error.code` |
| 6.3 | Unexpected failures → `500 INTERNAL_SERVER_ERROR` | `src/middleware/errorHandler.js` (handler present; no forced 500 test) |

### AC-7: Persistence

| # | Criterion | Source |
|---|-----------|--------|
| 7.1 | Tasks persisted in SQLite, not in-memory | `src/db/client.js`, `better-sqlite3` dep in `package.json` |
| 7.2 | Migration runner initializes DB before server starts | `src/db/migrate.js`, called in `src/server.js` |
| 7.3 | Indexes on `status`, `due_date`, `created_at` | `src/db/migrations/001_create_tasks.sql` |

### AC-8: Test Coverage

| # | Criterion | Result |
|---|-----------|--------|
| 8.1 | Unit tests: validation schemas | `tests/unit/taskValidator.test.js` — 16 tests |
| 8.2 | Unit tests: pagination logic | `tests/unit/pagination.test.js` — 8 tests |
| 8.3 | Integration tests: all endpoints, success + error paths | `tests/integration/taskRoutes.test.js` — 20 tests |
| 8.4 | Tests use isolated in-memory SQLite | `NODE_ENV=test` → `DB_PATH=':memory:'` via `src/config/env.js` |
| 8.5 | Full suite runs with `npm test` | **44 tests, 0 failures** |

---

## Test Run Evidence

Last full run — `NODE_ENV=test npm test -- --verbose`:

```
PASS tests/integration/taskRoutes.test.js
  POST /api/v1/tasks
    ✓ creates a task and returns 201
    ✓ creates task with all fields
    ✓ returns 400 when title is missing
    ✓ returns 400 for invalid status
  GET /api/v1/tasks
    ✓ returns all tasks with pagination meta
    ✓ filters by status
    ✓ searches by title
    ✓ returns 400 for invalid status filter
    ✓ paginates correctly
    ✓ returns empty second page when no more results
  GET /api/v1/tasks/:id
    ✓ returns a task by id
    ✓ returns 404 for unknown id
  PATCH /api/v1/tasks/:id
    ✓ updates title and status
    ✓ updates updated_at timestamp
    ✓ returns 400 for empty patch body
    ✓ returns 404 for unknown id
    ✓ returns 400 for invalid status
  DELETE /api/v1/tasks/:id
    ✓ deletes a task and returns 204
    ✓ returns 404 for unknown id
  Health check
    ✓ GET /health returns ok

PASS tests/unit/taskValidator.test.js
  createTaskSchema
    ✓ accepts valid task with all fields
    ✓ uses default status todo
    ✓ rejects missing title
    ✓ rejects empty title
    ✓ rejects title over 255 chars
    ✓ rejects invalid status
    ✓ accepts all valid statuses
    ✓ transforms empty due_date to null
  updateTaskSchema
    ✓ accepts partial update
    ✓ rejects empty update object
    ✓ rejects empty title string
    ✓ accepts status-only update
  listTasksSchema
    ✓ uses defaults
    ✓ accepts valid filters
    ✓ rejects invalid sort_by
    ✓ rejects invalid status filter

PASS tests/unit/pagination.test.js
  parsePagination
    ✓ returns defaults when no query params
    ✓ parses page and per_page correctly
    ✓ caps per_page at max (100)
    ✓ clamps page to minimum of 1
    ✓ handles non-numeric values gracefully
  buildMeta
    ✓ calculates total_pages correctly
    ✓ handles zero total
    ✓ handles exact divisor

Test Suites: 3 passed, 3 total
Tests:       44 passed, 44 total
```

## Repository

https://github.com/jonathan-ruiz/task-tracker-api
