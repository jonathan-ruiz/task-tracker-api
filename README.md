# Task Tracker API

A RESTful Task Tracker API built with Node.js and Express. Supports full CRUD operations for tasks with an in-memory data store.

## Features

- Create, read, update, and delete tasks
- Filter tasks by status (`pending`, `in-progress`, `done`)
- Input validation with descriptive error responses
- Health check endpoint

## Requirements

- Node.js >= 18

## Setup

```bash
# Install dependencies
npm install

# Start the server (production)
npm start

# Start with file watching (development)
npm run dev
```

The server listens on port `3000` by default. Override with the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## API Reference

### Health Check

```
GET /health
```

Response:
```json
{ "status": "ok", "timestamp": "2026-04-02T00:00:00.000Z" }
```

---

### Tasks

All task endpoints are prefixed with `/tasks`.

#### List all tasks

```
GET /tasks
GET /tasks?status=pending
```

Optional query param: `status` — one of `pending`, `in-progress`, `done`.

#### Get a task

```
GET /tasks/:id
```

#### Create a task

```
POST /tasks
Content-Type: application/json

{
  "title": "Fix login bug",
  "description": "Users can't log in with SSO",
  "status": "pending"
}
```

`title` is required. `description` defaults to `""`. `status` defaults to `pending`.

Response: `201 Created` with the created task object.

#### Update a task

```
PATCH /tasks/:id
Content-Type: application/json

{
  "status": "in-progress"
}
```

All fields (`title`, `description`, `status`) are optional.

#### Delete a task

```
DELETE /tasks/:id
```

Response: `204 No Content`

---

### Task Object

```json
{
  "id": 1,
  "title": "Fix login bug",
  "description": "Users can't log in with SSO",
  "status": "pending",
  "createdAt": "2026-04-02T00:00:00.000Z",
  "updatedAt": "2026-04-02T00:00:00.000Z"
}
```

## Running Tests

```bash
npm test
```

Tests use Node.js built-in test runner with `supertest` for HTTP assertions.

## Project Structure

```
task-tracker-api/
├── src/
│   ├── server.js        # Entry point — starts HTTP server
│   ├── app.js           # Express app setup and middleware
│   ├── tasks.router.js  # Route handlers for /tasks
│   └── db.js            # In-memory data store
├── test/
│   └── tasks.test.js    # Integration tests
└── package.json
```

## Repository

https://github.com/jonathan-ruiz/task-tracker-api
