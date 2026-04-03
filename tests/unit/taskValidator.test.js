const { createTaskSchema, updateTaskSchema, listTasksSchema } = require('../../src/validators/taskSchemas');

describe('createTaskSchema', () => {
  it('accepts valid task with all fields', () => {
    const result = createTaskSchema.safeParse({
      title: 'My task',
      description: 'desc',
      status: 'todo',
      due_date: '2026-04-10T00:00:00.000Z',
    });
    expect(result.success).toBe(true);
    expect(result.data.title).toBe('My task');
  });

  it('uses default status todo', () => {
    const result = createTaskSchema.safeParse({ title: 'Task' });
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('todo');
  });

  it('rejects missing title', () => {
    const result = createTaskSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error.errors[0].path).toContain('title');
  });

  it('rejects empty title', () => {
    const result = createTaskSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects title over 255 chars', () => {
    const result = createTaskSchema.safeParse({ title: 'a'.repeat(256) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status', () => {
    const result = createTaskSchema.safeParse({ title: 'Task', status: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid statuses', () => {
    for (const status of ['todo', 'in_progress', 'done']) {
      const result = createTaskSchema.safeParse({ title: 'Task', status });
      expect(result.success).toBe(true);
    }
  });

  it('transforms empty due_date to null', () => {
    const result = createTaskSchema.safeParse({ title: 'Task', due_date: '' });
    expect(result.success).toBe(true);
    expect(result.data.due_date).toBeNull();
  });
});

describe('updateTaskSchema', () => {
  it('accepts partial update', () => {
    const result = updateTaskSchema.safeParse({ title: 'New title' });
    expect(result.success).toBe(true);
  });

  it('rejects empty update object', () => {
    const result = updateTaskSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects empty title string', () => {
    const result = updateTaskSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('accepts status-only update', () => {
    const result = updateTaskSchema.safeParse({ status: 'done' });
    expect(result.success).toBe(true);
  });
});

describe('listTasksSchema', () => {
  it('uses defaults', () => {
    const result = listTasksSchema.safeParse({});
    expect(result.success).toBe(true);
    expect(result.data.sort_by).toBe('created_at');
    expect(result.data.sort_order).toBe('desc');
  });

  it('accepts valid filters', () => {
    const result = listTasksSchema.safeParse({
      page: '2',
      per_page: '10',
      status: 'in_progress',
      search: 'draft',
      sort_by: 'title',
      sort_order: 'asc',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid sort_by', () => {
    const result = listTasksSchema.safeParse({ sort_by: 'hacked; DROP TABLE' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid status filter', () => {
    const result = listTasksSchema.safeParse({ status: 'unknown' });
    expect(result.success).toBe(false);
  });
});
