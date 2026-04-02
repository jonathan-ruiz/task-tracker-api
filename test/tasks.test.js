const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const supertest = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

const request = supertest(app);

beforeEach(() => {
  db._reset();
});

describe('GET /health', () => {
  test('returns 200 with status ok', async () => {
    const res = await request.get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });
});

describe('GET /tasks', () => {
  test('returns empty array when no tasks', async () => {
    const res = await request.get('/tasks');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, []);
  });

  test('returns all tasks', async () => {
    db.create({ title: 'Task A' });
    db.create({ title: 'Task B' });
    const res = await request.get('/tasks');
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 2);
  });

  test('filters by status', async () => {
    db.create({ title: 'Task A', status: 'pending' });
    db.create({ title: 'Task B', status: 'done' });
    const res = await request.get('/tasks?status=done');
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].title, 'Task B');
  });

  test('returns 400 for invalid status filter', async () => {
    const res = await request.get('/tasks?status=invalid');
    assert.equal(res.status, 400);
  });
});

describe('GET /tasks/:id', () => {
  test('returns task by id', async () => {
    const task = db.create({ title: 'My Task' });
    const res = await request.get(`/tasks/${task.id}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.title, 'My Task');
    assert.equal(res.body.id, task.id);
  });

  test('returns 404 for missing task', async () => {
    const res = await request.get('/tasks/999');
    assert.equal(res.status, 404);
  });

  test('returns 400 for non-numeric id', async () => {
    const res = await request.get('/tasks/abc');
    assert.equal(res.status, 400);
  });
});

describe('POST /tasks', () => {
  test('creates a task with title', async () => {
    const res = await request.post('/tasks').send({ title: 'New Task' });
    assert.equal(res.status, 201);
    assert.equal(res.body.title, 'New Task');
    assert.equal(res.body.status, 'pending');
    assert.ok(res.body.id);
    assert.ok(res.body.createdAt);
  });

  test('creates a task with all fields', async () => {
    const res = await request.post('/tasks').send({
      title: 'Full Task',
      description: 'A description',
      status: 'in-progress',
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.description, 'A description');
    assert.equal(res.body.status, 'in-progress');
  });

  test('returns 400 when title is missing', async () => {
    const res = await request.post('/tasks').send({ description: 'no title' });
    assert.equal(res.status, 400);
  });

  test('returns 400 for empty title', async () => {
    const res = await request.post('/tasks').send({ title: '   ' });
    assert.equal(res.status, 400);
  });

  test('returns 400 for invalid status', async () => {
    const res = await request.post('/tasks').send({ title: 'X', status: 'bad' });
    assert.equal(res.status, 400);
  });
});

describe('PATCH /tasks/:id', () => {
  test('updates title', async () => {
    const task = db.create({ title: 'Old Title' });
    const res = await request.patch(`/tasks/${task.id}`).send({ title: 'New Title' });
    assert.equal(res.status, 200);
    assert.equal(res.body.title, 'New Title');
  });

  test('updates status', async () => {
    const task = db.create({ title: 'Task' });
    const res = await request.patch(`/tasks/${task.id}`).send({ status: 'done' });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'done');
  });

  test('updates updatedAt timestamp', async () => {
    const task = db.create({ title: 'Task' });
    const res = await request.patch(`/tasks/${task.id}`).send({ status: 'done' });
    assert.ok(res.body.updatedAt >= task.updatedAt);
  });

  test('returns 404 for missing task', async () => {
    const res = await request.patch('/tasks/999').send({ title: 'X' });
    assert.equal(res.status, 404);
  });

  test('returns 400 for invalid status', async () => {
    const task = db.create({ title: 'Task' });
    const res = await request.patch(`/tasks/${task.id}`).send({ status: 'invalid' });
    assert.equal(res.status, 400);
  });
});

describe('DELETE /tasks/:id', () => {
  test('deletes a task', async () => {
    const task = db.create({ title: 'To Delete' });
    const res = await request.delete(`/tasks/${task.id}`);
    assert.equal(res.status, 204);
    assert.equal(db.findById(task.id), null);
  });

  test('returns 404 for missing task', async () => {
    const res = await request.delete('/tasks/999');
    assert.equal(res.status, 404);
  });
});

describe('404 handler', () => {
  test('returns 404 for unknown routes', async () => {
    const res = await request.get('/unknown');
    assert.equal(res.status, 404);
  });
});
