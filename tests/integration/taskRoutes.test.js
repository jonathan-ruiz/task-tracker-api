const request = require('supertest');
const app = require('../../src/app');
const { runMigrations } = require('../../src/db/migrate');
const { closeDb, getDb } = require('../../src/db/client');

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  runMigrations();
});

afterEach(() => {
  getDb().exec('DELETE FROM tasks');
});

afterAll(() => {
  closeDb();
});

describe('POST /api/v1/tasks', () => {
  it('creates a task and returns 201', async () => {
    const res = await request(app).post('/api/v1/tasks').send({ title: 'Test task' });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Test task');
    expect(res.body.data.status).toBe('todo');
    expect(res.body.data.id).toBeDefined();
  });

  it('creates task with all fields', async () => {
    const res = await request(app).post('/api/v1/tasks').send({
      title: 'Full task',
      description: 'Some description',
      status: 'in_progress',
      due_date: '2026-04-10T00:00:00.000Z',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('in_progress');
    expect(res.body.data.due_date).toBe('2026-04-10T00:00:00.000Z');
  });

  it('returns 400 when title is missing', async () => {
    const res = await request(app).post('/api/v1/tasks').send({ status: 'todo' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for invalid status', async () => {
    const res = await request(app).post('/api/v1/tasks').send({ title: 'Task', status: 'invalid' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/tasks', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/tasks').send({ title: 'Task 1', status: 'todo' });
    await request(app).post('/api/v1/tasks').send({ title: 'Task 2', status: 'in_progress' });
    await request(app).post('/api/v1/tasks').send({ title: 'Task 3', status: 'done' });
  });

  it('returns all tasks with pagination meta', async () => {
    const res = await request(app).get('/api/v1/tasks');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);
    expect(res.body.meta).toMatchObject({ page: 1, per_page: 20, total: 3 });
  });

  it('filters by status', async () => {
    const res = await request(app).get('/api/v1/tasks?status=todo');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe('todo');
  });

  it('searches by title', async () => {
    const res = await request(app).get('/api/v1/tasks?search=Task 2');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Task 2');
  });

  it('returns 400 for invalid status filter', async () => {
    const res = await request(app).get('/api/v1/tasks?status=bogus');
    expect(res.status).toBe(400);
  });

  it('paginates correctly', async () => {
    const res = await request(app).get('/api/v1/tasks?page=1&per_page=2');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta.total).toBe(3);
    expect(res.body.meta.total_pages).toBe(2);
  });

  it('returns empty second page when no more results', async () => {
    const res = await request(app).get('/api/v1/tasks?page=2&per_page=2');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });
});

describe('GET /api/v1/tasks/:id', () => {
  it('returns a task by id', async () => {
    const created = await request(app).post('/api/v1/tasks').send({ title: 'Find me' });
    const id = created.body.data.id;
    const res = await request(app).get(`/api/v1/tasks/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Find me');
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/v1/tasks/99999');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('TASK_NOT_FOUND');
  });
});

describe('PATCH /api/v1/tasks/:id', () => {
  let taskId;

  beforeEach(async () => {
    const res = await request(app).post('/api/v1/tasks').send({ title: 'Original', status: 'todo' });
    taskId = res.body.data.id;
  });

  it('updates title and status', async () => {
    const res = await request(app).patch(`/api/v1/tasks/${taskId}`).send({
      title: 'Updated',
      status: 'in_progress',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated');
    expect(res.body.data.status).toBe('in_progress');
  });

  it('updates updated_at timestamp', async () => {
    const getRes = await request(app).get(`/api/v1/tasks/${taskId}`);
    const originalUpdatedAt = getRes.body.data.updated_at;

    await new Promise(r => setTimeout(r, 10));

    const patchRes = await request(app).patch(`/api/v1/tasks/${taskId}`).send({ status: 'done' });
    expect(patchRes.body.data.updated_at).not.toBe(originalUpdatedAt);
  });

  it('returns 400 for empty patch body', async () => {
    const res = await request(app).patch(`/api/v1/tasks/${taskId}`).send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).patch('/api/v1/tasks/99999').send({ title: 'X' });
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid status', async () => {
    const res = await request(app).patch(`/api/v1/tasks/${taskId}`).send({ status: 'bad' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/v1/tasks/:id', () => {
  it('deletes a task and returns 204', async () => {
    const created = await request(app).post('/api/v1/tasks').send({ title: 'Delete me' });
    const id = created.body.data.id;

    const deleteRes = await request(app).delete(`/api/v1/tasks/${id}`);
    expect(deleteRes.status).toBe(204);

    const getRes = await request(app).get(`/api/v1/tasks/${id}`);
    expect(getRes.status).toBe(404);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/api/v1/tasks/99999');
    expect(res.status).toBe(404);
  });
});

describe('Health check', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
