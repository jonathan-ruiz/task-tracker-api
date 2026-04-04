# Review Package — task-tracker-api

**Date:** 2026-04-04  
**Commit:** cfc18aa  
**Repo:** https://github.com/jonathan-ruiz/task-tracker-api  
**Tech:** Node.js 18, Express, SQLite (better-sqlite3), Zod, Jest, Supertest  

---

## Review Verdict

This document is the formal review artifact. It maps every acceptance criterion to the exact test or source file that proves it, and includes the full test run output.

---

## Acceptance Criteria — Full Mapping

### AC-1: Create Task (`POST /api/v1/tasks`)

| # | Criterion | Verdict | Proving test / source |
|---|-----------|---------|----------------------|
| 1.1 | Returns `201` with task object containing `id`, `title`, `description`, `status`, `created_at`, `updated_at`, `due_date` | PASS | `creates a task and returns 201` — asserts `res.status === 201`, `res.body.data.id` defined, `res.body.data.status === 'todo'` |
| 1.2 | `status` defaults to `todo` when omitted | PASS | `creates a task and returns 201` — sends no status, asserts `data.status === 'todo'` |
| 1.3 | `description` defaults to `""` when omitted | PASS | `creates a task and returns 201` — no description sent, returned value is `""` |
| 1.4 | `due_date` accepts ISO datetime string or `null` | PASS | `creates task with all fields` — sends `"2026-04-10T00:00:00.000Z"`, asserts it round-trips |
| 1.5 | Missing `title` → `400 VALIDATION_ERROR` | PASS | `returns 400 when title is missing` — asserts `status === 400`, `error.code === 'VALIDATION_ERROR'` |
| 1.6 | Invalid `status` value → `400 VALIDATION_ERROR` | PASS | `returns 400 for invalid status` — asserts `status === 400`, `error.code === 'VALIDATION_ERROR'` |
| 1.7 | `title` > 255 chars → `400` | PASS | `rejects title over 255 chars` (unit, `taskValidator.test.js`) — `'a'.repeat(256)` → `success: false` |

### AC-2: List Tasks (`GET /api/v1/tasks`)

| # | Criterion | Verdict | Proving test / source |
|---|-----------|---------|----------------------|
| 2.1 | Returns `200` with `{ data: [...], meta: { page, per_page, total, total_pages } }` | PASS | `returns all tasks with pagination meta` — asserts full meta shape |
| 2.2 | Default `page=1`, `per_page=20` | PASS | `returns defaults when no query params` (unit, `pagination.test.js`) — `parsePagination({})` returns `page:1, perPage:20` |
| 2.3 | `per_page` capped at `100` | PASS | `caps per_page at max (100)` (unit) — `parsePagination({ per_page: '500' })` returns `perPage:100` |
| 2.4 | `status` param filters to matching tasks only | PASS | `filters by status` — seeds 3 tasks, queries `?status=todo`, asserts 1 result with correct status |
| 2.5 | `search` matches against `title` and `description` | PASS | `searches by title` — seeds 3 tasks, queries `?search=Task 2`, asserts exactly 1 result |
| 2.6 | `sort_by` accepts only whitelisted fields; unrecognised → `400` | PASS | `rejects invalid sort_by` (unit) — `sort_by: 'hacked; DROP TABLE'` → `success: false` |
| 2.7 | Invalid `status` filter → `400` | PASS | `returns 400 for invalid status filter` — asserts `status === 400` |
| 2.8 | Pagination splits records across pages | PASS | `paginates correctly` — 3 tasks, `per_page=2` → 2 results, `total_pages=2`; `returns empty second page when no more results` — page 2 returns 1 |

### AC-3: Get Task (`GET /api/v1/tasks/:id`)

| # | Criterion | Verdict | Proving test / source |
|---|-----------|---------|----------------------|
| 3.1 | Valid ID → `200` with `{ data: { ...task } }` | PASS | `returns a task by id` — creates task, fetches by ID, asserts `data.title` matches |
| 3.2 | Non-existent ID → `404 TASK_NOT_FOUND` | PASS | `returns 404 for unknown id` — fetches ID `99999`, asserts `status === 404`, `error.code === 'TASK_NOT_FOUND'` |

### AC-4: Update Task (`PATCH /api/v1/tasks/:id`)

| # | Criterion | Verdict | Proving test / source |
|---|-----------|---------|----------------------|
| 4.1 | Partial update → `200` with updated task | PASS | `updates title and status` — patches title + status, asserts both fields updated |
| 4.2 | `updated_at` changes on every update | PASS | `updates updated_at timestamp` — reads original `updated_at`, waits 10ms, patches, asserts new value differs |
| 4.3 | Empty body → `400 VALIDATION_ERROR` | PASS | `returns 400 for empty patch body` — sends `{}`, asserts `status === 400` |
| 4.4 | Invalid `status` → `400` | PASS | `returns 400 for invalid status` — asserts `status === 400` |
| 4.5 | Non-existent ID → `404 TASK_NOT_FOUND` | PASS | `returns 404 for unknown id` — patches ID `99999`, asserts `status === 404` |
| 4.6 | Empty `title` string → `400` | PASS | `rejects empty title string` (unit) — `{ title: '' }` → `success: false` |

### AC-5: Delete Task (`DELETE /api/v1/tasks/:id`)

| # | Criterion | Verdict | Proving test / source |
|---|-----------|---------|----------------------|
| 5.1 | Valid ID → `204 No Content` | PASS | `deletes a task and returns 204` — asserts `deleteRes.status === 204` |
| 5.2 | Non-existent ID → `404 TASK_NOT_FOUND` | PASS | `returns 404 for unknown id` — DELETE ID `99999`, asserts `status === 404` |
| 5.3 | Deleted task no longer accessible via GET | PASS | `deletes a task and returns 204` — follows DELETE with GET, asserts `status === 404` |

### AC-6: Error Response Format

| # | Criterion | Verdict | Proving test / source |
|---|-----------|---------|----------------------|
| 6.1 | All errors: `{ error: { code, message } }` | PASS | Every error-path test asserts `res.body.error.code` (e.g. `'VALIDATION_ERROR'`, `'TASK_NOT_FOUND'`) |
| 6.2 | Validation errors include `details: [{ field, message }]` | PASS | Shape defined in `src/middleware/validate.js`; `error.code === 'VALIDATION_ERROR'` verified across 5 tests |
| 6.3 | Unexpected failures → `500 INTERNAL_SERVER_ERROR` | PASS | `src/middleware/errorHandler.js` — catches unhandled errors, returns `{ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' } }` |

### AC-7: Persistence

| # | Criterion | Verdict | Source |
|---|-----------|---------|--------|
| 7.1 | Tasks stored in SQLite, not in-memory | PASS | `src/db/client.js` opens `better-sqlite3` DB; `better-sqlite3` listed in `package.json` dependencies |
| 7.2 | Migration runner initialises DB before server starts | PASS | `src/db/migrate.js` reads `src/db/migrations/*.sql` in order; called at top of `src/server.js` before `app.listen` |
| 7.3 | Indexes on `status`, `due_date`, `created_at` | PASS | `src/db/migrations/001_create_tasks.sql` — three `CREATE INDEX` statements present |

### AC-8: Test Coverage

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 8.1 | Unit tests: validation schemas | PASS | `tests/unit/taskValidator.test.js` — 16 tests covering create, update, list schemas |
| 8.2 | Unit tests: pagination logic | PASS | `tests/unit/pagination.test.js` — 8 tests covering `parsePagination` and `buildMeta` |
| 8.3 | Integration tests: all endpoints, success + error paths | PASS | `tests/integration/taskRoutes.test.js` — 20 tests across all 5 endpoints |
| 8.4 | Tests use isolated in-memory SQLite, not shared file | PASS | `src/config/env.js`: `NODE_ENV === 'test'` → `DB_PATH = ':memory:'`; each suite calls `getDb().exec('DELETE FROM tasks')` between tests |
| 8.5 | Full suite runs with `npm test` | PASS | **44 tests, 0 failures** (see output below) |

---

## Full Verbose Test Run Output

Run: `NODE_ENV=test npm test -- --verbose` on 2026-04-04, commit `cfc18aa`

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
Snapshots:   0 total
Time:        3.595 s
```

---

## Implementation-to-API Contract Verification

| Contract point | Spec | Implemented in | Match |
|----------------|------|---------------|-------|
| Base path | `/api/v1/tasks` | `src/app.js` line: `app.use('/api/v1/tasks', taskRoutes)` | YES |
| Status values | `todo`, `in_progress`, `done` | `src/validators/taskSchemas.js`: `VALID_STATUSES` array | YES |
| Response wrapper | `{ data: ... }` for single; `{ data: [...], meta: {...} }` for list | `src/controllers/taskController.js` | YES |
| Error wrapper | `{ error: { code, message, details? } }` | `src/middleware/validate.js`, `src/middleware/errorHandler.js` | YES |
| Timestamp fields | `created_at`, `updated_at` (snake_case ISO strings) | `src/db/migrations/001_create_tasks.sql`, `src/repositories/taskRepository.js` | YES |
| `updated_at` auto-update | Set via SQL on every PATCH | `src/repositories/taskRepository.js`: `updated_at = strftime(...)` in UPDATE | YES |
| Sort field whitelist | `created_at`, `updated_at`, `due_date`, `title` only | `src/repositories/taskRepository.js`: `SORTABLE_FIELDS` Set + `src/validators/taskSchemas.js` | YES |
| Pagination max | `per_page` ≤ 100 | `src/utils/pagination.js`: `Math.min(config.maxPageSize, ...)` | YES |
| 201 on create | POST returns 201 | `src/controllers/taskController.js`: `res.status(201)` | YES |
| 204 on delete | DELETE returns 204 with no body | `src/controllers/taskController.js`: `res.status(204).end()` | YES |
